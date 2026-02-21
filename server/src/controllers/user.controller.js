
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import mongoose from "mongoose"
import { Image } from "../models/image.model.js"
import { Video } from "../models/video.model.js"
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find()
    res.status(200).json({
        users
    })
})

const getHistory = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const BASE_URL = process.env.BASE_URL;

    if (!userId) throw new ApiError(400, "User id is required");
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new ApiError(400, "User id is not valid");

    const imageDetectionHistory = await Image.find({ owner: userId }).lean();
    const videoDetectionHistory = await Video.find({ owner: userId }).lean();

    if (imageDetectionHistory.length === 0 && videoDetectionHistory.length === 0) {
        return res.status(200).json({
            success: true,
            message: "No history found",
            imageHistory: [],
            videoHistory: [],
        });
    }


    const imagesWithUrl = imageDetectionHistory.map((img) => ({
        ...img,
        imageUrl: img.imageUrl ? BASE_URL + "/" + img.imageUrl.replace("\\", "/") : null,
        detectionResult: img.detectionResult
            ? {
                ...img.detectionResult,
                resultImage: img.detectionResult.resultImage
                    ? BASE_URL + "/" + img.detectionResult.resultImage.replace("\\", "/")
                    : null,
            }
            : null,
    }));

    const videosWithUrl = videoDetectionHistory.map((vid) => ({
        ...vid,
        videoUrl: vid.videoUrl ? BASE_URL + "/" + vid.videoUrl.replace("\\", "/") : null,
    }));

    res.status(200).json({
        imageHistory: imagesWithUrl,
        videoHistory: videosWithUrl,
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

export { getAllUsers, getHistory, clearHistory }
