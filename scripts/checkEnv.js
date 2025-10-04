// This script logs the current environment variables (hiding sensitive values)
console.log('Current Environment Variables:');
console.log('------------------------------');

// List of environment variables to check
const envVars = [
  'NODE_ENV',
  'PORT',
  'MONGO_URI',
  'JWT_SECRET',
  'MAX_FILE_SIZE',
  'EMAIL_SERVICE',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'EMAIL_FROM',
  'EMAIL_FROM_NAME',
  'ADMIN_EMAIL'
];

// Log each variable (masking sensitive ones)
envVars.forEach(varName => {
  const value = process.env[varName];
  let displayValue = value ? 'Set' : 'Not set';
  
  // Mask sensitive values
  if (['JWT_SECRET', 'EMAIL_PASS'].includes(varName) && value) {
    displayValue = '********';
  } else if (value) {
    displayValue = value;
  }
  
  console.log(`${varName}: ${displayValue}`);
});

// Additional checks
console.log('\nAdditional Checks:');
console.log('-----------------');
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
