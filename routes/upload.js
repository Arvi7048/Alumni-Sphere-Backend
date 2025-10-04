const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { auth } = require("../middleware/auth")
const User = require("../models/User")

const router = express.Router()

// Ensure uploads directory exists
const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, "../uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(uploadsDir, req.uploadType || "general")
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb(new Error("Only image files are allowed"))
  }
}

const upload = multer({
  storage,
  limits: {
    fileSize: Number.parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter,
})

// @route   POST /api/upload/profile-image
// @desc    Upload profile image
// @access  Private
router.post("/profile-image", auth, (req, res) => {
  req.uploadType = "profiles"

  upload.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message })
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    try {
       // Only save the relative path to the database
    const imageUrl = `/uploads/profiles/${req.file.filename}`

    await User.findByIdAndUpdate(req.user.id, { profileImage: imageUrl })

    res.json({
        message: "Profile image uploaded successfully",
        imageUrl, // Return the relative path to the frontend
    })
    } catch (error) {
      console.error("Profile image upload error:", error)
      res.status(500).json({ message: "Server error" })
    }
  })
})

// @route   POST /api/upload/story-image
// @desc    Upload story image
// @access  Private
router.post("/story-image", auth, (req, res) => {
  req.uploadType = "stories"

  upload.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message })
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    try {
      const imageUrl = `/uploads/stories/${req.file.filename}`

      res.json({
        message: "Story image uploaded successfully",
        imageUrl,
      })
    } catch (error) {
      console.error("Story image upload error:", error)
      res.status(500).json({ message: "Server error" })
    }
  })
})

// @route   POST /api/upload/general
// @desc    Upload general file
// @access  Private
router.post("/general", auth, (req, res) => {
  req.uploadType = "general"

  upload.single("file")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message })
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    try {
      const fileUrl = `/uploads/general/${req.file.filename}`

      res.json({
        message: "File uploaded successfully",
        fileUrl,
        originalName: req.file.originalname,
        size: req.file.size,
      })
    } catch (error) {
      console.error("File upload error:", error)
      res.status(500).json({ message: "Server error" })
    }
  })
})

module.exports = router
