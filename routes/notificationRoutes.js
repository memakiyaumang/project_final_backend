
import express from "express";

import authenticateToken from "../utils/authMiddleware.js";
import authorizeRoles from "../utils/roleMiddleware.js";

import {
  getStudentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteStudentNotification,
} from "../controller/notificationController.js";

const router = express.Router();

router.get(
  "/api/student/notifications",
  authenticateToken,
  authorizeRoles("student"),
  getStudentNotifications
);

router.patch(
  "/api/student/notifications/read-all",
  authenticateToken,
  authorizeRoles("student"),
  markAllNotificationsAsRead
);

router.patch(
  "/api/student/notifications/:notificationId/read",
  authenticateToken,
  authorizeRoles("student"),
  markNotificationAsRead
);

router.delete(
  "/api/student/notifications/:notificationId",
  authenticateToken,
  authorizeRoles("student"),
  deleteStudentNotification
);

export default router;
