const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    masterAdmin: {
      type: Boolean,
      default: false,
    },
    batch: {
      type: Number,
      required: [true, "Graduation year is required"],
      min: [1950, "Invalid graduation year"],
      max: [new Date().getFullYear(), "Invalid graduation year"],
    },
    branch: {
      type: String,
      required: [true, "Branch is required"],
      trim: true,
      maxlength: [50, "Branch cannot be more than 50 characters"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      maxlength: [100, "Location cannot be more than 100 characters"],
    },
    profileImage: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot be more than 500 characters"],
      default: "",
    },
    company: {
      type: String,
      maxlength: [100, "Company name cannot be more than 100 characters"],
      default: "",
    },
    position: {
      type: String,
      maxlength: [100, "Position cannot be more than 100 characters"],
      default: "",
    },
    linkedin: {
      type: String,
      match: [/^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/, "Please provide a valid LinkedIn URL"],
      default: "",
    },
    github: {
      type: String,
      match: [/^https?:\/\/(www\.)?github\.com\/[\w-]+\/?$/, "Please provide a valid GitHub URL"],
      default: "",
    },
    website: {
      type: String,
      match: [/^https?:\/\/.+/, "Please provide a valid website URL"],
      default: "",
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'rejected'],
      default: 'pending',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    settings: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      profileVisibility: {
        type: String,
        enum: ["public", "alumni", "connections", "private"],
        default: "public",
      },
      showEmail: { type: Boolean, default: false },
      allowMessages: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  },
)

// Index for search functionality
userSchema.index({ name: "text", company: "text", position: "text" })
userSchema.index({ batch: 1, branch: 1, location: 1 })

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next()
  }

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// Update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date()
  return this.save()
}

module.exports = mongoose.model("User", userSchema)
