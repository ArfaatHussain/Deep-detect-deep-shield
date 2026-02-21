import { Router } from "express";
import {
  getAllUsers,
  getHistory,
  clearHistory
} from "../controllers/user.controller.js";

const userRouter = Router();

// get all users
userRouter.route("/getAllUsers").get(getAllUsers);

// get user history
userRouter.route("/getHistory/:userId").get(getHistory);

// clear user history ✅ CLEAN URL
userRouter.delete("/:userId/history", clearHistory);

export default userRouter;
