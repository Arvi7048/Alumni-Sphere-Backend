const mongoose = require("mongoose")

const storySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Story title is required"],
      trim: true,
      maxlength: [150, "Story title cannot be more than 150 characters"],
    },
    content: {
      type: String,
      required: [true, "Story content is required"],
      trim: true,
      maxlength: [5000, "Story content cannot be more than 5000 characters"],
    },
    image: {
      type: String,
      default: null,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: {
          type: String,
          required: true,
          trim: true,
          maxlength: [500, "Comment cannot be more than 500 characters"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isApproved: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Index for search functionality
storySchema.index({ title: "text", content: "text" })
storySchema.index({ createdAt: -1 })
storySchema.index({ isApproved: 1, isActive: 1 })

// Virtual for like count
storySchema.virtual("likeCount").get(function () {
  return this.likes.length
})

// Virtual for comment count
storySchema.virtual("commentCount").get(function () {
  return this.comments.length
})

module.exports = mongoose.model("Story", storySchema)
