
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    type: {
      type: String,
      enum: [
        "enrollment",
        "payment",
        "course",
        "lesson",
        "quiz",
        "certificate",
        "general",
      ],
      default: "general",
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    link: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ studentId: 1, createdAt: -1 });

const Notification = mongoose.model(
  "Notification",
  notificationSchema
);

export default Notification;
