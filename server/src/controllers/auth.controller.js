import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import bcrypt from "bcrypt"
import { sendOTPEmail } from "../utils/emailService.js";
import { generateOTP, verifyOTP, cleanupExpiredOTPs, storeOTP } from "../utils/otpManager.js";

const requestRegisterOTP = asyncHandler(async (req, res) => {
    const { email, username, password, fullName } = req.body;

    if (!email || !username || !password || !fullName) {
        throw new ApiError(400, "Provide all fields");
    }

    const existingUser = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (existingUser) {
        throw new ApiError(409, "User already exists");
    }

    const otp = generateOTP();
    storeOTP(email, otp, "verification");
    await sendOTPEmail(email, otp, "verification");

    res.status(200).json({
        message: "Verification code sent to your email. It expires in 10 minutes.",
        code: otp,
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// STEP 2 — Verify OTP then create account
// POST /auth/register/verify-otp
// Body: { email, username, password, fullName, otp }
// ══════════════════════════════════════════════════════════════════════════════
const register = asyncHandler(async (req, res) => {
    const { email, username, password, fullName, otp } = req.body;
    console.log("Request Body Received: ", req.body);

    if (!email || !username || !password || !fullName || !otp) {
        throw new ApiError(400, "Provide all fields including the OTP");
    }

    // Verify OTP first — throws ApiError on failure
    const otpResult = verifyOTP(email, otp, "verification");
    if (!otpResult.valid) {
        throw new ApiError(400, otpResult.error);
    }

    // Check again in case of race condition
    const existingUser = await User.findOne({
        $or: [{ email }, { username }],
    });
    if (existingUser) {
        throw new ApiError(409, "User already exists");
    }

    let fieldsToAdd = { email, username, password, fullName };

    if (req.file) {
        const response = await uploadToCloudinary(req.file.path);
        console.log("Response URL from cloudinary: ", response.secure_url);
        fieldsToAdd.avatar = response.secure_url;
    }

    fieldsToAdd.password = await bcrypt.hash(password, 10);

    const newUser = await User.create(fieldsToAdd);
    console.log("New User: ", newUser);

    const refreshToken = await newUser.generateRefreshToken();
    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.status(201).json({
        message: "Email verified. Account created successfully.",
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN
// POST /auth/login
// ══════════════════════════════════════════════════════════════════════════════
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Provide email and password");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid email or password");
    }

    let userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    const accessToken = await user.generateAccessToken();

    res.status(200).json({
        message: "Login success",
        data: {
            user: userObj,
            accessToken,
        },
    });
});


// ══════════════════════════════════════════════════════════════════════════════
// RESEND OTP
// POST /auth/resend-otp
// Body: { email, purpose }  — purpose: 'verification' | 'profile_change'
// ══════════════════════════════════════════════════════════════════════════════
const resendOTP = asyncHandler(async (req, res) => {
    const { email, purpose = "verification" } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const otp = generateOTP();
    storeOTP(email, otp, purpose); // throws ApiError(429) if within cooldown
    await sendOTPEmail(email, otp, purpose);

    res.status(200).json({
        message: "A new code has been sent to your email.",
    });
});

export {
    requestRegisterOTP,
    register,
    login,
    resendOTP,
};