import axios from 'axios';
import FormData from 'form-data';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Image } from '../models/image.model.js';
import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import fs from 'fs';
import path from "path";

const detectImageForDeepfake = asyncHandler(async (req, res) => {
    const { owner } = req.body
    if (!owner) {
        throw new ApiError("Provide owner id", 400)
    }
    if (!mongoose.Types.ObjectId.isValid(owner)) {
        throw new ApiError("ID is not in valid format", 400)
    }

    const user = await User.findById(owner)

    if (!user) {
        throw new ApiError("User not found", 404)
    }

    if (!req.file) {
        throw new ApiError("Provide image", 400)
    }

    const pythonAPIUrl = `${process.env.PYTHON_APP_URL}/predict`;

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
        resultImage = `${req.protocol}://${process.env.HOST}/${localPath.replace(/\\/g, "/")}`;
    }

    const uploadedImageUrl = `${req.protocol}://${process.env.HOST}/${req.file.path.replace(/\\/g, "/")}`;
    await Image.create({
        owner,
        imageUrl: uploadedImageUrl,
        detectionResult: {
            explanation: predictionResult.explanation,
            class: predictionResult.class,
            resultImage,
            confidenceScore: predictionResult.confidence_score
        }
    })

    res.status(200).json({
        class: predictionResult.class,
        confidenceScore: predictionResult.confidence_score,
        explanation: predictionResult.explanation,
        resultImage
    })
});

const uploadFile = asyncHandler(async (req,res)=>{
    if(!req.file){
        throw new ApiError(400,"Provide file")
    }
    const uploadedFileUrl = await uploadFileToDrive(req.file)
    res.status(200).json({
        uploadedFileUrl
    })
})

export { detectImageForDeepfake, uploadFile };
