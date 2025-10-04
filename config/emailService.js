const sgMail = require('@sendgrid/mail')
const crypto = require('crypto')

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// Verify SendGrid configuration
const verifySendGridConfig = () => {
  console.log('Verifying SendGrid configuration:')
  console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '[SET]' : '[NOT SET]')
  console.log('SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL || 'Not set')
  
  if (!process.env.SENDGRID_API_KEY) {
    console.error('Error: SENDGRID_API_KEY is not set in environment variables')
    return false
  }
  if (!process.env.SENDGRID_FROM_EMAIL) {
    console.error('Warning: SENDGRID_FROM_EMAIL is not set, using default from email')
  }
  return true
}

// Generate OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString()
}

// Send OTP email
const sendOTPEmail = async (email, otp, type) => {
  // Verify SendGrid configuration
  if (!verifySendGridConfig()) {
    return { 
      success: false, 
      error: 'SendGrid is not properly configured. Please check your environment variables.' 
    }
  }
  
  let subject, html
  
  switch (type) {
    case "registration":
      subject = "Verify Your Email - Alumni Platform"
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Alumni Platform!</h2>
          <p>Thank you for registering. Please verify your email address using the OTP below:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 36px; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
      break
    
    case "forgot_password":
      subject = "Reset Your Password - Alumni Platform"
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested to reset your password. Use the OTP below to proceed:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #dc3545; font-size: 36px; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        </div>
      `
      break
    
    case "email_verification":
      subject = "Verify Your Email - Alumni Platform"
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Please verify your email address using the OTP below:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #28a745; font-size: 36px; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
      break
    
    default:
      return { 
        success: false, 
        error: 'Invalid email type specified' 
      }
  }

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@alumniplatform.com',
    subject,
    html,
  }

  try {
    console.log('Attempting to send email to:', email)
    console.log('Email subject:', subject)
    
    await sgMail.send(msg)
    console.log('Email sent successfully')
    return { success: true }
  } catch (error) {
    console.error('Email sending failed:', error)
    
    // Log more detailed error information if available
    if (error.response) {
      console.error('Error response body:', error.response.body)
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to send email' 
    }
  }
}

// Send admin notification for new alumni approval
const sendAdminApprovalEmail = async (adminEmail, alumni) => {
  const transporter = createTransporter()
  const subject = "New Alumni Registration Pending Approval"
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Alumni Registration Request</h2>
      <p>A new alumni has registered and is awaiting your approval:</p>
      <ul>
        <li><strong>Name:</strong> ${alumni.name}</li>
        <li><strong>Email:</strong> ${alumni.email}</li>
        <li><strong>Batch:</strong> ${alumni.batch}</li>
        <li><strong>Branch:</strong> ${alumni.branch}</li>
        <li><strong>Location:</strong> ${alumni.location}</li>
      </ul>
      <p>Please log in to the admin dashboard to approve or reject this request.</p>
    </div>
  `
  const mailOptions = {
    from: `Alumni Platform <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject,
    html,
  }
  try {
    const result = await transporter.sendMail(mailOptions)
    console.log('Admin approval email sent:', result.messageId)
    return { success: true }
  } catch (error) {
    console.error("Admin approval email failed:", error)
    return { success: false, error: error.message }
  }
}

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendAdminApprovalEmail,
}
