import mongoose from "mongoose";

const tamperProofHistorySchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    hashMatched: { type: Boolean, required: true },     
    watermarkMatched: { type: Boolean, required: true },
    tampered: {type: Boolean, required: true},
}, {
    timestamps: true,
})

export const TamperProofHistory = mongoose.model("TamperProofHistory", tamperProofHistorySchema)