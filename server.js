const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const { createServer } = require("http")
const { Server } = require("socket.io")
const path = require("path")
const dotenv = require("dotenv")

// Load environment variables
require('dotenv').config();

// Verify required environment variables
const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'NODE_ENV'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('ERROR: Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

// Log environment info (don't log sensitive data)
console.log('Environment:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- Node Version:', process.version);
console.log('- Database:', process.env.MONGO_URI ? 'Configured' : 'Not configured');
console.log('- Frontend URL:', process.env.FRONTEND_URL || 'Not set');
console.log('- Email Service:', process.env.EMAIL_SERVICE || 'Not configured');

const connectDB = require("./config/database")
const { errorHandler } = require("./middleware/errorHandler")
const { socketAuth } = require("./middleware/auth")
const paytmRoutes = require('./routes/paytm');
const paytmCallbackRoutes = require('./routes/paytmCallback');

// Import routes
const authRoutes = require("./routes/auth")
const otpAuthRoutes = require("./routes/otpAuth")
const userRoutes = require("./routes/users")
const jobRoutes = require("./routes/jobs")
const eventRoutes = require("./routes/events")
const storyRoutes = require("./routes/stories")
const chatRoutes = require("./routes/chat")
const donationRoutes = require("./routes/donations")
const feedbackRoutes = require("./routes/feedback")
const notificationRoutes = require("./routes/notifications")
const uploadRoutes = require("./routes/upload")
const adminRoutes = require("./routes/admin")
const dashboardRoutes = require("./routes/dashboard")
const aiRoutes = require("./routes/ai")

const app = express()
const server = createServer(app)

// Connect to MongoDB
connectDB()

// Security middleware
// Allow cross-origin resource loading for static images (uploads) to prevent NotSameOrigin blocking
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))
// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL, // optional custom frontend URL from env
  'http://localhost:3000',
  'http://127.0.0.1:3000',

].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    // In development, allow all origins for easier testing
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // In other environments, allow only specific domains
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));

// Rate limiting - disabled in development
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
  })
  app.use("/api/", limiter)
}

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
const profilesDir = path.join(uploadsDir, 'profiles');

// Create directories if they don't exist
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(profilesDir)) fs.mkdirSync(profilesDir);

// Serve static files with proper headers
app.use('/api/uploads', express.static(uploadsDir, {
  setHeaders: (res, path) => {
    res.set('Cache-Control', 'public, max-age=31536000');
  }
}));

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/otp-auth", otpAuthRoutes)
app.use("/api/users", userRoutes)
app.use("/api/jobs", jobRoutes)
app.use("/api/events", eventRoutes)
app.use("/api/stories", storyRoutes)
app.use("/api/chat", chatRoutes)
app.use("/api/donations", donationRoutes)
app.use("/api/feedback", feedbackRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/upload", uploadRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/ai", aiRoutes)
app.use('/api/paytm', paytmRoutes);
app.use('/api/paytm', paytmCallbackRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Error handling middleware
app.use(errorHandler)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" })
})

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
})

// Socket.io middleware for authentication
io.use(socketAuth)

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`User ${socket.userId} connected`)

  // Join user to their personal room
  socket.join(`user_${socket.userId}`)

  // Handle joining conversation rooms
  socket.on("joinConversation", (conversationId) => {
    socket.join(`conversation_${conversationId}`)
  })

  // Handle leaving conversation rooms
  socket.on("leaveConversation", (conversationId) => {
    socket.leave(`conversation_${conversationId}`)
  })

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`User ${socket.userId} disconnected`)
  })
})

// Make io available to routes
app.set("io", io)

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV}`)
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully")
  server.close(() => {
    console.log("Process terminated")
  })
})
