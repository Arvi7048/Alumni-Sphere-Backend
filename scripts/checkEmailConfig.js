// This script checks the email configuration and tests the email sending functionality
const { sendEmail } = require('../utils/email');

// Log the email configuration (without sensitive data)
console.log('Email Configuration:');
console.log('-------------------');
console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE ? 'Set' : 'Not set');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST ? 'Set' : 'Not set');
console.log('EMAIL_PORT:', process.env.EMAIL_PORT || 'Using default (587)');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'Using EMAIL_USER');
console.log('EMAIL_FROM_NAME:', process.env.EMAIL_FROM_NAME || 'Using default');
console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'Not set (using default: admin@example.com)');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

// Test email sending if in development mode
const testEmailSending = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.log('\nSkipping test email in production mode');
    return;
  }

  console.log('\nTesting email sending...');
  
  try {
    const testEmail = process.env.ADMIN_EMAIL || 'test@example.com';
    console.log(`Sending test email to: ${testEmail}`);
    
    const info = await sendEmail({
      to: testEmail,
      subject: 'Test Email from Alumni Platform',
      text: 'This is a test email from the Alumni Platform.',
      html: '<h1>Test Email</h1><p>This is a test email from the Alumni Platform.</p>'
    });
    
    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('\nError sending test email:');
    console.error(error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\nAuthentication failed. Please check your email credentials in the .env file.');
    } else if (error.code === 'EENVELOPE') {
      console.error('\nInvalid email address. Please check the recipient email address.');
    } else if (error.code === 'ECONNECTION') {
      console.error('\nCould not connect to the email server. Check your internet connection and SMTP settings.');
    }
    
    console.error('\nFor more details, check the full error object below:');
    console.error(error);
  }
};

// Run the test
testEmailSending();
