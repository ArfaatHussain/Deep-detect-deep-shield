import mongoose, {Schema, model} from "mongoose";


const resultSchema = Schema({
    explanation: String,
    class: String,
    resultVideo: String,
    confidenceScore: Number
})
const videoSchema = Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    videoUrl: String,
    detectionResult: resultSchema

},{
    timestamps: true
})

export const Video = model("Video",videoSchema)