import mongoose from "mongoose";

const tamperProofSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    hash: { type: String, required: true },     
    watermark: { type: String, required: true },
    protectedImageUrl: { type: String, required: true },

}, {
    timestamps: true,
})

export const TamperProof = mongoose.model("TamperProof", tamperProofSchema)