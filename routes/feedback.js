const express = require("express")
const Feedback = require("../models/Feedback")
const { auth, adminAuth } = require("../middleware/auth")

const router = express.Router()

// @route   POST /api/feedback
// @desc    Submit feedback or survey
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const { type, data } = req.body

    if (!type || !data) {
      return res.status(400).json({ message: "Type and data are required" })
    }

    if (!["feedback", "survey"].includes(type)) {
      return res.status(400).json({ message: "Invalid feedback type" })
    }

    const feedback = await Feedback.create({
      user: req.user.id,
      type,
      data,
    })

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback: {
        id: feedback._id,
        type: feedback.type,
        status: feedback.status,
        createdAt: feedback.createdAt,
      },
    })
  } catch (error) {
    console.error("Submit feedback error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET /api/feedback
// @desc    Get all feedback (admin only)
// @access  Private (Admin)
router.get("/", adminAuth, async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query

    const query = {}

    if (type) {
      query.type = type
    }

    if (status) {
      query.status = status
    }

    const feedback = await Feedback.find(query)
      .populate("user", "name email batch branch")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Feedback.countDocuments(query)

    res.json({
      feedback,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    })
  } catch (error) {
    console.error("Get feedback error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT /api/feedback/:id
// @desc    Update feedback status (admin only)
// @access  Private (Admin)
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const { status, adminNotes } = req.body

    const feedback = await Feedback.findById(req.params.id)

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" })
    }

    if (status && !["pending", "reviewed", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      {
        ...(status && { status }),
        ...(adminNotes && { adminNotes }),
      },
      { new: true },
    ).populate("user", "name email batch branch")

    res.json(updatedFeedback)
  } catch (error) {
    console.error("Update feedback error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
