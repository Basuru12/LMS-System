const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ enrollment: 1, paidAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
