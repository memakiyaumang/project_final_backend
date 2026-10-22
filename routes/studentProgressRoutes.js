import express from "express";

import {
  updateProgress,
  getStudentProgress,
  deleteProgress
} from "../controller/studentProgressController.js";

import authenticateToken from "../utils/authMiddleware.js";
import authorizeRoles from "../utils/roleMiddleware.js";

const route = express.Router();


// Save / Update Progress
route.put(
  "/api/update-progress",
  authenticateToken,
  authorizeRoles("student"),
  updateProgress
);


// Get Student Progress
route.get(
  "/api/get-progress/:studentId/:courseId",
  authenticateToken,
  authorizeRoles("student", "faculty"),
  getStudentProgress
);


// Delete Student Progress
route.delete(
  "/api/delete-progress/:studentId/:courseId",
  authenticateToken,
  authorizeRoles("student"),
  deleteProgress
);


export default route;