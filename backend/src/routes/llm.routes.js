import { Router } from "express";
import { chatWithLLM } from "../controllers/llmController.js";

const router = Router();

// Chat endpoint
router.post("/chat", chatWithLLM);

export default router;
