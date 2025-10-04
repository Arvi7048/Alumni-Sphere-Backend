const mongoose = require("mongoose")

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Donation amount is required"],
      min: [1, "Donation amount must be at least $1"],
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, "Message cannot be more than 500 characters"],
      default: "",
    },
    anonymous: {
      type: Boolean,
      default: false,
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "debit_card", "paypal", "bank_transfer"],
      default: "credit_card",
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// Index for reporting and analytics
donationSchema.index({ createdAt: -1 })
donationSchema.index({ donor: 1, createdAt: -1 })
donationSchema.index({ status: 1 })

module.exports = mongoose.model("Donation", donationSchema)
