import express from "express";

import {
    getRecommendations,
} from "../controller/recommendationController.js";

import authenticateToken
    from "../utils/authMiddleware.js";

import authorizeRoles
    from "../utils/roleMiddleware.js";

const route = express.Router();

// =====================================================
// STUDENT COURSE RECOMMENDATIONS
// =====================================================

route.get(
    "/api/student/recommendations",
    authenticateToken,
    authorizeRoles("student"),
    getRecommendations
);

export default route;