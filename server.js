require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const { connectDB } = require("./config/db");
const {
  getPaymentsWithRelations,
  getCoursesWithRelations,
  getCourseById,
  createCourse,
  listTeachers,
} = require("./services/lmsService");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "12mb" }));

app.get("/api/courses", async (_req, res) => {
  try {
    const courses = await getCoursesWithRelations();
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load courses." });
  }
});

app.get("/api/courses/:id", async (req, res) => {
  try {
    const course = await getCourseById(req.params.id);
    if (!course) {
      res.status(404).json({ error: "Course not found." });
      return;
    }
    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load course." });
  }
});

app.get("/api/payments", async (_req, res) => {
  try {
    const payments = await getPaymentsWithRelations();
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load payments." });
  }
});

app.get("/api/teachers", async (_req, res) => {
  try {
    const teachers = await listTeachers();
    res.json(teachers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load teachers." });
  }
});

app.post("/api/courses", async (req, res) => {
  const { courseName, fee, teacher, structure, description, thumbnailUrl } = req.body ?? {};

  if (typeof courseName !== "string" || courseName.trim().length < 2 || courseName.trim().length > 150) {
    res.status(400).json({ error: "courseName must be a string between 2 and 150 characters." });
    return;
  }

  const feeNum = Number(fee);
  if (!Number.isFinite(feeNum) || feeNum < 0) {
    res.status(400).json({ error: "fee must be a non-negative number." });
    return;
  }

  if (typeof teacher !== "string" || !mongoose.isValidObjectId(teacher)) {
    res.status(400).json({ error: "teacher must be a valid ObjectId." });
    return;
  }

  const payload = {
    courseName: courseName.trim(),
    fee: feeNum,
    teacher,
    structure: typeof structure === "string" ? structure.trim().slice(0, 5000) : "",
    description: typeof description === "string" ? description.trim().slice(0, 10000) : "",
    thumbnailUrl: typeof thumbnailUrl === "string" ? thumbnailUrl.trim() : "",
  };

  try {
    const course = await createCourse(payload);
    res.status(201).json(course);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "Teacher does not exist." || msg.startsWith("Invalid teacher ObjectId")) {
      res.status(400).json({ error: msg });
      return;
    }
    if (err?.name === "ValidationError") {
      res.status(400).json({ error: msg });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Failed to create course." });
  }
});

app.use(express.static(path.join(__dirname, "public")));

async function main() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
