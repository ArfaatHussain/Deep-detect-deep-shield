import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

import fs from "fs";
import { TamperProof } from '../models/tamper-proof.model.js';
import { embedSteg, generateHash, extractSteg } from '../utils/helpers.js';
import { TamperProofHistory } from "../models/tamper-proof-history.model.js";

const WATERMARK = "Tamper-Protected-Image";

export const protectImage = asyncHandler(async (req, res) => {
    const file = req.file;
    const ownerId = req.body.owner;
    if (!ownerId) throw new ApiError("Owner ID is required", 400);
    if (!file) throw new ApiError("No image uploaded", 400);

    const buffer = fs.readFileSync(file.path);
    const hash = generateHash(buffer);
    const waterMarkData = {
        watermark: WATERMARK,
        hash
    }
    const protectedPath = await embedSteg(file.path, JSON.stringify(waterMarkData));
    const protectedImageUrl = `http://${process.env.HOST}/${protectedPath.replace(/\\/g, "/")}`;
    const originalImageUrl = `http://${process.env.HOST}/${file.path.replace(/\\/g, "/")}`;
    const tamperRecord = await TamperProof.create({
        owner: ownerId,
        imageUrl: originalImageUrl,
        hash,
        protectedImageUrl: protectedImageUrl,
        watermark: WATERMARK,
    });

    res.json({ success: true, tamperRecord});
});

export const verifyImage = asyncHandler(async (req, res) => {
    const file = req.file;
    const {id, owner} = req.body;
    if (!id) throw new ApiError("Image ID is required", 400);
    if (!file) throw new ApiError("No image uploaded", 400);
    if (!owner) throw new ApiError("Owner ID is required", 400);

    const storedImage = await TamperProof.findById(id);
    if (!storedImage) {
        fs.unlinkSync(file.path);
        throw new ApiError("No tamper record found for this ID", 404);
    }
    const rawWatermark = await extractSteg(file.path);

    const extractedWatermark = rawWatermark ? JSON.parse(rawWatermark) : null;

    const hashMatched = extractedWatermark?.hash === storedImage.hash;
    const watermarkMatched = extractedWatermark?.watermark === storedImage.watermark;
    const tampered = !(hashMatched && watermarkMatched);

    res.json({ hashMatched, watermarkMatched, tampered });
    const uploadedImageUrl = `${req.protocol}://${process.env.HOST}/${req.file.path.replace(/\\/g, "/")}`;
    console.log("Uploaded Image URL:", uploadedImageUrl);
    await TamperProofHistory.create({
        owner,
        imageUrl: uploadedImageUrl,
        hashMatched,
        watermarkMatched,
        tampered,
    })
});

