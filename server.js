require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const { connectDB } = require("./config/db");
const { Teacher } = require("./models");
const {
  getPaymentsWithRelations,
  getCoursesWithRelations,
  getCourseById,
  createCourse,
  listTeachers,
  getEnrollmentRows,
  getInstructorDashboard,
} = require("./services/lmsService");

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-session-secret";

app.use(cookieParser());
app.use(express.json({ limit: "12mb" }));
app.use(
  session({
    name: "lms.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

function requireTeacherAuth(req, res, next) {
  const teacherId = req.session?.teacherId;
  if (!teacherId || !mongoose.isValidObjectId(teacherId)) {
    res.status(401).json({ error: "Unauthorized. Please login as a teacher." });
    return;
  }
  next();
}

function cleanUsername(value) {
  return String(value || "").trim().toLowerCase();
}

app.post("/api/teacher/login", async (req, res) => {
  const username = cleanUsername(req.body?.username);
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!username || !password) {
    res.status(400).json({ error: "username and password are required." });
    return;
  }

  try {
    const teacher = await Teacher.findOne({ username }).select("_id name username passwordHash").lean();
    if (!teacher || !teacher.passwordHash) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    const isValid = await bcrypt.compare(password, teacher.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    req.session.teacherId = String(teacher._id);
    req.session.teacherName = teacher.name;
    res.json({
      teacher: {
        id: String(teacher._id),
        name: teacher.name,
        username: teacher.username,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed." });
  }
});

app.get("/api/teacher/me", async (req, res) => {
  const teacherId = req.session?.teacherId;
  if (!teacherId || !mongoose.isValidObjectId(teacherId)) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  try {
    const teacher = await Teacher.findById(teacherId).select("_id name username").lean();
    if (!teacher) {
      req.session.destroy(() => {});
      res.status(401).json({ error: "Not authenticated." });
      return;
    }

    res.json({
      teacher: {
        id: String(teacher._id),
        name: teacher.name,
        username: teacher.username,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load current teacher." });
  }
});

app.post("/api/teacher/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("lms.sid");
    res.json({ ok: true });
  });
});

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

app.get("/api/payments", requireTeacherAuth, async (_req, res) => {
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

app.get("/api/enrollments", requireTeacherAuth, async (_req, res) => {
  try {
    const rows = await getEnrollmentRows();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load enrollments." });
  }
});

app.get("/api/instructor-dashboard", requireTeacherAuth, async (req, res) => {
  try {
    const dashboard = await getInstructorDashboard({ teacherId: req.session.teacherId });
    res.json(dashboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load instructor dashboard." });
  }
});

app.post("/api/courses", requireTeacherAuth, async (req, res) => {
  const { courseName, fee, structure, description, thumbnailUrl } = req.body ?? {};
  const teacher = req.session.teacherId;

  if (typeof courseName !== "string" || courseName.trim().length < 2 || courseName.trim().length > 150) {
    res.status(400).json({ error: "courseName must be a string between 2 and 150 characters." });
    return;
  }

  const feeNum = Number(fee);
  if (!Number.isFinite(feeNum) || feeNum < 0) {
    res.status(400).json({ error: "fee must be a non-negative number." });
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
