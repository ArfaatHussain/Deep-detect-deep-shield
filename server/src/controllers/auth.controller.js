import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import bcrypt from "bcrypt"

const register = asyncHandler(
    /**
 * @param {import("express").Request} req - Express request
 * @param {import("express").Response} res - Express response
 * @param {import("express").NextFunction} next - Express next
 */
    async (req, res) => {
        const { email, username, password, fullName } = req.body
        console.log('Request Body Received: ', req.body)

        if (!email || !username || !password || !fullName) {
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
            password,
            fullName
        }
        if (req.file) {
            const response = await uploadToCloudinary(req.file.path);
            console.log("Response URL from cloudinary: ", response.secure_url)
            fieldsToAdd.avatar = response.url;
        }

        fieldsToAdd.password = await bcrypt.hash(password, 10);

        const newUser = await User.create(fieldsToAdd)
        console.log("New User: ", newUser)
        const refreshToken = await newUser.generateRefreshToken()
        newUser.refreshToken = refreshToken
        await newUser.save()

        res.status(201).json({
            message: "User created"
        })

    })

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, "Provide email and password")
    }

    const user = await User.findOne({
        email
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    // Now checking password
    const isPasswordCorrect = await bcrypt.compare(password, user.password)
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid email or password")
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
})

export { register, login }