const mongoose = require("mongoose");
const { Student, Teacher, Course, Enrollment, Payment } = require("../models");

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

  const [course, student] = await Promise.all([Course.findById(courseId), Student.findById(studentId)]);

  if (!course) {
    throw new Error("Course not found.");
  }
  if (!student) {
    throw new Error("Student not found.");
  }

  return Enrollment.findOneAndUpdate(
    { course: course._id, student: student._id },
    { $setOnInsert: { enrolledAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function getEnrollmentRows() {
  const enrollments = await Enrollment.find()
    .populate("student", "name")
    .populate("course", "courseName")
    .select("student course enrolledAt createdAt updatedAt")
    .lean();

  const rows = enrollments
    .filter((e) => e.student?.name && e.course?.courseName)
    .map((e) => ({
      studentId: String(e.student._id),
      studentName: e.student.name,
      courseTitle: e.course.courseName,
      enrolledAt: e.enrolledAt || e.updatedAt || e.createdAt,
    }));

  rows.sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt));
  return rows;
}

async function createPayment({ student, course, enrollment, amount, paidAt }) {
  if (enrollment) {
    assertObjectId(enrollment, "enrollment");
  } else {
    assertObjectId(student, "student");
    assertObjectId(course, "course");
  }

  let enrollmentDoc = null;

  if (enrollment) {
    enrollmentDoc = await Enrollment.findById(enrollment);
    if (!enrollmentDoc) {
      throw new Error("Enrollment does not exist.");
    }
  } else {
    const [studentDoc, courseDoc] = await Promise.all([Student.findById(student), Course.findById(course)]);
    if (!studentDoc) {
      throw new Error("Student does not exist.");
    }
    if (!courseDoc) {
      throw new Error("Course does not exist.");
    }

    enrollmentDoc = await Enrollment.findOne({ student: studentDoc._id, course: courseDoc._id });
    if (!enrollmentDoc) {
      throw new Error("Payment rejected: student is not enrolled in the course.");
    }
  }

  return Payment.create({
    enrollment: enrollmentDoc._id,
    amount,
    paidAt,
  });
}

async function getCoursesWithRelations() {
  const courses = await Course.find().populate("teacher").lean();
  const counts = await Enrollment.aggregate([
    { $group: { _id: "$course", enrollmentCount: { $sum: 1 } } },
  ]);
  const countByCourse = new Map(counts.map((c) => [String(c._id), c.enrollmentCount]));
  return courses.map((course) => ({
    ...course,
    enrollmentCount: countByCourse.get(String(course._id)) ?? 0,
  }));
}

async function getCourseById(id) {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }
  const [course, countAgg] = await Promise.all([
    Course.findById(id).populate("teacher").lean(),
    Enrollment.aggregate([
      { $match: { course: new mongoose.Types.ObjectId(id) } },
      { $count: "enrollmentCount" },
    ]),
  ]);
  if (!course) {
    return null;
  }
  course.enrollmentCount = countAgg[0]?.enrollmentCount ?? 0;
  return course ?? null;
}

async function getPaymentsWithRelations() {
  const payments = await Payment.find()
    .populate({
      path: "enrollment",
      populate: [
        { path: "student" },
        { path: "course" },
      ],
    })
    .lean();

  return payments.map((p) => ({
    ...p,
    student: p.enrollment?.student ?? null,
    course: p.enrollment?.course ?? null,
  }));
}

async function listTeachers() {
  return Teacher.find().select("name").sort({ name: 1 }).lean();
}

async function getInstructorDashboard({ teacherId, latestLimit = 8 } = {}) {
  let teacher = null;

  if (teacherId && mongoose.isValidObjectId(teacherId)) {
    teacher = await Teacher.findById(teacherId).select("name").lean();
  } else {
    teacher = await Teacher.findOne().select("name").sort({ name: 1 }).lean();
  }

  if (!teacher?._id) {
    return {
      teacher: null,
      summary: { totalEnrollments: 0, totalCourses: 0, totalEarnings: 0 },
      latestEnrollments: [],
    };
  }

  const courses = await Course.find({ teacher: teacher._id }).select("_id courseName").lean();
  const courseIds = courses.map((course) => course._id);

  if (courseIds.length === 0) {
    return {
      teacher: { id: String(teacher._id), name: teacher.name },
      summary: { totalEnrollments: 0, totalCourses: 0, totalEarnings: 0 },
      latestEnrollments: [],
    };
  }

  const [totalEnrollments, latestEnrollmentDocs, earningsAgg] = await Promise.all([
    Enrollment.countDocuments({ course: { $in: courseIds } }),
    Enrollment.find({ course: { $in: courseIds } })
      .populate("student", "name")
      .populate("course", "courseName")
      .sort({ enrolledAt: -1, createdAt: -1 })
      .limit(Math.max(1, Number(latestLimit) || 8))
      .lean(),
    Payment.aggregate([
      {
        $lookup: {
          from: "enrollments",
          localField: "enrollment",
          foreignField: "_id",
          as: "enrollmentDoc",
        },
      },
      { $unwind: "$enrollmentDoc" },
      { $match: { "enrollmentDoc.course": { $in: courseIds } } },
      { $group: { _id: null, totalEarnings: { $sum: "$amount" } } },
    ]),
  ]);

  const latestEnrollments = latestEnrollmentDocs
    .filter((e) => e.student?.name && e.course?.courseName)
    .map((e) => ({
      studentId: String(e.student._id),
      studentName: e.student.name,
      courseTitle: e.course.courseName,
      enrolledAt: e.enrolledAt || e.updatedAt || e.createdAt,
    }));

  return {
    teacher: { id: String(teacher._id), name: teacher.name },
    summary: {
      totalEnrollments,
      totalCourses: courses.length,
      totalEarnings: earningsAgg[0]?.totalEarnings ?? 0,
    },
    latestEnrollments,
  };
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
  listTeachers,
  getEnrollmentRows,
  getInstructorDashboard,
};
