
import express from "express";

import { chatWithGemini } from "../controller/chatbotController.js";
import authenticateToken from "../utils/authMiddleware.js";
import authorizeRoles from "../utils/roleMiddleware.js";

const router = express.Router();

router.post(
  "/api/chatbot/chat",
  authenticateToken,
  authorizeRoles("student"),
  chatWithGemini
);

export default router;
