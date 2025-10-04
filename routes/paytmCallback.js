const express = require('express');
const router = express.Router();
const { verifyChecksum, getTransactionStatus } = require('../utils/paytm');
const fs = require('fs');
const path = require('path');

function logWebhookEvent(event) {
  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
  const logFile = path.join(logDir, 'paytm-webhook.log');
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${JSON.stringify(event)}\n`);
}

// Paytm callback endpoint
router.post('/callback', async (req, res) => {
  const receivedData = req.body;
  const paytmChecksum = receivedData.CHECKSUMHASH;
  delete receivedData.CHECKSUMHASH;

  // 1. Verify checksum
  const isValidChecksum = verifyChecksum(receivedData, paytmChecksum);
  logWebhookEvent({ phase: 'checksum', receivedData, paytmChecksum, isValidChecksum });
  if (!isValidChecksum) {
    logWebhookEvent({ phase: 'fail', reason: 'Checksum mismatch', receivedData });
    return res.status(400).send('Checksum mismatch');
  }

  // 2. Verify transaction status with Paytm
  try {
    const statusResult = await getTransactionStatus(receivedData.ORDERID);
    logWebhookEvent({ phase: 'paytm-status', orderId: receivedData.ORDERID, statusResult });
    if (statusResult.STATUS === 'TXN_SUCCESS') {
      // TODO: Mark order as paid in your DB
      logWebhookEvent({ phase: 'success', orderId: receivedData.ORDERID, status: 'TXN_SUCCESS' });
      return res.status(200).send('Payment Success');
    } else {
      // TODO: Mark order as failed/cancelled in your DB
      logWebhookEvent({ phase: 'fail', orderId: receivedData.ORDERID, status: statusResult.STATUS });
      return res.status(200).send('Payment Failed');
    }
  } catch (err) {
    logWebhookEvent({ phase: 'error', error: err.message, orderId: receivedData.ORDERID });
    return res.status(500).send('Verification error');
  }
});

module.exports = router;
