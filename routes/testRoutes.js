const express = require('express');
const router = express.Router();

// Test endpoint to check environment variables
router.get('/env', (req, res) => {
  // List of environment variables to return
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    MONGO_URI: process.env.MONGO_URI ? 'Set' : 'Not set',
    JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
    EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'Not set',
    EMAIL_HOST: process.env.EMAIL_HOST || 'Not set',
    EMAIL_PORT: process.env.EMAIL_PORT || 'Not set',
    EMAIL_USER: process.env.EMAIL_USER || 'Not set',
    EMAIL_PASS: process.env.EMAIL_PASS ? 'Set' : 'Not set',
    EMAIL_FROM: process.env.EMAIL_FROM || 'Not set',
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'Not set',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'Not set'
  };

  res.json({
    success: true,
    message: 'Environment variables',
    data: envVars,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
