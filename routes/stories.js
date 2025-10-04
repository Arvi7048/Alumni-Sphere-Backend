const express = require("express")
const Story = require("../models/Story")
const { auth } = require("../middleware/auth")
const { validateStory } = require("../middleware/validation")

const router = express.Router()

// @route   GET /api/stories
// @desc    Get all success stories
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query

    const query = { isActive: true, isApproved: true }

    // Search functionality
    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { content: { $regex: search, $options: "i" } }]
    }

    const stories = await Story.find(query)
      .populate("submittedBy", "name profileImage batch branch company position")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Story.countDocuments(query)

    res.json({
      stories,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    })
  } catch (error) {
    console.error("Get stories error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST /api/stories
// @desc    Create a new success story
// @access  Private
const { moderateContent } = require("../utils/moderation");
router.post("/", auth, validateStory, async (req, res) => {
  try {
    const storyData = {
      ...req.body,
      submittedBy: req.user.id,
    }
    // Moderation: block inappropriate content (with fallback)
    const { content, title } = req.body;
    const toCheck = `${title || ""}\n${content || ""}`;
    try {
      const moderation = await moderateContent(toCheck);
      if (moderation.flagged) {
        return res.status(400).json({ message: "Your story contains inappropriate content and cannot be posted." });
      }
    } catch (moderationError) {
      console.warn("Moderation API failed, allowing story to proceed:", moderationError.message);
      // Continue with story creation if moderation fails
    }
    const story = await Story.create(storyData)
    await story.populate("submittedBy", "name profileImage batch branch company position")

    res.status(201).json(story)
  } catch (error) {
    console.error("Create story error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET /api/stories/:id
// @desc    Get story by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate("submittedBy", "name profileImage batch branch company position")
      .populate("comments.user", "name profileImage batch branch")

    if (!story) {
      return res.status(404).json({ message: "Story not found" })
    }

    res.json(story)
  } catch (error) {
    console.error("Get story error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST /api/stories/:id/like
// @desc    Like/unlike a story
// @access  Private
router.post("/:id/like", auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)

    if (!story) {
      return res.status(404).json({ message: "Story not found" })
    }

    const isLiked = story.likes.includes(req.user.id)

    if (isLiked) {
      // Unlike the story
      story.likes = story.likes.filter((id) => id.toString() !== req.user.id)
    } else {
      // Like the story
      story.likes.push(req.user.id)
    }

    await story.save()

    res.json({
      message: isLiked ? "Story unliked" : "Story liked",
      likes: story.likes.length,
    })
  } catch (error) {
    console.error("Like story error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST /api/stories/:id/comment
// @desc    Add a comment to a story
// @access  Private
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { text } = req.body

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Comment text is required" })
    }

    const story = await Story.findById(req.params.id)

    if (!story) {
      return res.status(404).json({ message: "Story not found" })
    }

    const newComment = {
      user: req.user.id,
      text: text.trim(),
    }

    story.comments.push(newComment)
    await story.save()

    await story.populate("comments.user", "name profileImage batch branch")

    res.status(201).json(story.comments[story.comments.length - 1])
  } catch (error) {
    console.error("Add comment error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT /api/stories/:id
// @desc    Update story
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)

    if (!story) {
      return res.status(404).json({ message: "Story not found" })
    }

    // Check if user is the story author
    if (story.submittedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this story" })
    }

    const updatedStory = await Story.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("submittedBy", "name profileImage batch branch company position")

    res.json(updatedStory)
  } catch (error) {
    console.error("Update story error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   DELETE /api/stories/:id
// @desc    Delete story
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)

    if (!story) {
      return res.status(404).json({ message: "Story not found" })
    }

    // Allow if user is the story author or an admin
    if (story.submittedBy.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this story" })
    }

    await Story.findByIdAndDelete(req.params.id)

    res.json({ message: "Story deleted successfully" })
  } catch (error) {
    console.error("Delete story error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
