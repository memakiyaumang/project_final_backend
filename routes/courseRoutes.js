import express from "express";

import {
    addCourse,
    getCourses,
    getFacultyDashboard,
    updateCourse,
    deleteCourse
} from "../controller/courseController.js";

import authenticateToken from "../utils/authMiddleware.js";
import authorizeRoles from "../utils/roleMiddleware.js";
import adminAuthMiddleware from "../utils/adminAuthMiddleware.js";

const route = express.Router();


// =========================================================
// FACULTY
// =========================================================

// Faculty Add Course
route.post(
    "/api/add-course",
    authenticateToken,
    authorizeRoles("faculty"),
    addCourse
);


// =========================================================
// STUDENT + FACULTY
// =========================================================

// Student + Faculty Get Courses
route.get(
    "/api/get-courses",
    authenticateToken,
    authorizeRoles("student", "faculty"),
    getCourses
);


// =========================================================
// ADMIN - COURSE MANAGEMENT
// =========================================================

// Admin Get All Courses
route.get(
    "/api/admin-courses",
    adminAuthMiddleware,
    getCourses
);


// Admin Add Course
route.post(
    "/api/admin/add-course",
    adminAuthMiddleware,
    addCourse
);


// Admin Update Course
route.put(
    "/api/admin/update-course/:id",
    adminAuthMiddleware,
    updateCourse
);


// Admin Delete Course
route.delete(
    "/api/admin/delete-course/:id",
    adminAuthMiddleware,
    deleteCourse
);


// =========================================================
// FACULTY DASHBOARD
// =========================================================

route.get(
    "/api/faculty-dashboard/:facultyId",
    authenticateToken,
    authorizeRoles("faculty"),
    getFacultyDashboard
);


// =========================================================
// FACULTY COURSE UPDATE
// =========================================================

route.put(
    "/api/update-course/:id",
    authenticateToken,
    authorizeRoles("faculty"),
    updateCourse
);


// =========================================================
// FACULTY COURSE DELETE
// =========================================================

route.delete(
    "/api/delete-course/:id",
    authenticateToken,
    authorizeRoles("faculty"),
    deleteCourse
);


export default route;