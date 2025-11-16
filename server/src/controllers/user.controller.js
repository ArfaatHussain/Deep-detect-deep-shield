
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import mongoose from "mongoose"
import { Image } from "../models/image.model.js"
import { Video } from "../models/video.model.js"
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find()
    res.status(200).json({
        users
    })
})

const getHistory = asyncHandler(async(req,res)=>{
    const {userId} = req.params;
    if(!userId){
        throw new ApiError(400,"User id is required")
    }

    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError(400,"User id is not valid")
    }

    const imageDetectionHistory = await  Image.find({owner: userId})
    const videoDetectionHistory = await Video.find({owner: userId})

    if(imageDetectionHistory.length == 0 && videoDetectionHistory.length == 0){
        throw new ApiError(404,"No history found")
    }

    res.status(200).json({
        imageHistory: imageDetectionHistory,
        videoHistory: videoDetectionHistory
    })
    
})

export {getAllUsers, getHistory}