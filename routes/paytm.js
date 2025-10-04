const express = require('express');
const router = express.Router();
const { generateChecksum, PAYTM_MID, PAYTM_WEBSITE, PAYTM_CHANNEL_ID, PAYTM_INDUSTRY_TYPE_ID, PAYTM_CALLBACK_URL } = require('../utils/paytm');

// Middleware to enforce HTTPS
router.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.status(403).json({ error: 'HTTPS required for payment routes.' });
  }
  next();
});

// Initiate Paytm payment
router.post('/initiate', async (req, res) => {
  try {
    const { amount, orderId, customerId, email, mobile } = req.body;
    if (!amount || !orderId || !customerId) return res.status(400).json({ error: 'Missing parameters' });
    const paytmParams = {
      MID: PAYTM_MID,
      WEBSITE: PAYTM_WEBSITE,
      INDUSTRY_TYPE_ID: PAYTM_INDUSTRY_TYPE_ID,
      CHANNEL_ID: PAYTM_CHANNEL_ID,
      ORDER_ID: orderId,
      CUST_ID: customerId,
      TXN_AMOUNT: amount.toString(),
      CALLBACK_URL: PAYTM_CALLBACK_URL,
      EMAIL: email,
      MOBILE_NO: mobile,
    };
    const checksum = await generateChecksum(paytmParams);
    paytmParams.CHECKSUMHASH = checksum;
    res.json(paytmParams);
  } catch (err) {
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

module.exports = router;
