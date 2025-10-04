// Paytm utility for checksum and API calls
const PaytmChecksum = require('paytmchecksum');
const https = require('https');

const PAYTM_MID = process.env.PAYTM_MID;
const PAYTM_MERCHANT_KEY = process.env.PAYTM_MERCHANT_KEY;
const PAYTM_WEBSITE = process.env.PAYTM_WEBSITE;
const PAYTM_CALLBACK_URL = process.env.PAYTM_CALLBACK_URL;
const PAYTM_CHANNEL_ID = process.env.PAYTM_CHANNEL_ID || 'WEB';
const PAYTM_INDUSTRY_TYPE_ID = process.env.PAYTM_INDUSTRY_TYPE_ID || 'Retail';

// Generate Paytm checksum
async function generateChecksum(params) {
  return PaytmChecksum.generateSignature(params, PAYTM_MERCHANT_KEY);
}

// Verify Paytm checksum
function verifyChecksum(params, checksum) {
  return PaytmChecksum.verifySignature(params, PAYTM_MERCHANT_KEY, checksum);
}

// Call Paytm Transaction Status API
function getTransactionStatus(orderId) {
  return new Promise(async (resolve, reject) => {
    const params = {
      MID: PAYTM_MID,
      ORDERID: orderId,
    };
    const checksum = await generateChecksum(params);
    params.CHECKSUMHASH = checksum;
    const post_data = JSON.stringify(params);
    const options = {
      hostname: 'securegw.paytm.in',
      port: 443,
      path: '/order/status',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': post_data.length,
      },
    };
    let response = '';
    const req = https.request(options, (res) => {
      res.on('data', (chunk) => {
        response += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(response));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(post_data);
    req.end();
  });
}

module.exports = {
  generateChecksum,
  verifyChecksum,
  getTransactionStatus,
  PAYTM_MID,
  PAYTM_WEBSITE,
  PAYTM_CALLBACK_URL,
  PAYTM_CHANNEL_ID,
  PAYTM_INDUSTRY_TYPE_ID,
};
