import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      A: {
        type: String,
        required: true,
        trim: true,
      },

      B: {
        type: String,
        required: true,
        trim: true,
      },

      C: {
        type: String,
        required: true,
        trim: true,
      },

      D: {
        type: String,
        required: true,
        trim: true,
      },
    },

    correctAnswer: {
      type: String,
      required: true,
      enum: ["A", "B", "C", "D"],
    },
  },
  {
    timestamps: true,
  }
);

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    duration: {
      type: Number,
      required: true,
      min: 1,
    },

    passingScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    // Course._id is stored as String in our existing frontend/backend flow
    courseId: {
      type: String,
      required: true,
    },

    courseName: {
      type: String,
      default: "",
      trim: true,
    },

    // User._id is MongoDB ObjectId
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    facultyEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    facultyName: {
      type: String,
      default: "",
      trim: true,
    },

    questions: {
      type: [questionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;