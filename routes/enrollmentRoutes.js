import express from "express";

import {
  addEnrollment,
  getStudentEnrollments,
  getAllEnrollments,
  getEnrollment,
  getStudentProgress,
  updateEnrollmentProgress,
  deleteEnrollment
} from "../controller/enrollmentController.js";

import authenticateToken from "../utils/authMiddleware.js";

import authorizeRoles from "../utils/roleMiddleware.js";

import adminAuthMiddleware from "../utils/adminAuthMiddleware.js";

const route = express.Router();


// ==================================================
// Add / Enroll Student
// Student Only
// ==================================================

route.post(
  "/api/add-enrollment",
  authenticateToken,
  authorizeRoles("student"),
  addEnrollment
);


// ==================================================
// Get All Student Enrollments
// Student + Faculty
// ==================================================

route.get(
  "/api/get-enrollments/:studentId",
  authenticateToken,
  authorizeRoles(
    "student",
    "faculty"
  ),
  getStudentEnrollments
);


// ==================================================
// Get ALL Enrollments
// Admin Only
// ==================================================

route.get(
  "/api/admin-enrollments",
  adminAuthMiddleware,
  getAllEnrollments
);


// ==================================================
// Get Single Enrollment
// Student + Faculty
// ==================================================

route.get(
  "/api/get-enrollment/:studentId/:courseId",
  authenticateToken,
  authorizeRoles(
    "student",
    "faculty"
  ),
  getEnrollment
);


// ==================================================
// Get Student Progress
// Student + Faculty
// ==================================================

route.get(
  "/api/get-progress/:studentId/:courseId",
  authenticateToken,
  authorizeRoles(
    "student",
    "faculty"
  ),
  getStudentProgress
);


// ==================================================
// Update Enrollment Progress
// Student Only
// ==================================================

route.put(
  "/api/update-enrollment-progress",
  authenticateToken,
  authorizeRoles("student"),
  updateEnrollmentProgress
);


// ==================================================
// Delete Enrollment
// Student Only
// ==================================================

route.delete(
  "/api/delete-enrollment/:studentId/:courseId",
  authenticateToken,
  authorizeRoles("student"),
  deleteEnrollment
);


export default route;