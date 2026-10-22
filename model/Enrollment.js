import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true
    },

    studentEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    courseId: {
      type: String,
      required: true
    },

    courseName: {
      type: String,
      required: true,
      trim: true
    },

    progress: {
      type: Number,
      default: 0
    },

    completedLessons: {
      type: Number,
      default: 0
    },

    totalLessons: {
      type: Number,
      default: 0
    },

    completed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Enrollment = mongoose.model(
  "Enrollment",
  enrollmentSchema
);

export default Enrollment;