import { Router } from "express";
import { addDocumentToTamperProof, addDocumentToTamperProofHistory } from "../controllers/tamper.controller.js";
const tamperRouter = Router();

tamperRouter.post("/addDocumentToTamperProof", addDocumentToTamperProof)
tamperRouter.post("/addDocumentToTamperProofHistory", addDocumentToTamperProofHistory)

export default tamperRouter;