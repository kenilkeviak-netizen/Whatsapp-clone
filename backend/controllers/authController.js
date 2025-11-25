const User = require("../models/User");
const sendOtpToEmail = require("../services/emailService");
const otpGenerate = require("../utils/otpGenerater");
const response = require("../utils/responseHandler");
const twilioServices = require("../services/twilloService");
const generateToken = require("../utils/generateTOken");
const Conversation = require("../models/Conversation");
const { uplaodFileToCloudinary } = require("../config/cloudinaryConfig");

//  Step - 1 : Send OTP on Email or Phone number

const sendOtp = async (req, res) => {
  const { phoneNumber, phoneSuffix, email } = req.body;
  const otp = otpGenerate();
  const expiry = new Date(Date.now() + 5 * 60 * 1000);
  let user;

  try {
    if (email) {
      user = (await User.findOne({ email })) || new User({ email });
      user.emailOtp = otp;
      user.emailOtpExpiry = expiry;
      await user.save();

      await sendOtpToEmail(otp, email);
      return response(res, 200, "OTP sent to your email", { email });
    }

    if (!phoneNumber || !phoneSuffix) {
      return response(res, 400, "Phone number and suffix are required");
    }

    const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
    user =
      (await User.findOne({ phoneNumber, phoneSuffix })) ||
      new User({
        phoneNumber,
        phoneSuffix,
      });

    // Save OTP inside the user document (useful for testing or fallback)
    user.phoneOtp = otp;
    user.phoneOtpExpiry = expiry;
    await user.save();

    // Send OTP using Twilio
    await twilioServices.sendOtpToPhoneNumber(fullPhoneNumber);

    return response(res, 200, "OTP sent successfully", {
      phoneNumber: fullPhoneNumber,
    });
  } catch (error) {
    console.error("❌ Error in sendOtp:", error);
    return response(res, 500, "Internal server error");
  }
};

//  Step - 2 : Verified OTP on Email or Phone number

const verifyOtp = async (req, res) => {
  const { phoneNumber, phoneSuffix, email, otp } = req.body;

  try {
    let user;

    if (email) {
      user = await User.findOne({ email });
      if (!user) return response(res, 404, "User Not Found");

      const now = new Date();
      if (
        !user.emailOtp ||
        String(user.emailOtp) !== String(otp) ||
        now > new Date(user.emailOtpExpiry)
      ) {
        return response(res, 400, "Invalid or expired OTP");
      }

      user.isVerified = true;
      user.emailOtp = null;
      user.emailOtpExpiry = null;
      await user.save();
    } else {
      if (!phoneNumber || !phoneSuffix)
        return response(res, 400, "Phone number and suffix are required");

      const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
      user = await User.findOne({ phoneNumber, phoneSuffix });

      if (!user) return response(res, 404, "User Not Found");

      // First verify with Twilio (if available)
      const result = await twilioServices.verifyOtp(fullPhoneNumber, otp);

      if (result?.status !== "approved") {
        // Fallback: also check locally if needed
        const now = new Date();
        if (
          !user.phoneOtp ||
          String(user.phoneOtp) !== String(otp) ||
          now > new Date(user.phoneOtpExpiry)
        ) {
          return response(res, 400, "Invalid or expired OTP");
        }
      }

      user.isVerified = true;
      user.phoneOtp = null;
      user.phoneOtpExpiry = null;
      await user.save();
    }

    const token = generateToken(user?._id);
    res.cookie("auth_token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });

    return response(res, 200, "OTP verified successfully", { token, user });
  } catch (error) {
    console.error("❌ Error in verifyOtp:", error);
    return response(res, 500, "Internal server error");
  }
};

const updateProfile = async (req, res) => {
  const { username, agreed, about } = req.body;
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);
    if (!user) return response(res, 404, "User not found");

    let uploadedResult = null;

    // ✅ If user uploaded a file
    if (req.file) {
      uploadedResult = await uplaodFileToCloudinary(req.file);
      user.profilePicture = uploadedResult?.secure_url;
    }

    // ✅ Also allow direct URL (if passed from frontend)
    if (req.body.profilePicture) {
      user.profilePicture = req.body.profilePicture;
    }

    if (username) user.userName = username;
    if (agreed !== undefined) user.agreed = agreed;
    if (about) user.about = about;

    await user.save();

    return response(res, 200, "User profile updated successfully", user);
  } catch (error) {
    console.error("❌ updateProfile error:", error);
    return response(res, 500, "Internal server error");
  }
};

const logout = (req, res) => {
  try {
    res.cookie("auth_token", "", { expires: new Date(0) });
    return response(res, 200, "User Logout successfully");
  } catch (error) {
    console.log(error);
    return response(res, 500, "Internal server error");
  }
};

const checkAuthenticated = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return response(res, 404, "Unauthorized User ! Please login");
    }
    const user = await User.findById(userId);
    if (!user) {
      return response(res, 404, "User Not found!!");
    }
    return response(res, 200, "User retrived ! allow to use whatsapp", user);
  } catch (error) {
    console.log(error);
    return response(res, 500, "Internal server error");
  }
};

const getAllUser = async (req, res) => {
  const loggedInUser = req.user.userId;
  try {
    const users = await User.find({ _id: { $ne: loggedInUser } })
      .select(
        "userName isOnline lastSeen profilePicture about phoneNumber phoneSuffix"
      )
      .lean();

    const usersWithConversation = await Promise.all(
      users.map(async (user) => {
        const conversation = await Conversation.findOne({
          participants: { $all: [loggedInUser, user?._id] },
        })
          .populate({
            path: "lastMessage",
            select: "content createdAt sender receiver",
          })
          .lean();

        return {
          ...user,
          conversation: conversation || null,
        };
      })
    );

    console.log(usersWithConversation);

    return response(
      res,
      200,
      "User retrived successfully",
      usersWithConversation
    );
  } catch (error) {
    console.log(error);
    return response(res, 500, "Internal server error");
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  updateProfile,
  logout,
  checkAuthenticated,
  getAllUser,
};
