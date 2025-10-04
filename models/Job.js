const mongoose = require("mongoose")

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [100, "Job title cannot be more than 100 characters"],
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [100, "Company name cannot be more than 100 characters"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      maxlength: [100, "Location cannot be more than 100 characters"],
    },
    type: {
      type: String,
      required: [true, "Job type is required"],
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Remote"],
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
      maxlength: [2000, "Job description cannot be more than 2000 characters"],
    },
    requirements: {
      type: String,
      trim: true,
      maxlength: [1000, "Requirements cannot be more than 1000 characters"],
      default: "",
    },
    salary: {
      type: String,
      trim: true,
      maxlength: [50, "Salary cannot be more than 50 characters"],
      default: "",
    },
    applicationUrl: {
      type: String,
      match: [/^https?:\/\/.+/, "Please provide a valid URL"],
      default: "",
    },
    applicationEmail: {
      type: String,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"],
      default: "",
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applicants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    },
  },
  {
    timestamps: true,
  },
)

// Index for search functionality
jobSchema.index({ title: "text", company: "text", location: "text" })
jobSchema.index({ type: 1, isActive: 1 })
jobSchema.index({ createdAt: -1 })

// Auto-expire jobs
jobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model("Job", jobSchema)
