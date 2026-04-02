const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
