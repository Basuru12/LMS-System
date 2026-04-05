require("dotenv").config();

const path = require("path");
const express = require("express");
const { connectDB } = require("./config/db");
const {
  getPaymentsWithRelations,
  getCoursesWithRelations,
} = require("./services/lmsService");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/api/courses", async (_req, res) => {
  try {
    const courses = await getCoursesWithRelations();
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load courses." });
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
