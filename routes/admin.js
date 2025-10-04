const express = require("express")
const User = require("../models/User")
const Job = require("../models/Job")
const Event = require("../models/Event")
const Story = require("../models/Story")
const Donation = require("../models/Donation")
const Feedback = require("../models/Feedback")
const { adminAuth } = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get("/stats", adminAuth, async (req, res) => {
  try {
    // Get user statistics
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

    // Get donation statistics
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

    // Get pending approvals
    const pendingApprovals = await Feedback.countDocuments({ status: "pending" })

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
      pendingApprovals,
    })
  } catch (error) {
    console.error("Get admin stats error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET /api/admin/recent-activity
// @desc    Get recent platform activity
// @access  Private (Admin)
router.get("/recent-activity", adminAuth, async (req, res) => {
  try {
    const activities = []

    // Get recent user registrations
    const recentUsers = await User.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).select("name createdAt")

    recentUsers.forEach((user) => {
      activities.push({
        type: "user_joined",
        message: `${user.name} joined the platform`,
        timestamp: user.createdAt,
      })
    })

    // Get recent job postings
    const recentJobs = await Job.find({ isActive: true })
      .populate("postedBy", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title postedBy createdAt")

    recentJobs.forEach((job) => {
      activities.push({
        type: "job_posted",
        message: `${job.postedBy && job.postedBy.name ? job.postedBy.name : 'Unknown User'} posted a job: ${job.title}`,
        timestamp: job.createdAt,
      })
    })

    // Get recent events
    const recentEvents = await Event.find({ isActive: true })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title createdBy createdAt")

    recentEvents.forEach((event) => {
      activities.push({
        type: "event_created",
        message: `${event.createdBy && event.createdBy.name ? event.createdBy.name : 'Unknown User'} created an event: ${event.title}`,
        timestamp: event.createdAt,
      })
    })

    // Get recent donations
    const recentDonations = await Donation.find({ status: "completed" })
      .populate("donor", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("amount donor anonymous createdAt")

    recentDonations.forEach((donation) => {
      const donorName = donation.anonymous ? "Anonymous" : donation.donor.name
      activities.push({
        type: "donation_made",
        message: `${donorName} made a donation of ₹${donation.amount}`,
        timestamp: donation.createdAt,
      })
    })

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    res.json(activities.slice(0, 6)) // Return top 6 activities
  } catch (error) {
    console.error("Get recent activity error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET /api/admin/user-growth
// @desc    Get user growth data
// @access  Private (Admin)
router.get("/user-growth", adminAuth, async (req, res) => {
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          isActive: true,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ])

    res.json(userGrowth)
  } catch (error) {
    console.error("Get user growth error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET /api/admin/users
// @desc    Get all users for admin management
// @access  Private (Admin)
router.get("/users", adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, batch, branch, role } = req.query

    const query = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ]
    }

    if (batch) {
      query.batch = Number.parseInt(batch)
    }

    if (branch) {
      query.branch = branch
    }

    if (role) {
      query.role = role
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await User.countDocuments(query)

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    })
  } catch (error) {
    console.error("Get admin users error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT /api/admin/users/:id
// @desc    Update user (admin only)
// @access  Private (Admin)
router.put("/users/:id", adminAuth, async (req, res) => {
  try {
    const { isActive, role } = req.body;
    const actingAdmin = await User.findById(req.user.id);
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Master admin protection
    if (user.masterAdmin) {
      // No one can demote or deactivate master admin
      if ((role && role !== 'admin') || (typeof isActive === 'boolean' && !isActive)) {
        return res.status(403).json({ message: "Master admin cannot be demoted or removed." });
      }
    }

    // Only master admin can promote/demote admins
    if ((role && (user.role === 'admin' || role === 'admin')) && !actingAdmin.masterAdmin) {
      return res.status(403).json({ message: "Only master admin can promote or demote admins." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        ...(typeof isActive === "boolean" && { isActive }),
        ...(role && { role }),
      },
      { new: true },
    ).select("-password");

    res.json(updatedUser);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/admin/alumni/:id/approve
// @desc    Approve pending alumni registration
// @access  Private (Admin)
router.put("/alumni/:id/approve", adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    if (user.status !== 'pending') {
      return res.status(400).json({ message: "User is not pending approval" })
    }
    user.status = 'active'
    await user.save()
    // Optionally notify user by email
    // const { sendOTPEmail } = require('../config/emailService')
    // await sendOTPEmail(user.email, '', 'approved')
    res.json({ message: "Alumni approved successfully", user })
  } catch (error) {
    console.error("Approve alumni error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT /api/admin/alumni/:id/reject
// @desc    Reject pending alumni registration and delete all associated data
// @access  Private (Admin)
router.put("/alumni/:id/reject", adminAuth, async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();
  
  try {
    const userId = req.params.id;
    
    // 1. Get user data first (we'll need it for cleanup)
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "User is not pending approval" });
    }
    
    // 2. Delete user's data from all related collections
    try {
      // Delete user's jobs
      await Job.deleteMany({ 'postedBy.user': userId }).session(session);
      
      // Delete user's events
      await Event.deleteMany({ 'organizer.user': userId }).session(session);
      
      // Delete user's stories
      await Story.deleteMany({ author: userId }).session(session);
      
      // Delete user's donations
      await Donation.deleteMany({ donor: userId }).session(session);
      
      // Delete user's feedback
      await Feedback.deleteMany({ user: userId }).session(session);
      
      // Update any other collections that might reference this user
      // For example, if there are comments, likes, etc.
      
      // 3. Finally, delete the user
      await User.findByIdAndDelete(userId).session(session);
      
      // Commit the transaction if all operations succeed
      await session.commitTransaction();
      session.endSession();
      
      // Optionally notify user by email
      // const { sendOTPEmail } = require('../config/emailService')
      // await sendOTPEmail(user.email, '', 'rejected')
      
      res.json({ 
        success: true, 
        message: "User and all associated data have been deleted successfully" 
      });
      
    } catch (error) {
      // If any operation fails, abort the transaction
      await session.abortTransaction();
      session.endSession();
      console.error("Error during user data cleanup:", error);
      throw error; // This will be caught by the outer catch block
    }
    
  } catch (error) {
    console.error("Reject alumni error:", error);
    res.status(500).json({ 
      success: false, 
      message: "An error occurred while processing the rejection" 
    });
  }
})

// @route   DELETE /api/admin/users/:id
// @desc    Permanently delete a user (admin only, no delete for master admin)
// @access  Private (Admin)
router.delete("/users/:id", adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.masterAdmin) {
      return res.status(403).json({ message: "Master admin cannot be deleted." });
    }
    await User.findByIdAndDelete(req.params.id);
    // Optionally: log deletion in Activity model
    res.json({ message: "User deleted permanently." });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router
