const express = require("express")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const { auth } = require("../middleware/auth")
const { validateRegistration, validateLogin } = require("../middleware/validation")

const router = express.Router()

const nodemailer = require("nodemailer");
// Generate JWT token with custom expiry
const generateToken = (id, expiresIn = "30d") => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn,
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", validateRegistration, async (req, res) => {
  try {
    const { name, email, password, batch, branch, location } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" })
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      batch,
      branch,
      location,
    })

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        batch: user.batch,
        branch: user.branch,
        location: user.location,
        role: user.role,
        profileImage: user.profileImage,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Server error during registration" })
  }
})

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body

    // Check if user exists and include password for comparison
    const user = await User.findOne({ email }).select("+password")
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: "Account has been deactivated" })
    }
    // Handle user status and role-based authentication
    if (user.status === 'pending') {
      if (user.role === 'admin') {
        // Auto-approve admin users on first login
        user.status = 'active';
        await user.save();
      } else {
        return res.status(403).json({ 
          success: false,
          message: "Your registration is pending admin approval.",
          code: "PENDING_APPROVAL"
        });
      }
    } else if (user.status === 'rejected') {
      return res.status(403).json({ 
        success: false,
        message: "Your registration was rejected by admin.",
        code: "REJECTED"
      });
    } else if (!user.isActive) {
      return res.status(403).json({ 
        success: false,
        message: "Your account has been deactivated.",
        code: "ACCOUNT_DEACTIVATED"
      });
    }

    // Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials",
        code: "INVALID_CREDENTIALS"
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Determine session timeout
    let expiresIn = "30d";
    if (user.settings?.sessionTimeout !== undefined) {
      expiresIn = user.settings.sessionTimeout === 0 
        ? "365d" // Never expire (practically)
        : `${user.settings.sessionTimeout}m`;
    }

    // Generate token with user data
    const token = generateToken(user._id, expiresIn);
    
    // Prepare user data for response (exclude sensitive information)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      profileImage: user.profileImage,
      batch: user.batch,
      branch: user.branch,
      location: user.location,
      settings: user.settings
    };

    // Send login alert if enabled
    if (user.settings?.loginAlerts) {
      try {
        const transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "New Login Alert",
          text: `A new login to your Alumni Platform account was detected at ${new Date().toLocaleString()}. If this wasn't you, please reset your password immediately.`,
        });
      } catch (err) {
        console.error("Login alert email failed:", err);
      }
    }

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        batch: user.batch,
        branch: user.branch,
        location: user.location,
        role: user.role,
        profileImage: user.profileImage,
        bio: user.bio,
        company: user.company,
        position: user.position,
        linkedin: user.linkedin,
        github: user.github,
        website: user.website,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error during login" })
  }
})

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    res.json(user)
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.put("/update-profile", auth, async (req, res) => {
  try {
    const {
      name,
      bio,
      company,
      position,
      location,
      linkedin,
      github,
      website,
      batch,
      branch,
      profileImage
    } = req.body

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update user fields
    if (name !== undefined) user.name = name
    if (bio !== undefined) user.bio = bio
    if (company !== undefined) user.company = company
    if (position !== undefined) user.position = position
    if (location !== undefined) user.location = location
    if (linkedin !== undefined) user.linkedin = linkedin
    if (github !== undefined) user.github = github
    if (website !== undefined) user.website = website
    if (batch !== undefined) user.batch = batch
    if (branch !== undefined) user.branch = branch
    if (profileImage !== undefined) user.profileImage = profileImage

    await user.save()

    // Return updated user data (exclude sensitive information)
    const updatedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      batch: user.batch,
      branch: user.branch,
      location: user.location,
      role: user.role,
      profileImage: user.profileImage,
      bio: user.bio,
      company: user.company,
      position: user.position,
      linkedin: user.linkedin,
      github: user.github,
      website: user.website,
    }

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

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "User not found with this email" })
    }

    // In a real application, you would:
    // 1. Generate a password reset token
    // 2. Save it to the database with expiration
    // 3. Send an email with the reset link

    // For demo purposes, we'll just return success
    res.json({
      success: true,
      message: "Password reset email sent (demo mode - check console)",
    })

    console.log(`Password reset requested for: ${email}`)
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
