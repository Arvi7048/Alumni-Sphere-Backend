const mongoose = require("mongoose")

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["delete", "create", "update", "login", "other"],
      default: "other",
    },
    entityType: {
      type: String,
      required: true,
      enum: ["event", "job", "story", "user", "other"],
      default: "other",
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Activity", activitySchema)
