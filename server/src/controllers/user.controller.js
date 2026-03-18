
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import mongoose from "mongoose"
import { Image } from "../models/image.model.js"
import { Video } from "../models/video.model.js"
import { TamperProof } from "../models/tamper-proof.model.js"
import { TamperProofHistory } from "../models/tamper-proof-history.model.js"
import bcrypt from "bcrypt";

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

    if (imageCount === 0 && videoCount === 0) {
        return res.status(200).json({
            success: false,
            message: "No history found",
        });
    }

    // Delete all history
    await Image.deleteMany({ owner: userId });
    await Video.deleteMany({ owner: userId });

    res.status(200).json({
        success: true,
        message: "History cleared successfully",
    });
});

const updateProfile = asyncHandler(async (req, res) => {
    const {userId} = req.params;
    const { email, fullName, username, newPassword, oldPassword } = req.body;

    if (!userId) throw new ApiError(400, "User id is missing")

    const user = await User.findById(userId)
    if (!user) throw new ApiError(404, "User not found")

    // ✅ Check email & username not taken by another user
    if (email) {
        const emailExists = await User.findOne({ email, _id: { $ne: userId } })
        if (emailExists) throw new ApiError(409, "Email already in use")
    }

    if (username) {
        const usernameExists = await User.findOne({ username, _id: { $ne: userId } })
        if (usernameExists) throw new ApiError(409, "Username already taken")
    }

    let fieldsToUpdate = {}
    if (email) fieldsToUpdate.email = email
    if (fullName) fieldsToUpdate.fullName = fullName
    if (username) fieldsToUpdate.username = username
    if (req.file) fieldsToUpdate.avatar = req.file.path

    if (newPassword) {
        if (!oldPassword) throw new ApiError(400, "Old password is required")
        const isPasswordMatched = await bcrypt.compare(oldPassword, user.password)
        if (!isPasswordMatched) throw new ApiError(401, "Old password is incorrect")
        fieldsToUpdate.password = await bcrypt.hash(newPassword, 10)
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
        throw new ApiError(400, "No fields provided to update")
    }

    const updatedDocument = await User.findByIdAndUpdate(
        userId,
        { $set: fieldsToUpdate },
        { new: true }
    ).select('-password') 

    res.status(200).json({ success: true, data: updatedDocument })
})

export { getAllUsers, getHistory, clearHistory, updateProfile }
