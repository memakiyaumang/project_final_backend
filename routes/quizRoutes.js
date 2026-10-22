import express from "express";

import {
  createQuiz,
  getQuiz,
  getQuizByFaculty,
  getQuizByCourse,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,

  // Student Quiz
  getStudentQuizzesByCourse,
  getStudentQuizById,
  submitQuizAttempt,
  getStudentQuizAttempts,
  getStudentQuizAttemptById,
  getStudentCourseQuizAttempts,
} from "../controller/quizController.js";

import authenticateToken from "../utils/authMiddleware.js";
import authorizeRoles from "../utils/roleMiddleware.js";

const router = express.Router();

// ==================================================
// CREATE QUIZ
// ==================================================

router.post(
  "/quizzes",
  authenticateToken,
  authorizeRoles("faculty"),
  createQuiz
);

// ==================================================
// GET ALL QUIZZES
// ==================================================

router.get(
  "/quizzes",
  authenticateToken,
  authorizeRoles("student", "faculty"),
  getQuiz
);

// ==================================================
// STUDENT - GET PUBLISHED QUIZZES BY COURSE
// ==================================================

router.get(
  "/quizzes/student/course/:courseId",
  authenticateToken,
  authorizeRoles("student"),
  getStudentQuizzesByCourse
);

// ==================================================
// STUDENT / FACULTY - GET ALL ATTEMPTS FOR COURSE
// ==================================================

router.get(
  "/quizzes/student/attempts/:studentId/course/:courseId",
  authenticateToken,
  authorizeRoles("student", "faculty"),
  getStudentCourseQuizAttempts
);

// ==================================================
// STUDENT - GET ATTEMPTS OF ONE QUIZ
// ==================================================

router.get(
  "/quizzes/student/attempts/:studentId/:quizId",
  authenticateToken,
  authorizeRoles("student"),
  getStudentQuizAttempts
);

// ==================================================
// STUDENT - GET ONE ATTEMPT
// ==================================================

router.get(
  "/quizzes/student/attempt/:attemptId",
  authenticateToken,
  authorizeRoles("student"),
  getStudentQuizAttemptById
);

// ==================================================
// STUDENT - GET SINGLE QUIZ
// ==================================================

router.get(
  "/quizzes/student/:id",
  authenticateToken,
  authorizeRoles("student"),
  getStudentQuizById
);

// ==================================================
// STUDENT - SUBMIT QUIZ
// ==================================================

router.post(
  "/quizzes/student/submit",
  authenticateToken,
  authorizeRoles("student"),
  submitQuizAttempt
);

// ==================================================
// FACULTY - GET QUIZZES
// ==================================================

router.get(
  "/quizzes/faculty/:facultyId",
  authenticateToken,
  authorizeRoles("faculty"),
  getQuizByFaculty
);

// ==================================================
// GET QUIZZES BY COURSE
// ==================================================

router.get(
  "/quizzes/course/:courseId",
  authenticateToken,
  authorizeRoles("student", "faculty"),
  getQuizByCourse
);

// ==================================================
// GET SINGLE QUIZ
// ==================================================

router.get(
  "/quizzes/:id",
  authenticateToken,
  authorizeRoles("student", "faculty"),
  getQuizById
);

// ==================================================
// UPDATE QUIZ
// ==================================================

router.put(
  "/quizzes/:id",
  authenticateToken,
  authorizeRoles("faculty"),
  updateQuiz
);

// ==================================================
// DELETE QUIZ
// ==================================================

router.delete(
  "/quizzes/:id",
  authenticateToken,
  authorizeRoles("faculty"),
  deleteQuiz
);

// ==================================================
// ADD QUESTION
// ==================================================

router.post(
  "/quizzes/:id/questions",
  authenticateToken,
  authorizeRoles("faculty"),
  addQuestion
);

// ==================================================
// UPDATE QUESTION
// ==================================================

router.put(
  "/quizzes/:quizId/questions/:questionId",
  authenticateToken,
  authorizeRoles("faculty"),
  updateQuestion
);

// ==================================================
// DELETE QUESTION
// ==================================================

router.delete(
  "/quizzes/:quizId/questions/:questionId",
  authenticateToken,
  authorizeRoles("faculty"),
  deleteQuestion
);

export default router;