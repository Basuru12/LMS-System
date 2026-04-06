require("dotenv").config();

const { connectDB, disconnectDB } = require("../config/db");
const { Student, Teacher, Course, Enrollment, Payment } = require("../models");
const {
  getCoursesWithRelations,
  getPaymentsWithRelations,
} = require("../services/lmsService");

async function verify() {
  await connectDB();

  const [studentCount, teacherCount, courseCount, enrollmentCount, paymentCount] =
    await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Payment.countDocuments(),
    ]);

  const [courses, payments] = await Promise.all([
    getCoursesWithRelations(),
    getPaymentsWithRelations(),
  ]);

  console.log("Counts:", {
    students: studentCount,
    teachers: teacherCount,
    courses: courseCount,
    enrollments: enrollmentCount,
    payments: paymentCount,
  });

  console.log("Sample Course:", courses[0] || null);
  console.log("Sample Payment:", payments[0] || null);

  await disconnectDB();
}

verify().catch(async (error) => {
  console.error("Verify failed:", error.message);
  await disconnectDB();
  process.exit(1);
});
