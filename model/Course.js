import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
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

    image: {
      type: String,
      default: ""
    },

    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      required: true
    },

    duration: {
      type: String,
      required: true,
      trim: true
    },

    faculty: {
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

    category: {
      type: String,
      enum: [
        "Programming",
        "Web Development",
        "Data Science",
        "Design",
        "Database",
        "Other"
      ],
      required: true
    },

    courseType: {
      type: String,
      enum: ["free", "paid"],
      required: true
    },

    price: {
      type: Number,
      default: 0
    },

    students: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ["draft", "pending", "published", "rejected"],
      default: "draft"
    }
  },
  {
    timestamps: true
  }
);

const Course = mongoose.model("Course", courseSchema);

export default Course;