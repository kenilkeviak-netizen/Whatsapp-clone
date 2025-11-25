const twilio = require("twilio");

const authToken = process.env.TWILLO_AUTH_TOKEN;
const accountSid = process.env.TWILLO_ACCOUNT_ID;
const serviceSid = process.env.TWILLO_SERVICE_ID;

const client = twilio(accountSid, authToken);

const sendOtpToPhoneNumber = async (phoneNumber) => {
  try {
    if (!phoneNumber) throw new Error("Phone number is required");

    const formattedNumber = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+${phoneNumber}`;

    const response = await client.verify.v2
      .services(serviceSid)
      .verifications.create({
        to: formattedNumber,
        channel: "sms",
      });

    return response;
  } catch (error) {
    console.error("Twilio sendOtp error:", error?.message || error);
    throw new Error(
      error?.message || "Failed to send OTP. Please try again later."
    );
  }
};

/**
 * Step 2: Verify OTP
 */
const verifyOtp = async (phoneNumber, otp) => {
  try {
    if (!phoneNumber || !otp)
      throw new Error("Phone number and OTP are required");

    // Ensure E.164 format
    const formattedNumber = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+${phoneNumber}`;

    console.log("🔍 Verifying OTP for:", formattedNumber, "Code:", otp);

    const response = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({
        to: formattedNumber,
        code: otp,
      });

    return response;
  } catch (error) {
    console.error("Twilio verifyOtp error:", error?.message || error);
    throw new Error(
      error?.message || "OTP verification failed. Please try again."
    );
  }
};

module.exports = { sendOtpToPhoneNumber, verifyOtp };
