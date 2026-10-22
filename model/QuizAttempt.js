import mongoose from "mongoose";

const quizAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
    },

    selectedAnswer: {
      type: String,
      enum: ["A", "B", "C", "D", ""],
      default: "",
    },

    correctAnswer: {
      type: String,
      enum: ["A", "B", "C", "D"],
      required: true,
    },

    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
    },

    studentEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    quizId: {
      type: String,
      required: true,
    },

    courseId: {
      type: String,
      required: true,
    },

    quizTitle: {
      type: String,
      default: "",
      trim: true,
    },

    totalQuestions: {
      type: Number,
      default: 0,
    },

    correctAnswers: {
      type: Number,
      default: 0,
    },

    wrongAnswers: {
      type: Number,
      default: 0,
    },

    unanswered: {
      type: Number,
      default: 0,
    },

    score: {
      type: Number,
      default: 0,
    },

    percentage: {
      type: Number,
      default: 0,
    },

    passingScore: {
      type: Number,
      default: 0,
    },

    result: {
      type: String,
      enum: ["passed", "failed"],
      default: "failed",
    },

    answers: {
      type: [quizAnswerSchema],
      default: [],
    },

    startedAt: {
      type: Date,
      default: null,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const QuizAttempt = mongoose.model(
  "QuizAttempt",
  quizAttemptSchema
);

export default QuizAttempt;