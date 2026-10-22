import express from "express";

import {

    // ===============================
    // COMMON USER CONTROLLERS
    // ===============================

    register,
    login,

    getUser,
    getUserById,

    updateUserStatus,
    updateUser,

    deleteUser,


    // ===============================
    // FACULTY PROFILE
    // ===============================

    getFacultyProfile,


    // ===============================
    // ADMIN FACULTY CONTROLLERS
    // ===============================

    adminGetFaculty,
    adminAddFaculty,
    adminUpdateFaculty,
    adminUpdateFacultyStatus,
    adminDeleteFaculty,

    adminGetStudents,
adminUpdateStudent,
adminUpdateStudentStatus,
adminDeleteStudent,


} from "../controller/userDataController.js";


import authenticateToken 
from "../utils/authMiddleware.js";


import adminAuthMiddleware 
from "../utils/adminAuthMiddleware.js";


const route = express.Router();



// =====================================================
// REGISTER STUDENT / FACULTY
// =====================================================

route.post(
    "/api/register",
    register
);



// =====================================================
// LOGIN STUDENT / FACULTY
// =====================================================

route.post(
    "/api/login",
    login
);




// =====================================================
// ADMIN - GET ALL USERS (STUDENT + FACULTY)
// =====================================================

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




// =====================================================
// ADMIN FACULTY MANAGEMENT
// =====================================================


// GET ALL FACULTY

route.get(
    "/api/admin-faculty",
    adminAuthMiddleware,
    adminGetFaculty
);




// ADD FACULTY

route.post(
    "/api/admin/add-faculty",
    adminAuthMiddleware,
    adminAddFaculty
);




// UPDATE FACULTY

route.put(
    "/api/admin/update-faculty/:id",
    adminAuthMiddleware,
    adminUpdateFaculty
);




// UPDATE FACULTY STATUS

route.put(
    "/api/admin/faculty-status/:id",
    adminAuthMiddleware,
    adminUpdateFacultyStatus
);




// DELETE FACULTY

route.delete(
    "/api/admin/delete-faculty/:id",
    adminAuthMiddleware,
    adminDeleteFaculty
);





// =====================================================
// FACULTY PROFILE
// Student / Faculty JWT
// =====================================================

route.get(
    "/api/faculty-profile/:facultyId",
    authenticateToken,
    getFacultyProfile
);





// =====================================================
// UPDATE USER STATUS
// Student / Faculty
// =====================================================

route.put(
    "/api/update-user-status/:id",
    updateUserStatus
);





// =====================================================
// UPDATE USER PROFILE
// Student / Faculty JWT
// =====================================================

route.put(
    "/api/update-user/:id",
    authenticateToken,
    updateUser
);





// =====================================================
// DELETE USER
// Student / Faculty
// =====================================================

route.delete(
    "/api/delete-user/:id",
    deleteUser
);





// =====================================================
// GET USER BY ID
// Student / Faculty JWT
// =====================================================

route.get(
    "/api/get-user/:id",
    authenticateToken,
    getUserById
);


// =====================================================
// ADMIN - STUDENT MANAGEMENT
// =====================================================


// GET ALL STUDENTS

route.get(
    "/api/admin-students",
    adminAuthMiddleware,
    adminGetStudents
);



// UPDATE STUDENT

route.put(
    "/api/admin/update-student/:id",
    adminAuthMiddleware,
    adminUpdateStudent
);



// UPDATE STUDENT STATUS

route.put(
    "/api/admin/student-status/:id",
    adminAuthMiddleware,
    adminUpdateStudentStatus
);



// DELETE STUDENT

route.delete(
    "/api/admin/delete-student/:id",
    adminAuthMiddleware,
    adminDeleteStudent
);


export default route;