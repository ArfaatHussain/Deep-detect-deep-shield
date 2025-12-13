import axios from 'axios';
import FormData from 'form-data';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadFileOnCloudinary } from '../utils/cloudinary.js';
import { Image } from '../models/image.model.js';
import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import fs from 'fs';
import path from "path";
const detectImageForDeepfake = async (req, res) => {
    try {
        const { owner } = req.body
        if (!owner) {
            return res.status(400).json({ message: "Provide owner id" })
        }
        if (!mongoose.Types.ObjectId.isValid(owner)) {
            return res.status(400).json({ message: "ID is not in valid format" })
        }

        const user = await User.findById(owner)

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        if (!req.file) {
            return res.status(400).json({ message: "Provide image" })
        }

        const pythonAPIUrl = 'http://localhost:5001/predict';


        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path));

        const response = await axios.post(pythonAPIUrl, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        const predictionResult = response.data;

        let resultImage;
        if (predictionResult.class == "Fake Image") {
            const pythonImagePath = path.join("..", "python server", predictionResult.highlightedImage);

            const filename = `result-${Date.now()}${path.extname(pythonImagePath)}`;
            const localPath = path.join("uploads", filename);

            fs.copyFileSync(pythonImagePath, localPath);
            fs.unlinkSync(pythonImagePath);
            resultImage = localPath;
        }
        await Image.create({
            owner,
            imageUrl: req.file.path,
            detectionResult: {
                explanation: predictionResult.explanation,
                class: predictionResult.class,
                resultImage,
                confidenceScore: predictionResult.confidence_score
            }
        })

        return res.status(200).json({
            class: predictionResult.class,
            confidenceScore: predictionResult.confidence_score,
            explanation: predictionResult.explanation,
            resultImage
        })
    } catch (error) {
        // console.error("Error from python service: ", error)
        // console.log("Error from Python service:", error?.response?.status);

        if (error.response.status == 400) {
            return res.status(400).json({
                message: "no face detected. Please insert valid image."
            })
        }
        // If Python server sent a response (including 400)
        if (error.response) {
            return res.status(error.response.status).json({
                message: error.response.data?.message || "Python server error",
                details: error.response.data
            });
        }

        // No response at all (Python server down)
        if (error.request) {
            return res.status(500).json({
                message: "Python server not responding",
            });
        }

        // Anything else (unexpected error)
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

export { detectImageForDeepfake };
