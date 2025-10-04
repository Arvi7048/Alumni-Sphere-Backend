const express = require("express")
const User = require("../models/User")
const { auth } = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/users/directory
// @desc    Get alumni directory
// @access  Private
router.get("/directory", auth, async (req, res) => {
  try {
    const { search, batch, branch, location, page = 1, limit = 20 } = req.query

    const query = { isActive: true }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { position: { $regex: search, $options: "i" } },
      ]
    }

    // Filter by batch
    if (batch) {
      query.batch = Number.parseInt(batch)
    }

    // Filter by branch
    if (branch) {
      query.branch = branch
    }

    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: "i" }
    }

    const users = await User.find(query)
      .select("-password -settings")
      .sort({ name: 1 })
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
    console.error("Directory error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET /api/users/search
// @desc    Search for users for chat
// @access  Private
router.get("/search", auth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json({ success: true, data: [] });
    }

    const users = await User.find({
      _id: { $ne: req.user.id }, // Exclude the current user
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { branch: { $regex: q, $options: "i" } },
      ],
    })
      .select("name email profileImage batch branch")
      .limit(10);

    res.json({ success: true, data: users });
  } catch (error) {
    console.error("User search error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    res.json(user)
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, email, batch, branch, location, bio, company, position, linkedin, github, website } = req.body

    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } })
      if (existingUser) {
        return res.status(400).json({ message: "Email is already taken" })
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        email,
        batch,
        branch,
        location,
        bio,
        company,
        position,
        linkedin,
        github,
        website,
      },
      { new: true, runValidators: true },
    ).select("-password")

    res.json({
      success: true,
      data: updatedUser,
      message: "Profile updated successfully"
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT /api/users/settings
// @desc    Update user settings
// @access  Private
router.put("/settings", auth, async (req, res) => {
  try {
    const settings = req.body

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { settings },
      { new: true, runValidators: true },
    ).select("-password")

    res.json(updatedUser)
  } catch (error) {
    console.error("Update settings error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -settings")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(user)
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Download account data
router.get("/download-data", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const messages = await Message.find({ sender: userId });
    const stories = await Story.find({ submittedBy: userId });
    const donations = await Donation.find({ donor: userId });
    const jobs = await Job.find({ postedBy: userId });
    const events = await Event.find({ createdBy: userId });
    const activities = await Activity.find({ user: userId });
    // Optionally: conversations, RSVPs, comments, etc.
    res.setHeader("Content-Disposition", "attachment; filename=account-data.json");
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify({ user, messages, stories, donations, jobs, events, activities }));
  } catch (error) {
    console.error("Download data error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

const Message = require("../models/Message");
const Story = require("../models/Story");
const Activity = require("../models/Activity");
const Donation = require("../models/Donation");
const Job = require("../models/Job");
const Event = require("../models/Event");

// 2FA setup (mock)
router.post("/2fa/setup", auth, async (req, res) => {
  try {
    // In real implementation, generate TOTP secret or send email OTP
    // For demo, just return a mock secret
    res.json({ secret: "123456" });
  } catch (error) {
    console.error("2FA setup error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/users/delete-account
// @desc    Delete user account
// @access  Private
router.delete("/delete-account", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Delete user and all related data
    await User.findByIdAndDelete(userId);
    
    // Clear the cookie
    res.clearCookie("token");
    
    res.status(200).json({ message: "Account successfully deleted" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: "Error deleting account" });
  }
});

// 2FA verify (mock)
router.post("/2fa/verify", auth, async (req, res) => {
  try {
    // In real implementation, verify TOTP or OTP code
    const { code } = req.body;
    if (code !== "123456") {
      return res.status(400).json({ message: "Invalid code" });
    }
    // Set 2FA enabled flag in user settings
    await User.findByIdAndUpdate(req.user.id, { "settings.twoFactorEnabled": true });
    res.json({ message: "2FA enabled" });
  } catch (error) {
    console.error("2FA verify error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 2FA disable (mock)
router.post("/2fa/disable", auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { "settings.twoFactorEnabled": false });
    res.json({ message: "2FA disabled" });
  } catch (error) {
    console.error("2FA disable error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router
