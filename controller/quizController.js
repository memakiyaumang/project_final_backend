import Quiz from "../model/Quiz.js";
import User from "../model/User.js";
import Course from "../model/Course.js";
import QuizAttempt from "../model/QuizAttempt.js";

// ==================================================
// CREATE QUIZ
// ==================================================
export const createQuiz = async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      duration,
      passingScore,
      courseId,
      courseName,
      facultyId,
      facultyEmail,
      facultyName,
      questions,
    } = req.body;

    if (!title || !courseId || !facultyId) {
      return res.status(400).json({
        success: false,
        message: "Title, course and faculty are required",
      });
    }

    const faculty = await User.findById(facultyId);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    if (faculty.role !== "faculty") {
      return res.status(400).json({
        success: false,
        message: "Selected user is not a faculty",
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const quizData = {
      title,
      description: description || "",
      status: status || "draft",
      duration,
      passingScore,
      courseId: course._id.toString(),
      courseName: courseName || course.title,
      facultyId: faculty._id,
      facultyEmail: facultyEmail || faculty.email,
      facultyName:
        facultyName ||
        faculty.name ||
        faculty.fullName ||
        "",
      questions: questions || [],
    };

    const saveQuiz = await Quiz.create(quizData);

    res.status(200).json({
      success: true,
      message: "Quiz created successfully",
      data: saveQuiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================================================
// GET ALL QUIZZES
// ==================================================
export const getQuiz = async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate("facultyId", "name email role")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      data: quizzes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================================================
// GET QUIZZES BY FACULTY
// ==================================================
export const getQuizByFaculty = async (req, res) => {
  try {
    const facultyId = req.params.facultyId;

    const quizzes = await Quiz.find({
      facultyId,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: quizzes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================================================
// GET QUIZZES BY COURSE
// ==================================================
export const getQuizByCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;

    const quizzes = await Quiz.find({
      courseId,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: quizzes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================================================
// GET SINGLE QUIZ
// ==================================================
export const getQuizById = async (req, res) => {
  try {
    const quizId = req.params.id;

    const quiz = await Quiz.findById(quizId).populate(
      "facultyId",
      "name email role"
    );

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================================================
// UPDATE QUIZ
// ==================================================
export const updateQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;

    const updateData = {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      duration: req.body.duration,
      passingScore: req.body.passingScore,
      courseId: req.body.courseId,
      courseName: req.body.courseName,
      facultyId: req.body.facultyId,
      facultyEmail: req.body.facultyEmail,
      facultyName: req.body.facultyName,
      questions: req.body.questions,
    };

    const updatedQuiz =
      await Quiz.findByIdAndUpdate(
        quizId,
        updateData,
        {
          returnDocument: "after",
        }
      );

    if (!updatedQuiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Quiz updated successfully",
      data: updatedQuiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================================================
// DELETE QUIZ
// ==================================================
export const deleteQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;

    const deletedQuiz =
      await Quiz.findByIdAndDelete(quizId);

    if (!deletedQuiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Delete old attempts of this quiz
    await QuizAttempt.deleteMany({
      quizId: String(quizId),
    });

    res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================================================
// ADD QUESTION
// ==================================================
export const addQuestion = async (req, res) => {
  try {
    const quizId = req.params.id;

    const {
      question,
      options,
      correctAnswer,
    } = req.body;

    if (
      !question ||
      !options ||
      !options.A ||
      !options.B ||
      !options.C ||
      !options.D ||
      !correctAnswer
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Complete question details are required",
      });
    }

    const quiz =
      await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    quiz.questions.push({
      question,
      options: {
        A: options.A,
        B: options.B,
        C: options.C,
        D: options.D,
      },
      correctAnswer,
    });

    await quiz.save();

    res.status(200).json({
      success: true,
      message: "Question added successfully",
      data: quiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================================================
// UPDATE QUESTION
// ==================================================
export const updateQuestion = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const questionId = req.params.questionId;

    const quiz =
      await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    const question =
      quiz.questions.id(questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    question.question = req.body.question;
    question.options = req.body.options;
    question.correctAnswer =
      req.body.correctAnswer;

    await quiz.save();

    res.status(200).json({
      success: true,
      message: "Question updated successfully",
      data: quiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================================================
// DELETE QUESTION
// ==================================================
export const deleteQuestion = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const questionId = req.params.questionId;

    const quiz =
      await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    const question =
      quiz.questions.id(questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    question.deleteOne();

    await quiz.save();

    res.status(200).json({
      success: true,
      message: "Question deleted successfully",
      data: quiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================================================
// STUDENT - GET PUBLISHED QUIZZES BY COURSE
// Correct answers are NOT sent to frontend.
// ==================================================
export const getStudentQuizzesByCourse = async (
  req,
  res
) => {
  try {
    const courseId =
      String(req.params.courseId);

    const quizzes = await Quiz.find({
      courseId,
      status: "published",
    })
      .select(
        "_id title description duration passingScore courseId courseName questions createdAt"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    const studentQuizzes =
      quizzes.map((quiz) => ({
        ...quiz,

        questions:
          (quiz.questions || []).map(
            (question) => ({
              _id: question._id,
              question:
                question.question,
              options:
                question.options,
            })
          ),
      }));

    res.status(200).json({
      success: true,
      data: studentQuizzes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================================================
// STUDENT - GET SINGLE PUBLISHED QUIZ
// Correct answers are NOT sent to frontend.
// ==================================================
export const getStudentQuizById = async (
  req,
  res
) => {
  try {
    const quizId = req.params.id;

    const quiz =
      await Quiz.findOne({
        _id: quizId,
        status: "published",
      })
        .select(
          "_id title description duration passingScore courseId courseName questions"
        )
        .lean();

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message:
          "Quiz not found or not published",
      });
    }

    const studentQuiz = {
      ...quiz,

      questions:
        (quiz.questions || []).map(
          (question) => ({
            _id: question._id,
            question:
              question.question,
            options:
              question.options,
          })
        ),
    };

    res.status(200).json({
      success: true,
      data: studentQuiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================================================
// STUDENT - SUBMIT QUIZ
// ==================================================
export const submitQuizAttempt = async (
  req,
  res
) => {
  try {
    const {
      studentId,
      studentEmail,
      quizId,
      answers,
      startedAt,
    } = req.body;

    if (!studentId || !quizId) {
      return res.status(400).json({
        success: false,
        message:
          "Student and quiz are required",
      });
    }

    const quiz =
      await Quiz.findOne({
        _id: quizId,
        status: "published",
      }).lean();

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message:
          "Quiz not found or not published",
      });
    }

    const submittedAnswers =
      Array.isArray(answers)
        ? answers
        : [];

    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unanswered = 0;

    const answerResults =
      quiz.questions.map(
        (question) => {
          const submitted =
            submittedAnswers.find(
              (answer) =>
                String(
                  answer.questionId
                ) ===
                String(
                  question._id
                )
            );

          const selectedAnswer =
            submitted?.selectedAnswer ||
            "";

          const isCorrect =
            selectedAnswer !== "" &&
            selectedAnswer ===
              question.correctAnswer;

          if (!selectedAnswer) {
            unanswered++;
          } else if (isCorrect) {
            correctAnswers++;
          } else {
            wrongAnswers++;
          }

          return {
            questionId:
              String(question._id),

            selectedAnswer,

            correctAnswer:
              question.correctAnswer,

            isCorrect,
          };
        }
      );

    const totalQuestions =
      quiz.questions.length;

    const score = correctAnswers;

    const percentage =
      totalQuestions > 0
        ? Math.round(
            (correctAnswers /
              totalQuestions) *
              100
          )
        : 0;

    const result =
      percentage >= quiz.passingScore
        ? "passed"
        : "failed";

    const attempt =
      await QuizAttempt.create({
        studentId:
          String(studentId),

        studentEmail:
          studentEmail || "",

        quizId:
          String(quiz._id),

        courseId:
          String(quiz.courseId),

        quizTitle:
          quiz.title,

        totalQuestions,

        correctAnswers,

        wrongAnswers,

        unanswered,

        score,

        percentage,

        passingScore:
          quiz.passingScore,

        result,

        answers:
          answerResults,

        startedAt:
          startedAt
            ? new Date(startedAt)
            : null,

        submittedAt:
          new Date(),
      });

    res.status(200).json({
      success: true,

      message:
        "Quiz submitted successfully",

      data: {
        attemptId:
          attempt._id,

        quizId:
          String(quiz._id),

        quizTitle:
          quiz.title,

        courseId:
          String(quiz.courseId),

        totalQuestions,

        correctAnswers,

        wrongAnswers,

        unanswered,

        score,

        percentage,

        passingScore:
          quiz.passingScore,

        result,

        answers:
          answerResults,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================================================
// STUDENT - GET QUIZ ATTEMPTS
// ==================================================
export const getStudentQuizAttempts = async (
  req,
  res
) => {
  try {
    const {
      studentId,
      quizId,
    } = req.params;

    const attempts =
      await QuizAttempt.find({
        studentId:
          String(studentId),

        quizId:
          String(quizId),
      }).sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      data: attempts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==================================================
// STUDENT - GET ALL QUIZ ATTEMPTS FOR COURSE
// ==================================================
export const getStudentCourseQuizAttempts = async (
  req,
  res
) => {
  try {
    const {
      studentId,
      courseId,
    } = req.params;

    if (!studentId || !courseId) {
      return res.status(400).json({
        success: false,
        message:
          "Student ID and course ID are required",
      });
    }

    const attempts =
      await QuizAttempt.find({
        studentId: String(studentId),
        courseId: String(courseId),
      })
        .sort({
          createdAt: -1,
        })
        .lean();

    res.status(200).json({
      success: true,
      data: attempts,
    });
  } catch (error) {
    console.error(
      "Unable to get student course quiz attempts:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==================================================
// STUDENT - GET QUIZ ATTEMPT BY ATTEMPT ID
// ==================================================
export const getStudentQuizAttemptById = async (
  req,
  res
) => {
  try {
    const {
      attemptId,
    } = req.params;

    if (!attemptId) {
      return res.status(400).json({
        success: false,
        message: "Attempt ID is required",
      });
    }

    const attempt =
      await QuizAttempt.findById(
        attemptId
      ).lean();

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message:
          "Quiz attempt not found",
      });
    }

    res.status(200).json({
      success: true,
      data: attempt,
    });
  } catch (error) {
    console.error(
      "Unable to get quiz attempt:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};