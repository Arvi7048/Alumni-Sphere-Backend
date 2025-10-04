const express = require("express")
const Job = require("../models/Job")
const { auth } = require("../middleware/auth")
const { validateJob } = require("../middleware/validation")

const router = express.Router()

// @route   GET /api/jobs
// @desc    Get all job listings
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { search, type, location, page = 1, limit = 10 } = req.query

    const query = { isActive: true }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ]
    }

    // Filter by job type
    if (type) {
      query.type = type
    }

    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: "i" }
    }

    const jobs = await Job.find(query)
      .populate("postedBy", "name profileImage batch branch")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Job.countDocuments(query)

    res.json({
      jobs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    })
  } catch (error) {
    console.error("Get jobs error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST /api/jobs
// @desc    Create a new job listing
// @access  Private
router.post("/", auth, validateJob, async (req, res) => {
  try {
    console.log("[DEBUG] Incoming job data:", req.body)
    console.log("[DEBUG] Authenticated user:", req.user)
    const jobData = {
      ...req.body,
      postedBy: req.user.id,
    }
    console.log("[DEBUG] Outgoing jobData to MongoDB:", jobData)

    const job = await Job.create(jobData)
    await job.populate("postedBy", "name profileImage batch branch")
    console.log("[DEBUG] Job created successfully:", job)

    res.status(201).json(job)
  } catch (error) {
    console.error("[DEBUG] Create job error:", error)
    if (error && error.stack) {
      console.error("[DEBUG] Error stack:", error.stack)
    }
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET /api/jobs/:id
// @desc    Get job by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate("postedBy", "name profileImage batch branch company position")
      .populate("applicants", "name profileImage batch branch")

    if (!job) {
      return res.status(404).json({ message: "Job not found" })
    }

    res.json(job)
  } catch (error) {
    console.error("Get job error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST /api/jobs/:id/apply
// @desc    Apply for a job
// @access  Private
router.post("/:id/apply", auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)

    if (!job) {
      return res.status(404).json({ message: "Job not found" })
    }

    // Check if user already applied
    if (job.applicants.includes(req.user.id)) {
      return res.status(400).json({ message: "You have already applied for this job" })
    }

    // Check if user is the job poster
    if (job.postedBy.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot apply for your own job posting" })
    }

    job.applicants.push(req.user.id)
    await job.save()

    res.json({ message: "Application submitted successfully" })
  } catch (error) {
    console.error("Apply job error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT /api/jobs/:id
// @desc    Update job listing
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)

    if (!job) {
      return res.status(404).json({ message: "Job not found" })
    }

    // Check if user is the job poster
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this job" })
    }

    const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("postedBy", "name profileImage batch branch")

    res.json(updatedJob)
  } catch (error) {
    console.error("Update job error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   DELETE /api/jobs/:id
// @desc    Delete job listing
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)

    if (!job) {
      return res.status(404).json({ message: "Job not found" })
    }

    // Allow admin to delete any job, or job poster to delete their own
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to delete this job" })
    }

    await Job.findByIdAndDelete(req.params.id)

    // Log admin activity
    if (req.user.role === 'admin') {
      const Activity = require('../models/Activity');
      await Activity.create({
        user: req.user.id,
        action: 'delete',
        entityType: 'job',
        entityId: job._id,
        message: `Admin ${req.user.name} deleted job '${job.title}'.`
      });
    }

    res.json({ message: "Job deleted successfully" })
  } catch (error) {
    console.error("Delete job error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
