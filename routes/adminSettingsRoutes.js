import express from "express";

import {
    getAdminSettings,
    updateAdminSettings,
    updateAdminProfile,
    updateAdminPassword,
    updateAdminPlatform,
    updateAdminNotifications,
} from "../controller/adminSettingsController.js";

import adminAuthMiddleware from "../utils/adminAuthMiddleware.js";

const router = express.Router();


/*
=====================================================
GET SETTINGS
=====================================================
*/
router.get(
    "/api/admin-settings/:adminId",
    adminAuthMiddleware,
    getAdminSettings
);


/*
=====================================================
UPDATE ALL SETTINGS
=====================================================
*/
router.put(
    "/api/admin-settings/:adminId",
    adminAuthMiddleware,
    updateAdminSettings
);


/*
=====================================================
UPDATE PROFILE
=====================================================
*/
router.put(
    "/api/admin-settings/:adminId/profile",
    adminAuthMiddleware,
    updateAdminProfile
);


/*
=====================================================
UPDATE PASSWORD
=====================================================
*/
router.put(
    "/api/admin-settings/:adminId/password",
    adminAuthMiddleware,
    updateAdminPassword
);


/*
=====================================================
UPDATE PLATFORM
=====================================================
*/
router.put(
    "/api/admin-settings/:adminId/platform",
    adminAuthMiddleware,
    updateAdminPlatform
);


/*
=====================================================
UPDATE NOTIFICATIONS
=====================================================
*/
router.put(
    "/api/admin-settings/:adminId/notifications",
    adminAuthMiddleware,
    updateAdminNotifications
);


export default router;