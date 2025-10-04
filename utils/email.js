const nodemailer = require('nodemailer');
const { google } = require('google-auth-library');

const createTransporter = async () => {
  try {
    // For Gmail with OAuth2
    if (process.env.EMAIL_SERVICE === 'gmail' && process.env.EMAIL_CLIENT_ID) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.EMAIL_CLIENT_ID,
        process.env.EMAIL_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.EMAIL_REFRESH_TOKEN
      });

      const accessToken = await new Promise((resolve, reject) => {
        oauth2Client.getAccessToken((err, token) => {
          if (err) {
            reject('Failed to create access token');
          }
          resolve(token);
        });
      });

      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.EMAIL_USER,
          clientId: process.env.EMAIL_CLIENT_ID,
          clientSecret: process.env.EMAIL_CLIENT_SECRET,
          refreshToken: process.env.EMAIL_REFRESH_TOKEN,
          accessToken: accessToken
        }
      });
    }
    
    // For SMTP
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } catch (error) {
    console.error('Error creating email transporter:', error);
    throw new Error('Failed to create email transporter');
  }
};

const sendEmail = async (emailOptions) => {
  try {
    // Don't send emails in test environment
    if (process.env.NODE_ENV === 'test') {
      console.log('Email not sent - test environment');
      return { messageId: 'test-message-id' };
    }

    console.log('Creating email transporter...');
    const emailTransporter = await createTransporter();
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Alumni Hub'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: emailOptions.to,
      subject: emailOptions.subject,
      text: emailOptions.text,
      html: emailOptions.html
    };

    console.log('Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      response: error.response,
      command: error.command
    });
    
    // More detailed error handling for common issues
    if (error.code === 'EAUTH' || error.command === 'API') {
      console.error('Authentication failed. Please check your email credentials in the .env file.');
    } else if (error.code === 'EENVELOPE') {
      console.error('Invalid email address in the recipient or sender field.');
    } else if (error.code === 'ECONNECTION') {
      console.error('Could not connect to the email server. Check your internet connection and SMTP settings.');
    }
    
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = { sendEmail };
