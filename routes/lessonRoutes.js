import express from "express";

import {
  addLesson,
  getLessons,
  updateLesson,
  deleteLesson
} from "../controller/lessonController.js";

import authenticateToken from "../utils/authMiddleware.js"; 
import authorizeRoles from "../utils/roleMiddleware.js";

const route = express.Router();

route.post("/api/add-lesson",authenticateToken, authorizeRoles("faculty"), addLesson);

route.get("/api/get-lessons/:courseId",authenticateToken, authorizeRoles("student", "faculty"), getLessons);

route.put("/api/update-lesson/:id",authenticateToken, authorizeRoles("faculty"), updateLesson);

route.delete("/api/delete-lesson/:id",authenticateToken, authorizeRoles("faculty"), deleteLesson);

export default route;