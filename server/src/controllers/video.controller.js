import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from '../models/video.model.js';

export const saveDeepfakeVideoResult = asyncHandler(async (req, res) => {

    const {prediction, probability, explanation_text, original_video_url, annotated_video_url, owner} = req.body;

    if(!prediction || !probability || !explanation_text || !original_video_url || !owner) {
        throw new ApiError(400, "Missing required fields");
    }

    await Video.create({
        owner,
        videoUrl: original_video_url,
        detectionResult: {
            explanation: explanation_text,
            class: prediction,
            resultVideo: annotated_video_url || "",
            confidenceScore: probability
        }
    });

    res.status(201).json({message: "Video result saved successfully"});

})
