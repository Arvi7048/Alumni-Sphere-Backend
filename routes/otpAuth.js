const express = require("express")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const User = require("../models/User")
const OTP = require("../models/OTP")
const { auth } = require("../middleware/auth")
const { validateRegistration, validateLogin } = require("../middleware/validation")
const { generateOTP, sendOTPEmail } = require("../config/emailService")

const router = express.Router()

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  })
}

// @route   POST /api/auth/send-registration-otp
// @desc    Send OTP for registration
// @access  Public
router.post("/send-registration-otp", async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: "Email is required" })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" })
    }

    // Delete any existing OTPs for this email and type
    await OTP.deleteMany({ email, type: "registration" })

    // Generate and save OTP
    const otp = generateOTP()
    await OTP.create({
      email,
      otp,
      type: "registration",
    })

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, "registration")
    if (!emailResult.success) {
      return res.status(500).json({ message: "Failed to send OTP email" })
    }

    res.json({
      success: true,
      message: "OTP sent to your email address",
    })
  } catch (error) {
    console.error("Send registration OTP error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST /api/otp-auth/verify-registration-otp
// @desc    Verify OTP and complete registration
// @access  Public
router.post("/verify-registration-otp", validateRegistration, async (req, res) => {
  console.log('Received OTP verification request:', { body: req.body });
  
  // Set a timeout for the entire operation (30 seconds)
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error('OTP verification timed out after 30 seconds');
      return res.status(504).json({ 
        success: false, 
        message: "Request timeout. Please try again." 
      });
    }
  }, 30000);
  
  try {
    const { name, email, password, batch, branch, location, otp } = req.body;

    // Validate required fields
    if (!otp) {
      console.error('OTP is missing in request');
      return res.status(400).json({ 
        success: false,
        message: "OTP is required" 
      });
    }
    
    console.log('Validating OTP for email:', email);

    // Find and verify OTP
    const otpRecord = await OTP.findOne({
      email,
      type: "registration",
      verified: false,
      expiresAt: { $gt: new Date() }
    })

    if (!otpRecord) {
      console.error('No valid OTP record found for email:', email);
      return res.status(400).json({ 
        success: false,
        message: "No valid OTP found. Please request a new one." 
      });
    }
    
    console.log('Found OTP record:', { 
      email: otpRecord.email, 
      type: otpRecord.type,
      expiresAt: otpRecord.expiresAt,
      attempts: otpRecord.attempts 
    });

    // Verify OTP code
    if (otpRecord.otp !== otp) {
      console.error('Invalid OTP provided');
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();
      
      if (otpRecord.attempts >= 3) {
        console.log('Maximum OTP attempts reached for email:', email);
        await OTP.deleteOne({ _id: otpRecord._id });
        return res.status(400).json({ 
          success: false,
          message: "Too many invalid attempts. Please request a new OTP." 
        });
      }
      return res.status(400).json({ 
        success: false,
        message: `Invalid OTP. ${3 - otpRecord.attempts} attempts remaining.`
      });
    }

    try {
      // Mark OTP as verified
      console.log('OTP verified successfully for email:', email);
      otpRecord.verified = true;
      await otpRecord.save();

      // Check if user already exists (race condition protection)
      console.log('Checking for existing user with email:', email);
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.error('User already exists with email:', email);
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists.'
        });
      }

      // Create new user with error handling
      console.log('Creating new user with email:', email);
      try {
        const newUser = new User({
          name,
          email,
          password,
          batch,
          branch,
          location,
          status: 'pending', // Set default status
          isEmailVerified: true,
        });

        await newUser.save();
        console.log('User created successfully:', { userId: newUser._id, email });

        // Notify admin by email (truly non-blocking - don't await)
        console.log('Sending admin notification email');
        if (process.env.NODE_ENV !== 'test') {
          try {
            const { sendAdminApprovalEmail } = require('../config/emailService');
            const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
            if (adminEmail) {
              sendAdminApprovalEmail(adminEmail, newUser)
                .then(() => console.log('Admin notification email sent successfully'))
                .catch(emailError => {
                  console.error('Failed to send admin notification email (non-blocking):', emailError);
                });
            } else {
              console.warn('No admin email configured. Skipping admin notification.');
            }
          } catch (emailError) {
            console.error('Error setting up admin email notification:', emailError);
          }
        }

        // Notify admins in-app (truly non-blocking - don't await)
        console.log('Sending in-app admin notification');
        if (process.env.NODE_ENV !== 'test') {
          try {
            const { notifyAdminsOfPendingAlumni } = require('../utils/adminNotify');
            notifyAdminsOfPendingAlumni(newUser)
              .then(() => console.log('In-app admin notification sent successfully'))
              .catch(notifyError => {
                console.error('Failed to send in-app admin notification (non-blocking):', notifyError);
              });
          } catch (notifyError) {
            console.error('Error setting up in-app admin notification:', notifyError);
          }
        }

        // Clean up OTP (don't block on this)
        console.log('Cleaning up OTP records');
        await OTP.deleteMany({ email, type: "registration" });
        
        // Generate JWT token
        const token = generateToken(newUser._id);
        
        // Return success response
        res.status(201).json({
          success: true,
          message: 'Registration successful!',
          token,
          user: {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            status: newUser.status
          }
        });
        
      } catch (createError) {
        console.error('User creation error:', createError);
        throw new Error(`Failed to create user: ${createError.message}`);
      }
    } catch (error) {
      console.error('Error in OTP verification:', error);
      
      // If it's a duplicate key error (race condition)
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists.'
        });
      }
      
      throw error; // Re-throw to be caught by the outer catch
      
      console.error('Returning error response:', { errorMessage, error: error.message });
      return res.status(500).json({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } finally {
      try {
        if (session) {
          await session.endSession();
        }
      } catch (sessionError) {
        console.error('Error ending session:', sessionError);
      }
      clearTimeout(timeout); // Clear the timeout
      console.log('OTP verification process completed');
    }
  } catch (error) {
    console.error("Verify registration OTP error:", error);
    // Send detailed error in development, generic message in production
    const errorResponse = {
      message: "Server error",
      ...(process.env.NODE_ENV !== 'production' && {
        error: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      })
    };
    res.status(500).json(errorResponse);
  }
})

