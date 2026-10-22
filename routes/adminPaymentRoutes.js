
import express from "express";

import {
    getAllPayments
} from "../controller/adminPaymentController.js";

import adminAuthMiddleware from "../utils/adminAuthMiddleware.js";

const router = express.Router();

// GET ALL PAYMENTS — ADMIN ONLY
router.get(
    "/api/admin/payments",
    adminAuthMiddleware,
    getAllPayments
);

export default router;