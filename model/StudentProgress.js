import mongoose from "mongoose";

const studentProgressSchema = new mongoose.Schema(
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

    lessonId: {
      type: String,
      required: true
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

const StudentProgress = mongoose.model(
  "StudentProgress",
  studentProgressSchema
);

export default StudentProgress;