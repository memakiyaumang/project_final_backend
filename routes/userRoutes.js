
import express from "express";

import {
    // Common user controllers
    register,
    login,
    googleAuth,
    getUser,
    getUserById,
    updateUserStatus,
    updateUser,
    deleteUser,

    // Faculty profile
    getFacultyProfile,

    // Admin faculty controllers
    adminGetFaculty,
    adminAddFaculty,
    adminUpdateFaculty,
    adminUpdateFacultyStatus,
    adminDeleteFaculty,

    // Admin student controllers
    adminGetStudents,
    adminUpdateStudent,
    adminUpdateStudentStatus,
    adminDeleteStudent,
} from "../controller/userDataController.js";

import authenticateToken from "../utils/authMiddleware.js";
import adminAuthMiddleware from "../utils/adminAuthMiddleware.js";

const route = express.Router();

// Register student / faculty
route.post("/api/register", register);

// Login student / faculty
route.post("/api/login", login);

// Google login / registration
route.post("/api/google-auth", googleAuth);

// Admin - get all users
route.get(
    "/api/get-userdata",
    adminAuthMiddleware,
    getUser
);

route.get(
    "/api/faculty/get-userdata",
    authenticateToken,
    getUser
);

// Admin faculty management
route.get(
    "/api/admin-faculty",
    adminAuthMiddleware,
    adminGetFaculty
);

route.post(
    "/api/admin/add-faculty",
    adminAuthMiddleware,
    adminAddFaculty
);

route.put(
    "/api/admin/update-faculty/:id",
    adminAuthMiddleware,
    adminUpdateFaculty
);

route.put(
    "/api/admin/faculty-status/:id",
    adminAuthMiddleware,
    adminUpdateFacultyStatus
);

route.delete(
    "/api/admin/delete-faculty/:id",
    adminAuthMiddleware,
    adminDeleteFaculty
);

// Faculty profile
route.get(
    "/api/faculty-profile/:facultyId",
    authenticateToken,
    getFacultyProfile
);

// Update user status
route.put(
    "/api/update-user-status/:id",
    updateUserStatus
);

// Update user profile
route.put(
    "/api/update-user/:id",
    authenticateToken,
    updateUser
);

// Delete user
route.delete(
    "/api/delete-user/:id",
    deleteUser
);

// Get user by ID
route.get(
    "/api/get-user/:id",
    authenticateToken,
    getUserById
);

// Admin student management
route.get(
    "/api/admin-students",
    adminAuthMiddleware,
    adminGetStudents
);

route.put(
    "/api/admin/update-student/:id",
    adminAuthMiddleware,
    adminUpdateStudent
);

route.put(
    "/api/admin/student-status/:id",
    adminAuthMiddleware,
    adminUpdateStudentStatus
);

route.delete(
    "/api/admin/delete-student/:id",
    adminAuthMiddleware,
    adminDeleteStudent
);

export default route;
