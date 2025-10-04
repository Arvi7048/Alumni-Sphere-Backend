const mongoose = require("mongoose")

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [100, "Event title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
      maxlength: [1000, "Event description cannot be more than 1000 characters"],
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
      validate: {
        validator: (value) => value > new Date(),
        message: "Event date must be in the future",
      },
    },
    location: {
      type: String,
      required: [true, "Event location is required"],
      trim: true,
      maxlength: [200, "Event location cannot be more than 200 characters"],
    },
    maxAttendees: {
      type: Number,
      min: [1, "Maximum attendees must be at least 1"],
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rsvps: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Index for search and filtering
eventSchema.index({ date: 1, isActive: 1 })
eventSchema.index({ title: "text", description: "text", location: "text" })

// Virtual for checking if event is full
eventSchema.virtual("isFull").get(function () {
  return this.maxAttendees && this.rsvps.length >= this.maxAttendees
})

// Virtual for checking if event is past
eventSchema.virtual("isPast").get(function () {
  return this.date < new Date()
})

module.exports = mongoose.model("Event", eventSchema)
