import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

import { TamperProof } from '../models/tamper-proof.model.js';
import { TamperProofHistory } from "../models/tamper-proof-history.model.js";


export const addDocumentToTamperProof = asyncHandler(async (req, res) => {
    const { original_image_url, protected_image_url, owner } = req.body
    const ownerId = req.body.owner?.trim();
    console.log("Owner: ",ownerId)
    if (!original_image_url || !protected_image_url || !owner) {
        throw new ApiError(400, "Provide all fields")
    }

    const document = await TamperProof.create({
        owner: ownerId,
        originalImageUrl: original_image_url,
        protectedImageUrl: protected_image_url
    })

    res.status(201).json({
        document
    })
})

export const addDocumentToTamperProofHistory = asyncHandler(async(req,res)=>{
    const {image_url, watermarked_matched, owner} = req.body

     const ownerId = owner?.trim();
    if(!image_url || watermarked_matched == null || watermarked_matched == undefined || !ownerId){
        throw new ApiError(400,"Provide all fields")
    }

    const document = await TamperProofHistory.create({
        imageUrl: image_url,
        watermarkedMatched: watermarked_matched,
        tampered: !watermarked_matched,
        owner: ownerId
    })

    res.status(201).json({
        document
    })
})

