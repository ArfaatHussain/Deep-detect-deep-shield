import mongoose, {Schema, model} from "mongoose";


const resultSchema = Schema({
    explanation: String,
    class: String,
    resultImage, String,
    confidenceScore: Number
})
const imageSchema = Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    imageUrl: String,
    detectionResult: resultSchema

},{
    timestamps: true
})

export const Image = model("Image",imageSchema)