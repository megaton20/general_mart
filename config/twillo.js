require('dotenv').config();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);


// Send verification code
const sendVerificationCode = (phoneNumber) => {
  return client.verify.v2.services(process.env.TWILIO_SERVICE_SID)
    .verifications
    .create({ to: phoneNumber, channel: 'sms' });
};

// Verify code
const verifyCode = (phoneNumber, code) => {
  return client.verify.v2.services(process.env.TWILIO_SERVICE_SID)
    .verificationChecks
    .create({ to: phoneNumber, code: code });
};

module.exports = { sendVerificationCode, verifyCode };
