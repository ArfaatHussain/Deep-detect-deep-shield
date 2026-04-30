
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import mongoose from "mongoose"
import { Image } from "../models/image.model.js"
import { Video } from "../models/video.model.js"
import { TamperProof } from "../models/tamper-proof.model.js"
import { TamperProofHistory } from "../models/tamper-proof-history.model.js"
import bcrypt from "bcrypt";
import { uploadToCloudinary } from "../utils/cloudinary.js"
import { sendOTPEmail } from "../utils/emailService.js";
import { generateOTP, verifyOTP, cleanupExpiredOTPs, storeOTP } from "../utils/otpManager.js";


const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find()
    res.status(200).json({
        users
    })
})

const getHistory = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) throw new ApiError(400, "User id is required");
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new ApiError(400, "User id is not valid");

    const [
        imageDetectionHistory,
        videoDetectionHistory,
        tamperHistory,
        tamperProofHistory
    ] = await Promise.all([
        Image.find({ owner: userId }).lean(),
        Video.find({ owner: userId }).lean(),
        TamperProof.find({ owner: userId })
            .lean(),
        TamperProofHistory.find({ owner: userId }).lean()
    ]);

    if (imageDetectionHistory.length === 0 && videoDetectionHistory.length === 0 && tamperHistory.length === 0 && tamperProofHistory.length === 0) {
        return res.status(200).json({
            success: true,
            message: "No history found",
            imageHistory: [],
            videoHistory: [],
            tamperHistory: [],
            tamperProofHistory: [],
        });
    }

    res.status(200).json({
        imageHistory: imageDetectionHistory,
        videoHistory: videoDetectionHistory,
        tamperGenerationHistory: tamperHistory,
        tamperVerificationHistory: tamperProofHistory,
    });
});

const clearHistory = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) throw new ApiError(400, "User id is required");
    if (!mongoose.Types.ObjectId.isValid(userId))
        throw new ApiError(400, "User id is not valid");

    // Check if history exists
    const imageCount = await Image.countDocuments({ owner: userId });
    const videoCount = await Video.countDocuments({ owner: userId });
    const tamperProofCount = await TamperProof.countDocuments({ owner: userId });
    const tamperProofHistoryCount = await TamperProofHistory.countDocuments({ owner: userId });

    if (imageCount === 0 && videoCount === 0 && tamperProofCount === 0 && tamperProofHistoryCount === 0) {
        return res.status(200).json({
            success: false,
            message: "No history found",
        });
    }

    // Delete all history
    await Image.deleteMany({ owner: userId });
    await Video.deleteMany({ owner: userId });
    await TamperProofHistory.deleteMany({ owner: userId });
    await TamperProof.deleteMany({ owner: userId });

    res.status(200).json({
        success: true,
        message: "History cleared successfully",
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// PROFILE CHANGE — Request OTP
// ══════════════════════════════════════════════════════════════════════════════
const requestProfileOTP = asyncHandler(async (req, res) => {
    const email = req.body.email; // replace with req.user.email if using JWT middleware

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const otp = generateOTP();
    storeOTP(email, otp, "profile_change");
    await sendOTPEmail(email, otp, "profile_change");

    res.status(200).json({
        message: "Confirmation code sent to your email.",
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// PROFILE CHANGE — Verify OTP and update
// ══════════════════════════════════════════════════════════════════════════════
const verifyAndUpdateProfile = asyncHandler(async (req, res) => {
    const { email, otp, newEmail, fullName, username, newPassword, oldPassword } = req.body;

    if (!email || !otp) {
        throw new ApiError(400, "email and otp are required");
    }

    const otpResult = verifyOTP(email, otp, "profile_change");
    if (!otpResult.valid) {
        throw new ApiError(400, otpResult.error);
    }

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    // ✅ Check new email & username not taken by another user
    if (newEmail) {
        const emailExists = await User.findOne({ email: newEmail, _id: { $ne: user._id } });
        if (emailExists) throw new ApiError(409, "Email already in use");
    }

    if (username) {
        const usernameExists = await User.findOne({ username, _id: { $ne: user._id } });
        if (usernameExists) throw new ApiError(409, "Username already taken");
    }

    let fieldsToUpdate = {};
    if (newEmail) fieldsToUpdate.email = newEmail;
    if (fullName) fieldsToUpdate.fullName = fullName;
    if (username) fieldsToUpdate.username = username;
    if (req.file) {
        const response = await uploadToCloudinary(req.file.path);
        fieldsToUpdate.avatar = response.secure_url;
    }

    if (newPassword) {
        if (!oldPassword) throw new ApiError(400, "Old password is required");
        const isPasswordMatched = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordMatched) throw new ApiError(401, "Old password is incorrect");
        fieldsToUpdate.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
        throw new ApiError(400, "No fields provided to update");
    }

    const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $set: fieldsToUpdate },
        { new: true }
    ).select('-password');

    res.status(200).json({
        success: true,
        message: "Profile updated successfully.",
        data: updatedUser
    });
});



export { getAllUsers, getHistory, clearHistory, verifyAndUpdateProfile, requestProfileOTP}
