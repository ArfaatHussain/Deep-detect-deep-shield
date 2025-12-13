import { Router } from "express";
import { detectImageForDeepfake } from "../controllers/image.controller.js";
import  upload  from "../middlewares/multer.middleware.js";

const imageRouter = Router()

imageRouter.route("/detectImage").post(upload.single("file"),detectImageForDeepfake)

export default imageRouter