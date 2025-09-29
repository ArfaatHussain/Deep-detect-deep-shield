import mongoose from "mongoose";
import jwt from "jsonwebtoken"
const userSchema = mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    password: {
        type: String,
        required: true,
    },
    avatar: String,
    refreshToken: String
}, {
    timestamps: true
})

userSchema.methods.generateRefreshToken = async function () {
    try {
        return jwt.sign({
            _id: this._id,
        },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY
            }
        )
    } catch (error) {
        console.error("Error generating refresh token")
    }
}

userSchema.methods.generateAccessToken = async function () {
    try {
        return jwt.sign({
            _id: this._id,
            username: this.username
        },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY
            }
        )
    } catch (error) {
        console.error("Error generating access token")
    }
}

export const User = mongoose.model("User", userSchema)