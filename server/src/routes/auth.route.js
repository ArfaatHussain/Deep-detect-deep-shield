import { Router } from "express";
import { register, login, getAllUsers } from "../controllers/auth.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const authRouter = Router()

authRouter.route("/register").post(upload.single("avatar"),register)
authRouter.route("/login").post(login)
authRouter.route("/getAllUsers").get(getAllUsers)
export {authRouter}