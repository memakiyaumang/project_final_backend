import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["student", "faculty"],
      default: "student",
    },

    qualification: {
      type: String,
      trim: true,
      default: "",
    },

    specialization: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================
    // FACULTY PROFILE FIELDS
    // =====================================

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    department: {
      type: String,
      trim: true,
      default: "",
    },

    experience: {
      type: String,
      trim: true,
      default: "",
    },

    education: {
      type: String,
      trim: true,
      default: "",
    },

    bio: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================
    // STUDENT SETTINGS
    // =====================================

    notifications: {
      courseUpdates: {
        type: Boolean,
        default: true,
      },

      newCourses: {
        type: Boolean,
        default: true,
      },

      emailNotifications: {
        type: Boolean,
        default: false,
      },
    },

    appearance: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },

    // =====================================
    // USER STATUS
    // =====================================

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;