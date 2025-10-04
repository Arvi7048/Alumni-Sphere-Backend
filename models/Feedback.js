const mongoose = require("mongoose")

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["feedback", "survey"],
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending",
    },
    adminNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
)

// Index for admin queries
feedbackSchema.index({ type: 1, status: 1, createdAt: -1 })
feedbackSchema.index({ user: 1 })

module.exports = mongoose.model("Feedback", feedbackSchema)
