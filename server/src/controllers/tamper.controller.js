import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

import fs from "fs";
import { TamperProof } from '../models/tamper-proof.model.js';
import { TamperProofHistory } from "../models/tamper-proof-history.model.js";
import axios from "axios";
import FormData from "form-data";
import { v4 as uuidv4 } from "uuid";
import path from "path";
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });


export const protectImage = asyncHandler(async (req, res) => {
    const file = req.file;
    const ownerId = req.body.owner;

    if (!ownerId) throw new ApiError(400, "Owner ID is required");
    if (!file) throw new ApiError(400, "No image uploaded");

    const form = new FormData()
    form.append("image", fs.createReadStream(file.path))

    const response = await axios.post(`${process.env.PYTHON_APP_URL}/embed`, form, {
        headers: form.getHeaders()
    })

    const { original_image, watermarked_image, full_hash } = response.data;
    const ext = ".png";
    const uniqueName = `watermarked-${uuidv4()}${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);
    fs.writeFileSync(filePath, Buffer.from(watermarked_image, "base64"));
    const relativePath = path.join("uploads", uniqueName);

    const tamperRecord = await TamperProof.create({
        owner: ownerId,
        imageUrl: file.path,
        hash: full_hash,
        protectedImageUrl: relativePath,
    });

    const { _id, owner, imageUrl, protectedImageUrl, createdAt } = tamperRecord;

    res.json({ _id, owner, imageUrl, protectedImageUrl, createdAt });
});

export const verifyImage = asyncHandler(async (req, res) => {
    const file = req.file;
    const { id, owner } = req.body;
    if (!file) throw new ApiError(400, "No image uploaded");
    if (!owner) throw new ApiError(400, "Owner ID is required");

    const form = new FormData()

    form.append("image", fs.createReadStream(file.path))

    const response = await axios.post(`${process.env.PYTHON_APP_URL}/extract`, form, {
        headers: form.getHeaders()
    })

    const { extracted_hash } = response.data
    console.log("Hash Extracted: ", extracted_hash)

    const storedImage = await TamperProof.findOne({
        $or: [{ owner: owner }, { hash: extracted_hash }]
    })

    if (!storedImage) {
        fs.unlinkSync(file.path);
        throw new ApiError(404, "No tamper record found for this image under this owner id.");
    }

    console.log("Hash Stored: ", storedImage)

    const hashMatched = extracted_hash === storedImage.hash;
    const tampered = !hashMatched

    res.json({
        hashMatched, tampered,
        hashExtracted: extracted_hash,
        hashStored: storedImage.hash
    });
    // await TamperProofHistory.create({
    //     owner,
    //     imageUrl: file.path,
    //     hashMatched,
    //     tampered,
    // })
});

export const getImage = asyncHandler(async (req, res) => {
    const owner = req.query.owner;
    const imageId = req.query.id

    let images;

    if (owner) {
        images = await TamperProof.find({ owner: owner })
    }
    else if (imageId) {
        images = await TamperProof.findById(imageId)
    }
    else {
        images = await TamperProof.find()
    }

    res.status(200).json({
        images
    })
})

export const addDocumentToTamperProof = asyncHandler(async (req, res) => {
    const { original_image_url, protected_image_url, owner } = req.body

    if (!original_image_url || !protected_image_url || !owner) {
        throw new ApiError(400, "Provide all fields")
    }

    const document = await TamperProof.create({
        owner,
        originalImageUrl: original_image_url,
        protectedImageUrl: protected_image_url
    })

    res.status(201).json({
        document
    })
})

export const addDocumentToTamperProofHistory = asyncHandler(async(req,res)=>{
    const {image_url, watermarked_matched, owner} = req.body

    if(!image_url || watermarked_matched == null || watermarked_matched == undefined || !owner){
        throw new ApiError(400,"Provide all fields")
    }

    const document = await TamperProofHistory.create({
        imageUrl: image_url,
        watermarkedMatched: watermarked_matched,
        tampered: !watermarked_matched,
        owner
    })

    res.status(201).json({
        document
    })
})

