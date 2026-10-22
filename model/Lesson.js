import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    courseId: {
      type: String,
      required: true
    },

    courseName: {
      type: String,
      required: true,
      trim: true
    },

    facultyId: {
      type: String,
      default: ""
    },

    facultyEmail: {
      type: String,
      default: ""
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: "",
      trim: true
    },

    videoUrl: {
      type: String,
      default: "",
      trim: true
    },

    materialUrl: {
      type: String,
      default: "",
      trim: true
    },

    duration: {
      type: String,
      default: "",
      trim: true
    },

    order: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

const Lesson = mongoose.model("Lesson", lessonSchema);

export default Lesson;