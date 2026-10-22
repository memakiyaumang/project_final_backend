
import mongoose from "mongoose";
import Notification from "../model/Notification.js";

const getStudentId = (req) => {
  return req.user?.id || req.user?._id || req.user?.userId;
};

// GET: Logged-in student's notifications
export const getStudentNotifications = async (req, res) => {
  try {
    const studentId = getStudentId(req);

    if (!studentId || !mongoose.isValidObjectId(studentId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid student authentication.",
      });
    }

    const notifications = await Notification.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      studentId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch notifications.",
    });
  }
};

// PATCH: Mark one notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const { notificationId } = req.params;

    if (!studentId || !mongoose.isValidObjectId(studentId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid student authentication.",
      });
    }

    if (!mongoose.isValidObjectId(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, studentId },
      { $set: { isRead: true } },
      { returnDocument: "after" }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update notification.",
    });
  }
};

// PATCH: Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const studentId = getStudentId(req);

    if (!studentId || !mongoose.isValidObjectId(studentId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid student authentication.",
      });
    }

    await Notification.updateMany(
      { studentId, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update notifications.",
    });
  }
};

// DELETE: Delete one notification
export const deleteStudentNotification = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const { notificationId } = req.params;

    if (!studentId || !mongoose.isValidObjectId(studentId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid student authentication.",
      });
    }

    if (!mongoose.isValidObjectId(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      studentId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted.",
    });
  } catch (error) {
    console.error("Delete notification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete notification.",
    });
  }
};
