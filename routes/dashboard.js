const express = require("express")
const User = require("../models/User")
const Job = require("../models/Job")
const Event = require("../models/Event")
const Donation = require("../models/Donation")
const Story = require("../models/Story")
const { auth } = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics for home page
// @access  Private
router.get("/stats", auth, async (req, res) => {
  try {
    // Get user statistics (same as admin)
    const totalUsers = await User.countDocuments({ isActive: true })
    const newUsersThisMonth = await User.countDocuments({
      isActive: true,
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    })

    // Get job statistics
    const totalJobs = await Job.countDocuments()
    const activeJobs = await Job.countDocuments({ isActive: true })

    // Get event statistics
    const totalEvents = await Event.countDocuments()
    const upcomingEvents = await Event.countDocuments({
      isActive: true,
      date: { $gte: new Date() },
    })

    // Get donation statistics (same as admin)
    const donationStats = await Donation.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: null,
          totalDonations: { $sum: "$amount" },
          donationsThisMonth: {
            $sum: {
              $cond: [
                {
                  $gte: ["$createdAt", new Date(new Date().getFullYear(), new Date().getMonth(), 1)],
                },
                "$amount",
                0,
              ],
            },
          },
        },
      },
    ])

    const totalDonations = donationStats[0]?.totalDonations || 0
    const donationsThisMonth = donationStats[0]?.donationsThisMonth || 0

    // Get story statistics
    const totalStories = await Story.countDocuments({ isActive: true })

    res.json({
      totalUsers,
      newUsersThisMonth,
      totalJobs,
      activeJobs,
      totalEvents,
      upcomingEvents,
      totalDonations,
      donationsThisMonth,
      totalStories,
      // Legacy field mappings for backward compatibility
      totalAlumni: totalUsers,
    })
  } catch (error) {
    console.error("Get dashboard stats error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET /api/dashboard/activities
// @desc    Get recent activities for home page
// @access  Private
router.get("/activities", auth, async (req, res) => {
  try {
    const activities = []

    // Get admin deletions from Activity log
    const Activity = require('../models/Activity');
    const deletedJobs = await Activity.find({ action: 'delete', entityType: 'job' }).select('entityId');
    const deletedEvents = await Activity.find({ action: 'delete', entityType: 'event' }).select('entityId');
    const deletedJobIds = deletedJobs.map(a => a.entityId.toString());
    const deletedEventIds = deletedEvents.map(a => a.entityId.toString());

    // Get recent job postings (not deleted)
    const recentJobs = await Job.find({ isActive: true, _id: { $nin: deletedJobIds } })
      .populate("postedBy", "name")
      .sort({ createdAt: -1 })
      .limit(3)
      .select("title postedBy createdAt")

    recentJobs.forEach((job) => {
      if (job?.postedBy?.name) {  // Add null check
        activities.push({
          message: `${job.postedBy.name} posted a new job: ${job.title}`,
          createdAt: job.createdAt,
        })
      }
    })

    // Get recent events (not deleted)
    const recentEvents = await Event.find({ isActive: true, _id: { $nin: deletedEventIds } })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(3)
      .select("title createdBy createdAt")

    recentEvents.forEach((event) => {
      if (event?.createdBy?.name) {  // Add null check
        activities.push({
          message: `${event.createdBy.name} created an event: ${event.title}`,
          createdAt: event.createdAt,
        })
      }
    })

    // Get recent user registrations
    const recentUsers = await User.find({ isActive: true }).sort({ createdAt: -1 }).limit(2).select("name createdAt")

    recentUsers.forEach((user) => {
      if (user?.name) {  // Add null check
        activities.push({
          message: `${user.name} joined the alumni network`,
          createdAt: user.createdAt,
        })
      }
    })

    // Sort activities by date
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    res.json(activities.slice(0, 10)) // Return top 10 activities
  } catch (error) {
    console.error("Get dashboard activities error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
