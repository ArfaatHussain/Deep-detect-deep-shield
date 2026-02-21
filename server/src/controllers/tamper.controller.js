import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

import fs from "fs";
import { TamperProof } from '../models/tamper-proof.model.js';
import { embedSteg, generateHash, extractSteg } from '../utils/helpers.js';

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
    const imageUrl = `${req.protocol}://${req.get("host")}/${protectedPath.replace(/\\/g, "/")}`;
    const tamperRecord = await TamperProof.create({
        owner: ownerId,
        imageUrl,
        hash,
        watermark: WATERMARK
    });

    res.json({ success: true, tamperRecord, });
});

export const verifyImage = asyncHandler(async (req, res) => {
    const file = req.file;
    const id = req.params.id;
    if (!id) throw new ApiError("Image ID is required", 400);
    if (!file) throw new ApiError("No image uploaded", 400);

    const buffer = fs.readFileSync(file.path);

    const newHash = generateHash(buffer);

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

    fs.unlinkSync(file.path);

    res.json({ hashMatched, watermarkMatched, tampered });
});

