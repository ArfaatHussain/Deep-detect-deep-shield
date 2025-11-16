import axios from 'axios';
import FormData from 'form-data';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadFileOnCloudinary } from '../utils/cloudinary.js';
import { Image } from '../models/image.model.js';
import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import fs from 'fs';
const detectImageForDeepfake = asyncHandler(async (req, res) => {
    const { owner } = req.body
    if (!owner) {
        throw new ApiError(400, "Provide owner id")
    }
    if (!mongoose.Types.ObjectId.isValid(owner)) {
        throw new ApiError(400, "ID is not in valid format")
    }

    const user = await User.findById(owner)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    if (!req.file) {
        throw new ApiError(400, "Provide image");
    }

    const pythonAPIUrl = 'http://localhost:5001/predict';

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
        filename: 'image.jpg',
        contentType: req.file.mimetype,
    });

    const response = await axios.post(pythonAPIUrl, formData, {
        headers: {
            ...formData.getHeaders(),
        },
    });

    const predictionResult = response.data;

    let resultImage;
    let inputImageUrl;
    if (predictionResult.class == "Fake Image") {
        const path = `../python server${predictionResult.highlightedImage}`
        const response = await uploadFileOnCloudinary(path)
        resultImage = response.url

        const inputImage = await uploadFileOnCloudinary(req.file.buffer)
        // console.log("Input image: ",inputImage)
        inputImageUrl = inputImage.url
    }
    else {
        const inputImage = await uploadFileOnCloudinary(req.file.buffer)
        // console.log("Input image: ",inputImage)
        inputImageUrl = inputImage.url
    }

    await Image.create({
        owner,
        imageUrl: inputImageUrl,
        detectionResult: {
            explanation: predictionResult.explanation,
            class: predictionResult.class,
            resultImage,
            confidenceScore: predictionResult.confidence_score
        }
    })

    // fs.unlinkSync(`../python server${predictionResult.highlightedImage}`)
    return res.status(200).json({
        class: predictionResult.class,
        confidenceScore: predictionResult.confidence_score,
        explanation: predictionResult.explanation,
        resultImage
    })
});

export { detectImageForDeepfake };
