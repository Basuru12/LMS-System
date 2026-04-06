const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    fee: {
      type: Number,
      required: true,
      min: 0,
    },
    structure: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 10000,
    },
    thumbnailUrl: {
      type: String,
      default: "",
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

courseSchema.index({ teacher: 1, courseName: 1 });

module.exports = mongoose.model("Course", courseSchema);
