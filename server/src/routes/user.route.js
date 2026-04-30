import { Router } from "express";
import {
  getAllUsers,
  getHistory,
  clearHistory,
  requestProfileOTP,
  verifyAndUpdateProfile
} from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";
const userRouter = Router();

// get all users
userRouter.route("/getAllUsers").get(getAllUsers);

// get user history
userRouter.route("/getHistory/:userId").get(getHistory);

userRouter.post("/profile/request-otp", requestProfileOTP);
userRouter.post("/profile/verify-and-update", upload.single("avatar"), verifyAndUpdateProfile);

userRouter.delete("/clearHistory/:userId", clearHistory);

export default userRouter;
