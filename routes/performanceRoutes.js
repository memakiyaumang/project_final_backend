import express from "express";

import {
    getPerformancePrediction
} from "../controller/performanceController.js";

import authenticateToken
    from "../utils/authMiddleware.js";

import authorizeRoles
    from "../utils/roleMiddleware.js";


const route =
    express.Router();


route.get(

    "/api/faculty/student-performance/:studentId/:courseId",

    authenticateToken,

    authorizeRoles("faculty"),

    getPerformancePrediction

);


export default route;