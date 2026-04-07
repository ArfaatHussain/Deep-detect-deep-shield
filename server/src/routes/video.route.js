import { Router } from "express";
import { saveDeepfakeVideoResult } from "../controllers/video.controller.js";

const videoRouter = Router();

videoRouter.post("/save-result", saveDeepfakeVideoResult);

export default videoRouter;

