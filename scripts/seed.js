require("dotenv").config();

const { connectDB, disconnectDB } = require("../config/db");
const { Student, Teacher, Course, Enrollment, Payment } = require("../models");
const {
  createStudent,
  createTeacher,
  createCourse,
  enrollStudent,
  createPayment,
} = require("../services/lmsService");

async function resetCollections() {
  await Promise.all([
    Student.deleteMany({}),
    Teacher.deleteMany({}),
    Course.deleteMany({}),
    Enrollment.deleteMany({}),
    Payment.deleteMany({}),
  ]);
}

async function seed() {
  await connectDB();
  await resetCollections();

  const [teacherA, teacherB] = await Promise.all([
    createTeacher({ name: "Asha Verma", earnings: 0 }),
    createTeacher({ name: "Ravi Nair", earnings: 0 }),
  ]);

  const [studentA, studentB, studentC] = await Promise.all([
    createStudent({ name: "Anika Sharma" }),
    createStudent({ name: "Ibrahim Khan" }),
    createStudent({ name: "Meera Das" }),
  ]);

  const [courseA, courseB] = await Promise.all([
    createCourse({
      courseName: "MongoDB Fundamentals",
      fee: 12000,
      structure: "8 weeks, weekend labs",
      teacher: teacherA._id,
    }),
    createCourse({
      courseName: "Node.js API Engineering",
      fee: 15000,
      structure: "10 weeks, projects + tests",
      teacher: teacherB._id,
    }),
  ]);

  await Promise.all([
    enrollStudent({ courseId: courseA._id, studentId: studentA._id }),
    enrollStudent({ courseId: courseA._id, studentId: studentB._id }),
    enrollStudent({ courseId: courseB._id, studentId: studentC._id }),
  ]);

  await Promise.all([
    createPayment({
      student: studentA._id,
      course: courseA._id,
      amount: 12000,
      paidAt: new Date(),
    }),
    createPayment({
      student: studentB._id,
      course: courseA._id,
      amount: 6000,
      paidAt: new Date(),
    }),
    createPayment({
      student: studentC._id,
      course: courseB._id,
      amount: 15000,
      paidAt: new Date(),
    }),
  ]);

  console.log("Seed complete.");
  await disconnectDB();
}

seed().catch(async (error) => {
  console.error("Seed failed:", error.message);
  await disconnectDB();
  process.exit(1);
});
