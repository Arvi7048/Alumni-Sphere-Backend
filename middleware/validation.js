const { body, validationResult } = require("express-validator")

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array(),
    })
  }
  next()
}

// User registration validation
const validateRegistration = [
  body("name").trim().isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  body("batch")
    .isInt({ min: 1950, max: new Date().getFullYear() })
    .withMessage("Please provide a valid graduation year"),
  body("branch").trim().isLength({ min: 2, max: 50 }).withMessage("Branch must be between 2 and 50 characters"),
  body("location").trim().isLength({ min: 2, max: 100 }).withMessage("Location must be between 2 and 100 characters"),
  validate,
]

// User login validation
const validateLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
]

// Job posting validation
const validateJob = [
  body("title").trim().isLength({ min: 5, max: 100 }).withMessage("Job title must be between 5 and 100 characters"),
  body("company")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Company name must be between 2 and 100 characters"),
  body("location").trim().isLength({ min: 2, max: 100 }).withMessage("Location must be between 2 and 100 characters"),
  body("type")
    .isIn(["Full-time", "Part-time", "Contract", "Internship", "Remote"])
    .withMessage("Please select a valid job type"),
  body("description")
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage("Job description must be between 50 and 2000 characters"),
  validate,
]

// Event validation
const validateEvent = [
  body("title").trim().isLength({ min: 5, max: 100 }).withMessage("Event title must be between 5 and 100 characters"),
  body("description")
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage("Event description must be between 20 and 1000 characters"),
  body("date").isISO8601().withMessage("Please provide a valid date"),
  body("location").trim().isLength({ min: 5, max: 200 }).withMessage("Location must be between 5 and 200 characters"),
  validate,
]

// Story validation
const validateStory = [
  body("title").trim().isLength({ min: 10, max: 150 }).withMessage("Story title must be between 10 and 150 characters"),
  body("content")
    .trim()
    .isLength({ min: 100, max: 5000 })
    .withMessage("Story content must be between 100 and 5000 characters"),
  validate,
]

module.exports = {
  validate,
  validateRegistration,
  validateLogin,
  validateJob,
  validateEvent,
  validateStory,
}
