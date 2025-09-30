import { Router } from "express";
import { getAllUsers } from "../controllers/user.controller.js";

const userRouter = Router()

userRouter.route("/getAllUsers").get(getAllUsers)

export default userRouter