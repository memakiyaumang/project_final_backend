import express from "express";

import {
    adminLogin,
    createAdmin,
    getAdminProfile,
} from "../controller/adminController.js";

import adminAuthMiddleware from "../utils/adminAuthMiddleware.js";

const router = express.Router();


/*
=====================================================
ADMIN LOGIN
=====================================================
*/
router.post(
    "/api/admin-login",
    adminLogin
);


/*
=====================================================
CREATE ADMIN
=====================================================
*/
router.post(
    "/api/create-admin",
    createAdmin
);


/*
=====================================================
GET ADMIN PROFILE
=====================================================
*/
router.get(
    "/api/admin-profile",
    adminAuthMiddleware,
    getAdminProfile
);


export default router;