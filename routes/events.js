const express = require("express")
const Event = require("../models/Event")
const { auth } = require("../middleware/auth")
const { validateEvent } = require("../middleware/validation")

const router = express.Router()

// @route   GET /api/events
// @desc    Get all events
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { upcoming, search, page = 1, limit = 10 } = req.query

    const query = { isActive: true }

    // Filter for upcoming events only
    if (upcoming === "true") {
      query.date = { $gte: new Date() }
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ]
    }

    const events = await Event.find(query)
      .populate("createdBy", "name profileImage batch branch")
      .sort({ date: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Event.countDocuments(query)

    res.json({
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    })
  } catch (error) {
    console.error("Get events error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST /api/events
// @desc    Create a new event
// @access  Private
router.post("/", auth, validateEvent, async (req, res) => {
  try {
    console.log("[DEBUG] Incoming event data:", req.body)
    console.log("[DEBUG] Authenticated user:", req.user)
    const eventData = {
      ...req.body,
      createdBy: req.user.id,
    }
    console.log("[DEBUG] Outgoing eventData to MongoDB:", eventData)

    const event = await Event.create(eventData)
    await event.populate("createdBy", "name profileImage batch branch")
    console.log("[DEBUG] Event created successfully:", event)
    res.status(201).json(event)
  } catch (error) {
    console.error("[DEBUG] Create event error:", error)
    if (error && error.stack) {
      console.error("[DEBUG] Error stack:", error.stack)
    }
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET /api/events/:id
// @desc    Get event by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("createdBy", "name profileImage batch branch company position")
      .populate("rsvps", "name profileImage batch branch")

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    res.json(event)
  } catch (error) {
    console.error("Get event error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST /api/events/:id/rsvp
// @desc    RSVP to an event
// @access  Private
router.post("/:id/rsvp", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    // Check if event is in the past
    if (event.date < new Date()) {
      return res.status(400).json({ message: "Cannot RSVP to past events" })
    }

    // Check if user already RSVP'd
    if (event.rsvps.includes(req.user.id)) {
      return res.status(400).json({ message: "You have already RSVP'd to this event" })
    }

    // Check if event is full
    if (event.maxAttendees && event.rsvps.length >= event.maxAttendees) {
      return res.status(400).json({ message: "Event is full" })
    }

    event.rsvps.push(req.user.id)
    await event.save()

    res.json({ message: "RSVP successful" })
  } catch (error) {
    console.error("RSVP error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   DELETE /api/events/:id/rsvp
// @desc    Cancel RSVP to an event
// @access  Private
router.delete("/:id/rsvp", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    // Check if user has RSVP'd
    if (!event.rsvps.includes(req.user.id)) {
      return res.status(400).json({ message: "You have not RSVP'd to this event" })
    }

    event.rsvps = event.rsvps.filter((id) => id.toString() !== req.user.id)
    await event.save()

    res.json({ message: "RSVP cancelled successfully" })
  } catch (error) {
    console.error("Cancel RSVP error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    // Check if user is the event creator
    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this event" })
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "name profileImage batch branch")

    res.json(updatedEvent)
  } catch (error) {
    console.error("Update event error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    // Allow admin to delete any event, or event creator to delete their own
    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to delete this event" })
    }

    await Event.findByIdAndDelete(req.params.id)

    // Log admin activity
    if (req.user.role === 'admin') {
      const Activity = require('../models/Activity');
      await Activity.create({
        user: req.user.id,
        action: 'delete',
        entityType: 'event',
        entityId: event._id,
        message: `Admin ${req.user.name} deleted event '${event.title}'.`
      });
    }

    res.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("Delete event error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
