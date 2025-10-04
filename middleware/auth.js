const jwt = require("jsonwebtoken")
const User = require("../models/User")

// Regular authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select("-password")

    if (!user) {
      return res.status(401).json({ message: "Token is not valid" })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" })
  }
}

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin required." })
      }
      next()
    })
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" })
  }
}

// Socket.io authentication middleware
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token

    if (!token) {
      return next(new Error("Authentication error"))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select("-password")

    if (!user) {
      return next(new Error("Authentication error"))
    }

    socket.userId = user._id.toString()
    socket.user = user
    next()
  } catch (error) {
    next(new Error("Authentication error"))
  }
}

module.exports = { auth, adminAuth, socketAuth }
