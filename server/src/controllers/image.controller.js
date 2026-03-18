import axios from 'axios';
import FormData from 'form-data';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Image } from '../models/image.model.js';
import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import fs from 'fs';
import path from "path";
import { uploadToCloudinary } from '../utils/cloudinary.js';

const detectImageForDeepfake = asyncHandler(async (req, res) => {
    const { owner } = req.body;

    // 1. Validate all inputs FIRST before any async work
    if (!owner) throw new ApiError("Provide owner id", 400);
    if (!mongoose.Types.ObjectId.isValid(owner)) throw new ApiError("ID is not in valid format", 400);
    if (!req.file) throw new ApiError("Provide image", 400);

    // 2. Run user check + Python API call in parallel (independent operations)
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));

    const [user, response] = await Promise.all([
        User.findById(owner).lean().select('_id'),  // lean() + select() = faster query
        axios.post(`${process.env.PYTHON_APP_URL}/predict`, formData, {
            headers: { ...formData.getHeaders() },
            timeout: 15000, // prevent hanging requests
        })
    ]);

    if (!user) throw new ApiError("User not found", 404);

    const predictionResult = response.data;
    const isFake = predictionResult.class === "Fake Image";

    // 3. Upload both images in parallel (was sequential before)
    const uploadTasks = [uploadToCloudinary(req.file.path)];

    if (isFake) {
        const pythonImagePath = path.join("..", "python-server", predictionResult.highlightedImage);
        uploadTasks.push(uploadToCloudinary(pythonImagePath));
    }

    const uploadResults = await Promise.all(uploadTasks);
    const uploadedImageUrl = uploadResults[0].secure_url;
    const pythonImageUrl = isFake ? uploadResults[1].secure_url : undefined;

    // 4. Send response immediately, save to DB in background
    res.status(200).json({
        class: predictionResult.class,
        confidenceScore: predictionResult.confidence_score,
        explanation: predictionResult.explanation,
        resultImage: pythonImageUrl,
    });

    // 5. Non-blocking DB write — client doesn't need to wait for this
    Image.create({
        owner,
        imageUrl: uploadedImageUrl,
        detectionResult: {
            explanation: predictionResult.explanation,
            class: predictionResult.class,
            resultImage: pythonImageUrl,
            confidenceScore: predictionResult.confidence_score,
        }
    }).catch(err => console.error("DB save failed:", err)); // handle silently
});

export { detectImageForDeepfake };
