import express from "express";

import {
  createPaymentOrder,
  verifyPayment,
} from "../controller/paymentController.js";

import authenticateToken from "../utils/authMiddleware.js";
import authorizeRoles from "../utils/roleMiddleware.js";

const router = express.Router();

// Create Razorpay payment order
router.post(
  "/api/payments/create-order",
  authenticateToken,
  authorizeRoles("student"),
  createPaymentOrder
);

// Verify Razorpay payment
router.post(
  "/api/payments/verify",
  authenticateToken,
  authorizeRoles("student"),
  verifyPayment
);

export default router;