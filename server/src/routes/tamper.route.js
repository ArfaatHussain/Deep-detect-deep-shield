import { Router } from "express";
import { protectImage,verifyImage } from "../controllers/tamper.controller.js";
import upload from "../middlewares/multer.middleware.js";
const tamperRouter = Router();

tamperRouter.post("/protect", upload.single("file"), protectImage);
tamperRouter.post("/verify", upload.single("file"), verifyImage);

export default tamperRouter;