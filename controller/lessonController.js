import Lesson from "../model/Lesson.js";
import Enrollment from "../model/Enrollment.js";
import Notification from "../model/Notification.js";

// ==================================================
// Add Lesson + Notify Enrolled Students
// ==================================================

export const addLesson = async (req, res) => {
  try {
    const {
      courseId,
      courseName,
      facultyId,
      facultyEmail,
      title,
      description,
      videoUrl,
      materialUrl,
      duration,
      order
    } = req.body;

    if (!courseId || !title) {
      return res.status(400).json({
        success: false,
        message: "Course ID and lesson title are required"
      });
    }

    // Save the lesson
    const saveLesson = await Lesson.create({
      courseId: String(courseId),
      courseName: courseName || "",
      facultyId: facultyId || "",
      facultyEmail: facultyEmail || "",
      title,
      description: description || "",
      videoUrl: videoUrl || "",
      materialUrl: materialUrl || "",
      duration: duration || "",
      order: Number(order) || 1
    });

    let notificationsCreated = 0;

    // Create notifications for students enrolled in this course
    try {
      const enrollments = await Enrollment.find({
        courseId: String(courseId)
      }).select("studentId");

      const studentIds = [
        ...new Set(
          enrollments
            .map((enrollment) =>
              String(enrollment.studentId || "")
            )
            .filter(Boolean)
        )
      ];

      if (studentIds.length > 0) {
        const notificationData = studentIds.map((studentId) => ({
          studentId,
          title: "New Lesson Added",
          message: `A new lesson "${title}" has been added to ${
            courseName || "your enrolled course"
          }.`,
          type: "lesson",
          isRead: false,
          link: "/courses"
        }));

        const createdNotifications =
          await Notification.insertMany(notificationData);

        notificationsCreated = createdNotifications.length;
      }
    } catch (notificationError) {
      // Keep the saved lesson even if notification creation fails.
      console.error(
        "Lesson notification error:",
        notificationError.message
      );
    }

    return res.status(201).json({
      success: true,
      message: "Lesson added successfully",
      data: saveLesson,
      notificationsCreated
    });

  } catch (error) {
    console.error("Add Lesson Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ==================================================
// Get Lessons by Course
// ==================================================

export const getLessons = async (req, res) => {
  try {
    const courseId = req.params.courseId;

    const lessons = await Lesson.find({
      courseId: String(courseId)
    }).sort({
      order: 1
    });

    return res.status(200).json({
      success: true,
      data: lessons
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ==================================================
// Update Lesson
// ==================================================

export const updateLesson = async (req, res) => {
  try {
    const lessonId = req.params.id;

    const updateLessonData = {
      title: req.body.title,
      description: req.body.description || "",
      videoUrl: req.body.videoUrl || "",
      materialUrl: req.body.materialUrl || "",
      duration: req.body.duration || "",
      order: Number(req.body.order) || 1
    };

    const updatedLesson = await Lesson.findByIdAndUpdate(
      lessonId,
      updateLessonData,
      {
        returnDocument: "after",
        runValidators: true
      }
    );

    if (!updatedLesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lesson updated successfully",
      data: updatedLesson
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ==================================================
// Delete Lesson
// ==================================================

export const deleteLesson = async (req, res) => {
  try {
    const lessonId = req.params.id;

    const deletedLesson =
      await Lesson.findByIdAndDelete(lessonId);

    if (!deletedLesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lesson deleted successfully",
      data: deletedLesson
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};