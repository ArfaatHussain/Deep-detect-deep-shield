import { Router } from "express";
import { getAllUsers, getHistory } from "../controllers/user.controller.js";

const userRouter = Router()

userRouter.route("/getAllUsers").get(getAllUsers)
userRouter.route("/getHistory/:userId").get(getHistory)
export default userRouter