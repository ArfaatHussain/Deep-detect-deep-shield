import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";
import express from "express"
import bcrypt from "bcrypt"
import { app } from "../app.js";


const register = asyncHandler(async (req, res) => {
    const { email, username, password, avatar } = req.body;

    if (!email || !username || !password) {
        throw new ApiError(400, "Provide all fields")
    }

    const user = await User.findOne({
        $or: [
            {
                email: email
            },
            {
                username: username
            }
        ]

    })

    if (user) {
        throw new ApiError(409, "User already exists")
    }

    let fieldsToAdd = {
        email,
        username,
        password
    }
    if (avatar) {
        const response = await uploadFileOnCloudinary(req.file.path);
        fieldsToAdd.avatar = response.url;
    }

    fieldsToAdd.password = await bcrypt.hash(password, 10);

    const newUser = await User.create(fieldsToAdd)
    const refreshToken = await newUser.generateRefreshToken()
    newUser.refreshToken = refreshToken
    await newUser.save()

    res.status(201).json({
        message: "User created"
    })

})

const login = asyncHandler( async(req,res)=>{
    const {email, username, password} = req.body;

    if((!email && !username) || !password){
        throw new ApiError(400,"Provide email or username and password")
    }

    let fieldsToCheck = []

    if(email){
        fieldsToCheck.push({email})
    }
    if(username){
        fieldsToCheck.push({username})
    }

    const user = await User.findOne({
        $or: fieldsToCheck
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    // Now checking password
    const isPasswordCorrect = await bcrypt.compare(password,user.password)
    if(!isPasswordCorrect){
        throw new ApiError(401,"Invalid credentials")
    }

    let userObj = user.toObject();
    delete userObj.password
    delete userObj.refreshToken

    const accessToken = await user.generateAccessToken()
    res.status(200).json({
        message: "Login success",
        data: {
            user: userObj,
            accessToken: accessToken
        }
    })
} )

export {register, login}