
import Enrollment from "../model/Enrollment.js";
import User from "../model/User.js";
import Notification from "../model/Notification.js";
import { sendEmail } from "../utils/emailService.js";

// ==================================================
// Add / Enroll Student In Course
// Student Only
// ==================================================
export const addEnrollment = async (req, res) => {
  try {
    const {
      studentId,
      courseId,
      courseName,
      totalLessons
    } = req.body;

    if (!studentId || !courseId || !courseName) {
      return res.status(400).json({
        success: false,
        message: "Student and course information is required"
      });
    }

    const authenticatedId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId;

    if (!authenticatedId) {
      return res.status(401).json({
        success: false,
        message: "Student identity is missing from authentication token"
      });
    }

    if (String(authenticatedId) !== String(studentId)) {
      return res.status(403).json({
        success: false,
        message: "You can only enroll yourself"
      });
    }

    const student = await User.findById(authenticatedId).select(
      "name email role"
    );

    if (!student || student.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Valid student account not found"
      });
    }

    const studentEmail = student.email;

    const existingEnrollment = await Enrollment.findOne({
      studentId: String(authenticatedId),
      courseId: String(courseId)
    });

    if (existingEnrollment) {
      return res.status(200).json({
        success: true,
        message: "Student is already enrolled in this course",
        data: existingEnrollment
      });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      studentId: String(authenticatedId),
      studentEmail: studentEmail.toLowerCase(),
      courseId: String(courseId),
      courseName: String(courseName),
      progress: 0,
      completedLessons: 0,
      totalLessons: Number(totalLessons) || 0,
      completed: false
    });

    // Create enrollment notification
    let notificationCreated = false;

    try {
      await Notification.create({
        studentId: authenticatedId,
        title: "Enrollment Successful",
        message: `You have successfully enrolled in ${courseName}.`,
        type: "enrollment",
        isRead: false,
        link: "/courses"
      });

      notificationCreated = true;
    } catch (notificationError) {
      console.error(
        "Enrollment notification error:",
        notificationError.message
      );
    }

    // Send confirmation email
    let emailSent = false;

    try {
      const safeName = escapeHtml(student.name || "Student");
      const safeCourseName = escapeHtml(String(courseName));

      const emailResult = await sendEmail({
        to: studentEmail,
        subject: `Enrollment Confirmed - ${courseName}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #333;">
            <h2 style="color: #6d3df5;">Welcome to LearnDesk!</h2>
            <p>Hello ${safeName},</p>
            <p>Your enrollment has been completed successfully.</p>
            <div style="background: #f5f2ff; padding: 18px; border-radius: 8px;">
              <h3 style="margin-top: 0;">Course Details</h3>
              <p><strong>Course:</strong> ${safeCourseName}</p>
              <p><strong>Course ID:</strong> ${escapeHtml(String(courseId))}</p>
              <p><strong>Lessons:</strong> ${Number(totalLessons) || 0}</p>
              <p><strong>Status:</strong> Enrolled</p>
              <p><strong>Enrollment Date:</strong> ${new Date(enrollment.createdAt).toLocaleDateString("en-IN")}</p>
            </div>
            <p>You can now visit LearnDesk to continue your learning.</p>
            <p>Happy Learning!<br/><strong>Team LearnDesk</strong></p>
          </div>
        `,
        textContent:
          `Hello ${student.name || "Student"}, you have successfully enrolled in ${courseName}. ` +
          `Course ID: ${courseId}. Status: Enrolled.`
      });

      emailSent = emailResult.success === true;
    } catch (emailError) {
      console.error(
        "Enrollment email could not be sent:",
        emailError.message
      );
    }

    return res.status(201).json({
      success: true,
      message: "Student enrolled successfully",
      emailSent,
      notificationCreated,
      data: enrollment
    });
  } catch (error) {
    console.error("Add Enrollment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to enroll student"
    });
  }
};

// Escape HTML email content
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

// ==================================================
// Get Student Enrollments
// Student + Faculty
// ==================================================
export const getStudentEnrollments = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required"
      });
    }

    const enrollments = await Enrollment.find({
      studentId: String(studentId)
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    console.error("Get Student Enrollments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get student enrollments"
    });
  }
};

// ==================================================
// Get ALL Enrollments
// Admin Only
// ==================================================
export const getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find().sort({
      createdAt: -1
    });

    return res.status(200).json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    console.error("Get All Enrollments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get enrollments"
    });
  }
};

// ==================================================
// Get Single Enrollment
// Student + Faculty
// ==================================================
export const getEnrollment = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    if (!studentId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Student ID and Course ID are required"
      });
    }

    const enrollment = await Enrollment.findOne({
      studentId: String(studentId),
      courseId: String(courseId)
    });

    if (!enrollment) {
      return res.status(200).json({
        success: false,
        message: "Enrollment not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error("Get Enrollment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get enrollment"
    });
  }
};

// ==================================================
// Get Student Progress
// Student + Faculty
// ==================================================
export const getStudentProgress = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    if (!studentId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Student ID and Course ID are required"
      });
    }

    const enrollment = await Enrollment.findOne({
      studentId: String(studentId),
      courseId: String(courseId)
    });

    if (!enrollment) {
      return res.status(200).json({
        success: false,
        message: "Progress not found",
        data: {
          studentId: String(studentId),
          courseId: String(courseId),
          progress: 0,
          completedLessons: 0,
          totalLessons: 0,
          completed: false
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        courseName: enrollment.courseName,
        progress: Number(enrollment.progress) || 0,
        completedLessons: Number(enrollment.completedLessons) || 0,
        totalLessons: Number(enrollment.totalLessons) || 0,
        completed: enrollment.completed === true
      }
    });
  } catch (error) {
    console.error("Get Student Progress Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get student progress"
    });
  }
};

// ==================================================
// Update Enrollment Progress
// Student Only
// ==================================================
export const updateEnrollmentProgress = async (req, res) => {
  try {
    const {
      studentId,
      courseId,
      progress,
      completedLessons,
      totalLessons,
      completed
    } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Student ID and Course ID are required"
      });
    }

    const updatedEnrollment = await Enrollment.findOneAndUpdate(
      {
        studentId: String(studentId),
        courseId: String(courseId)
      },
      {
        progress: Number(progress) || 0,
        completedLessons: Number(completedLessons) || 0,
        totalLessons: Number(totalLessons) || 0,
        completed: completed === true
      },
      { returnDocument: "after" }
    );

    if (!updatedEnrollment) {
      return res.status(200).json({
        success: false,
        message: "Enrollment not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Enrollment progress updated successfully",
      data: updatedEnrollment
    });
  } catch (error) {
    console.error("Update Enrollment Progress Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update enrollment progress"
    });
  }
};

// ==================================================
// Delete Enrollment
// Student Only
// ==================================================
export const deleteEnrollment = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    if (!studentId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Student ID and Course ID are required"
      });
    }

    const deletedEnrollment = await Enrollment.findOneAndDelete({
      studentId: String(studentId),
      courseId: String(courseId)
    });

    if (!deletedEnrollment) {
      return res.status(200).json({
        success: false,
        message: "Enrollment not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Enrollment deleted successfully",
      data: deletedEnrollment
    });
  } catch (error) {
    console.error("Delete Enrollment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete enrollment"
    });
  }
};
