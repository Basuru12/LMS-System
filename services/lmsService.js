const mongoose = require("mongoose");
const { Student, Teacher, Course, Payment } = require("../models");

function assertObjectId(id, fieldName) {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error(`Invalid ${fieldName} ObjectId: ${id}`);
  }
}

async function createStudent(payload) {
  return Student.create(payload);
}

async function createTeacher(payload) {
  return Teacher.create(payload);
}

async function createCourse(payload) {
  assertObjectId(payload.teacher, "teacher");
  const teacherExists = await Teacher.exists({ _id: payload.teacher });
  if (!teacherExists) {
    throw new Error("Teacher does not exist.");
  }
  return Course.create(payload);
}

async function enrollStudent({ courseId, studentId }) {
  assertObjectId(courseId, "courseId");
  assertObjectId(studentId, "studentId");

  const [course, student] = await Promise.all([
    Course.findById(courseId),
    Student.findById(studentId),
  ]);

  if (!course) {
    throw new Error("Course not found.");
  }
  if (!student) {
    throw new Error("Student not found.");
  }

  if (course.students.some((id) => id.equals(student._id))) {
    return course;
  }

  course.students.push(student._id);
  return course.save();
}

async function createPayment({ student, course, amount, paidAt }) {
  assertObjectId(student, "student");
  assertObjectId(course, "course");

  const [studentDoc, courseDoc] = await Promise.all([
    Student.findById(student),
    Course.findById(course),
  ]);

  if (!studentDoc) {
    throw new Error("Student does not exist.");
  }
  if (!courseDoc) {
    throw new Error("Course does not exist.");
  }

  const isEnrolled = courseDoc.students.some((id) => id.equals(studentDoc._id));
  if (!isEnrolled) {
    throw new Error("Payment rejected: student is not enrolled in the course.");
  }

  return Payment.create({
    student,
    course,
    amount,
    paidAt,
  });
}

async function getCoursesWithRelations() {
  return Course.find()
    .populate("teacher")
    .populate("students")
    .lean();
}

async function getCourseById(id) {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }
  const course = await Course.findById(id)
    .populate("teacher")
    .populate("students")
    .lean();
  return course ?? null;
}

async function getPaymentsWithRelations() {
  return Payment.find()
    .populate("student")
    .populate("course")
    .lean();
}

module.exports = {
  assertObjectId,
  createStudent,
  createTeacher,
  createCourse,
  enrollStudent,
  createPayment,
  getCoursesWithRelations,
  getCourseById,
  getPaymentsWithRelations,
};
