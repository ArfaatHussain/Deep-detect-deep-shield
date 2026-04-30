import { Router } from "express";
import {
    requestRegisterOTP,
    register,
    login,
    resendOTP,
} from "../controllers/auth.controller.js";
import upload from "../middlewares/multer.middleware.js";

const authRouter = Router();

// ── Registration (2-step) ──────────────────────────────────────────────────────
authRouter.post("/register/request-otp", requestRegisterOTP);
authRouter.post("/register/verify-otp", upload.single("avatar"), register);

// ── Login ──────────────────────────────────────────────────────────────────────
authRouter.post("/login", login);

// ── Resend OTP (shared) ────────────────────────────────────────────────────────
authRouter.post("/resend-otp", resendOTP);

export { authRouter };
