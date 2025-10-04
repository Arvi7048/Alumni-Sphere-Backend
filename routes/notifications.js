const express = require("express")
const Notification = require("../models/Notification")
const { auth } = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query

    const query = { recipient: req.user.id }

    if (unread === "true") {
      query.isRead = false
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Notification.countDocuments(query)
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false,
    })

    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      unreadCount,
    })
  } catch (error) {
    console.error("Get notifications error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put("/:id/read", auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id,
    })

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }

    if (!notification.isRead) {
      notification.isRead = true
      notification.readAt = new Date()
      await notification.save()
    }

    res.json({ message: "Notification marked as read" })
  } catch (error) {
    console.error("Mark notification as read error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put("/read-all", auth, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true, readAt: new Date() })

    res.json({ message: "All notifications marked as read" })
  } catch (error) {
    console.error("Mark all notifications as read error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST /api/notifications
// @desc    Create a notification (admin only)
// @access  Private (Admin)
router.post("/", auth, async (req, res) => {
  try {
    // Only allow admins to create notifications
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" })
    }

    const { recipient, type, title, message, actionUrl } = req.body

    const notification = await Notification.create({
      recipient,
      type: type || "info",
      title,
      message,
      actionUrl,
    })

    res.status(201).json(notification)
  } catch (error) {
    console.error("Create notification error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
