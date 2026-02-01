// lib/phonepe.js
import crypto from 'crypto-js';

// PhonePe Configuration (will be set in Vercel env vars)
const PHONEPE_MERCHANT_ID = process.env.NEXT_PUBLIC_PHONEPE_MERCHANT_ID || 'TEST_MERCHANT';
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || 'test-salt-key';
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';
const PHONEPE_ENV = process.env.PHONEPE_ENV || 'UAT'; // UAT for testing, PROD for live

const PHONEPE_BASE_URL = PHONEPE_ENV === 'PROD' 
  ? 'https://api.phonepe.com/apis/hermes'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

// Generate PhonePe checksum
const generateChecksum = (payload, endpoint) => {
  const string = payload + endpoint + PHONEPE_SALT_KEY;
  const sha256 = crypto.SHA256(string).toString();
  return sha256 + '###' + PHONEPE_SALT_INDEX;
};

// Initiate payment (deposit)
export const initiatePayment = async (userId, amount, orderId) => {
  try {
    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId: orderId,
      merchantUserId: userId,
      amount: amount * 100, // Convert to paise
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/callback`,
      redirectMode: 'POST',
      callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/phonepe/callback`,
      mobileNumber: '9999999999', // Will be updated with actual user phone
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const checksum = generateChecksum(base64Payload, '/pg/v1/pay');

    const response = await fetch(`${PHONEPE_BASE_URL}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum
      },
      body: JSON.stringify({
        request: base64Payload
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('PhonePe payment error:', error);
    return { success: false, error: error.message };
  }
};

// Initiate payout (withdrawal)
export const initiatePayout = async (userId, amount, upiId, transactionId) => {
  try {
    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: userId,
      amount: amount * 100, // Convert to paise
      instrumentType: 'UPI',
      instrumentDetails: {
        vpa: upiId
      }
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const checksum = generateChecksum(base64Payload, '/pg/v1/payout');

    const response = await fetch(`${PHONEPE_BASE_URL}/pg/v1/payout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum
      },
      body: JSON.stringify({
        request: base64Payload
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('PhonePe payout error:', error);
    return { success: false, error: error.message };
  }
};

// Check payment status
export const checkPaymentStatus = async (transactionId) => {
  try {
    const endpoint = `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${transactionId}`;
    const checksum = generateChecksum('', endpoint);

    const response = await fetch(`${PHONEPE_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': PHONEPE_MERCHANT_ID
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('PhonePe status check error:', error);
    return { success: false, error: error.message };
  }
};
