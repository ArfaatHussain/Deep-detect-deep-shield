import { Router } from "express";
import {
  getAllUsers,
  getHistory,
  clearHistory,
  updateProfile
} from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";
const userRouter = Router();

// get all users
userRouter.route("/getAllUsers").get(getAllUsers);

// get user history
userRouter.route("/getHistory/:userId").get(getHistory);

userRouter.route("/update/:userId").patch(upload.single("avatar"),updateProfile)

userRouter.delete("/clearHistory/:userId", clearHistory);

export default userRouter;
