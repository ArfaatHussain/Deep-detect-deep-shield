import { Router } from "express";
import { detectImageForDeepfake, uploadFile } from "../controllers/image.controller.js";
import  upload  from "../middlewares/multer.middleware.js";

const imageRouter = Router()

imageRouter.route("/detectImage").post(upload.single("file"),detectImageForDeepfake)
imageRouter.route("/uploadFile").post(upload.single("file"),uploadFile)

export default imageRouter