// @route   POST /api/auth/forgot-password
// @desc    Send OTP for password reset
// @access  Public
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: "Email is required" })
    }

    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "No user found with this email address" })
    }

    // Delete any existing OTPs for this email and type
    await OTP.deleteMany({ email, type: "forgot_password" })

    // Generate and save OTP
    const otp = generateOTP()
    await OTP.create({
      email,
      otp,
      type: "forgot_password",
    })

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, "forgot_password")
    if (!emailResult.success) {
      return res.status(500).json({ message: "Failed to send OTP email" })
    }

    res.json({
      success: true,
      message: "Password reset OTP sent to your email address",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST /api/auth/reset-password
// @desc    Reset password with OTP
// @access  Public
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required" })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" })
    }

    // Find and verify OTP
    const otpRecord = await OTP.findOne({
      email,
      otp,
      type: "forgot_password",
      verified: false,
      expiresAt: { $gt: new Date() },
    })

    if (!otpRecord) {
      // Increment attempts if OTP exists but is wrong
      const existingOtp = await OTP.findOne({
        email,
        type: "forgot_password",
        verified: false,
        expiresAt: { $gt: new Date() },
      })

      if (existingOtp) {
        existingOtp.attempts += 1
        await existingOtp.save()

        if (existingOtp.attempts >= 3) {
          await OTP.deleteOne({ _id: existingOtp._id })
          return res.status(400).json({ message: "Too many invalid attempts. Please request a new OTP." })
        }
      }

      return res.status(400).json({ message: "Invalid or expired OTP" })
    }

    // Find user and update password
    const user = await User.findOne({ email }).select("+password")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update password
    user.password = newPassword
    await user.save()

    // Clean up OTP
    await OTP.deleteMany({ email, type: "forgot_password" })

    res.json({
      success: true,
      message: "Password reset successfully",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST /api/auth/change-password
// @desc    Change password for authenticated user
// @access  Private
router.post("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" })
    }

    // Get user with password
    const user = await User.findById(req.user.id).select("+password")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error) {
    console.error("Change password error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP
// @access  Public
router.post("/resend-otp", async (req, res) => {
  try {
    const { email, type } = req.body

    if (!email || !type) {
      return res.status(400).json({ message: "Email and type are required" })
    }

    if (!["registration", "forgot_password", "email_verification"].includes(type)) {
      return res.status(400).json({ message: "Invalid OTP type" })
    }

    // For registration, check if user doesn't exist
    if (type === "registration") {
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" })
      }
    }

    // For forgot_password, check if user exists
    if (type === "forgot_password") {
      const user = await User.findOne({ email })
      if (!user) {
        return res.status(404).json({ message: "No user found with this email address" })
      }
    }

    // Delete existing OTPs
    await OTP.deleteMany({ email, type })

    // Generate and save new OTP
    const otp = generateOTP()
    await OTP.create({
      email,
      otp,
      type,
    })

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, type)
    if (!emailResult.success) {
      return res.status(500).json({ message: "Failed to send OTP email" })
    }

    res.json({
      success: true,
      message: "New OTP sent to your email address",
    })
  } catch (error) {
    console.error("Resend OTP error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
