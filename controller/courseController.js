
import mongoose from "mongoose";

import Course from "../model/Course.js";
import Enrollment from "../model/Enrollment.js";
import Lesson from "../model/Lesson.js";
import User from "../model/User.js";
import Notification from "../model/Notification.js";
import { sendEmail } from "../utils/emailService.js";

// =========================================================
// CHECK WHETHER REQUEST CAME FROM ADMIN COURSE ROUTE
// =========================================================
const isAdminCourseRequest = (req) => {
  const requestUrl = String(req.originalUrl || req.url || "");
  return requestUrl.split("?")[0].startsWith("/api/admin/");
};

// =========================================================
// FIND ASSIGNED FACULTY
// =========================================================
const findAssignedFaculty = async (facultyId, facultyEmail) => {
  let assignedFaculty = null;

  if (
    facultyId &&
    mongoose.Types.ObjectId.isValid(String(facultyId))
  ) {
    assignedFaculty = await User.findOne({
      _id: facultyId,
      role: "faculty"
    });
  }

  if (!assignedFaculty && facultyEmail) {
    assignedFaculty = await User.findOne({
      email: String(facultyEmail).trim().toLowerCase(),
      role: "faculty"
    });
  }

  return assignedFaculty;
};

// =========================================================
// SEND COURSE ASSIGNMENT EMAIL TO FACULTY
// =========================================================
const sendCourseAssignmentEmail = async (course, faculty) => {
  try {
    if (!faculty?.email) {
      console.error(
        "Course assignment email skipped: Faculty email not found."
      );
      return false;
    }

    // Escape HTML values before adding them to the email.
    const escapeHtml = (value = "") =>
      String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const facultyName = escapeHtml(faculty.name || "Faculty");
    const courseTitle = escapeHtml(course.title || "New Course");
    const courseCategory = escapeHtml(course.category || "Not specified");
    const courseLevel = escapeHtml(course.level || "Not specified");
    const courseDuration = escapeHtml(course.duration || "Not specified");
    const courseType = escapeHtml(course.courseType || "Not specified");
    const courseStatus = escapeHtml(course.status || "draft");

    await sendEmail({
      to: faculty.email,
      subject: `New Course Assigned - ${course.title}`,

      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333;">
          <div style="background: #6d3df5; padding: 22px; text-align: center; color: white;">
            <h1 style="margin: 0;">LearnDesk</h1>
            <p style="margin-bottom: 0;">Online Learning Platform</p>
          </div>

          <div style="padding: 24px; background: #ffffff;">
            <h2>Hello ${facultyName},</h2>

            <p>
              An administrator has assigned a new course to you on LearnDesk.
            </p>

            <h3 style="color: #6d3df5;">Course Details</h3>

            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Course Title</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${courseTitle}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Category</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${courseCategory}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Level</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${courseLevel}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Duration</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${courseDuration}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Course Type</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${courseType}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Status</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${courseStatus}</td>
              </tr>
            </table>

            <p style="margin-top: 24px;">
              Please log in to your LearnDesk faculty account to manage your course
              and add lessons or other learning materials.
            </p>

            <p>Thank you,<br/><strong>LearnDesk Team</strong></p>
          </div>
        </div>
      `,

      textContent: `
Hello ${faculty.name || "Faculty"},

An administrator has assigned a new course to you on LearnDesk.

Course Details:
Course Title: ${course.title || "New Course"}
Category: ${course.category || "Not specified"}
Level: ${course.level || "Not specified"}
Duration: ${course.duration || "Not specified"}
Course Type: ${course.courseType || "Not specified"}
Status: ${course.status || "draft"}

Please log in to your LearnDesk faculty account to manage your course.

Thank you,
LearnDesk Team
      `
    });

    console.log(
      `Course assignment email sent to ${faculty.email}`
    );

    return true;
  } catch (error) {
    console.error(
      `Course assignment email failed for ${faculty?.email}:`,
      error.message
    );

    return false;
  }
};

// =========================================================
// ADD COURSE
// =========================================================
export const addCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      image,
      level,
      duration,
      faculty,
      facultyId,
      facultyEmail,
      category,
      courseType,
      price,
      students,
      status
    } = req.body;

    if (
      !title ||
      !level ||
      !duration ||
      !faculty ||
      !category ||
      !courseType
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields"
      });
    }

    const newCourse = new Course({
      title: title.trim(),
      description: description ? description.trim() : "",
      image: image || "",
      level,
      duration: duration.trim(),
      faculty: faculty.trim(),
      facultyId: facultyId || "",
      facultyEmail: facultyEmail
        ? String(facultyEmail).trim().toLowerCase()
        : "",
      category,
      courseType,
      price: Number(price || 0),
      students: Number(students || 0),
      status: status || "draft"
    });

    const savedCourse = await newCourse.save();

    // Send assignment email only when Admin creates the course.
    let assignmentEmailSent = false;

    if (isAdminCourseRequest(req) && savedCourse.facultyId) {
      try {
        const assignedFaculty = await findAssignedFaculty(
          savedCourse.facultyId,
          savedCourse.facultyEmail
        );

        if (assignedFaculty) {
          assignmentEmailSent = await sendCourseAssignmentEmail(
            savedCourse,
            assignedFaculty
          );
        } else {
          console.error(
            "Course saved, but assigned faculty was not found:",
            savedCourse.facultyId,
            savedCourse.facultyEmail
          );
        }
      } catch (emailError) {
        console.error(
          "Course assignment email error:",
          emailError.message
        );
      }
    }

    // Notify all students only when the new course is published.
    let notificationsCreated = 0;

    if (
      String(savedCourse.status || "").toLowerCase() === "published"
    ) {
      try {
        const studentList = await User.find({
          role: "student"
        }).select("_id");

        if (studentList.length > 0) {
          const notificationData = studentList.map((student) => ({
            studentId: student._id,
            title: "New Course Available",
            message: `A new course "${savedCourse.title}" is now available on LearnDesk.`,
            type: "course",
            isRead: false,
            link: "/browse"
          }));

          const createdNotifications =
            await Notification.insertMany(notificationData);

          notificationsCreated = createdNotifications.length;
        }
      } catch (notificationError) {
        console.error(
          "New course notification error:",
          notificationError.message
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: "Course added successfully",
      data: savedCourse,
      notificationsCreated,
      assignmentEmailSent
    });
  } catch (error) {
    console.error("Unable to add course:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =========================================================
// GET ALL COURSES
// =========================================================
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({
      createdAt: -1
    });

    return res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error("Unable to get courses:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =========================================================
// GET FACULTY DASHBOARD
// =========================================================
export const getFacultyDashboard = async (req, res) => {
  try {
    const facultyId = String(req.params.facultyId || "").trim();

    if (!facultyId) {
      return res.status(400).json({
        success: false,
        message: "Faculty ID is required"
      });
    }

    const courses = await Course.find({
      facultyId
    }).sort({
      createdAt: -1
    }).lean();

    if (!courses.length) {
      return res.status(200).json({
        success: true,
        data: {
          statistics: {
            totalCourses: 0,
            totalStudents: 0,
            publishedCourses: 0,
            draftCourses: 0,
            totalLessons: 0
          },
          courses: [],
          recentStudents: [],
          progress: []
        }
      });
    }

    const courseIds = courses.map((course) => String(course._id));

    const lessons = await Lesson.find({
      courseId: { $in: courseIds }
    }).sort({
      createdAt: -1
    }).lean();

    const enrollments = await Enrollment.find({
      courseId: { $in: courseIds }
    }).sort({
      createdAt: -1
    }).lean();

    const studentIds = [
      ...new Set(
        enrollments
          .map((enrollment) =>
            String(enrollment.studentId || "").trim()
          )
          .filter(Boolean)
      )
    ];

    const studentEmails = [
      ...new Set(
        enrollments
          .map((enrollment) =>
            String(enrollment.studentEmail || "")
              .trim()
              .toLowerCase()
          )
          .filter(Boolean)
      )
    ];

    const validStudentObjectIds = studentIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    let studentsById = [];
    let studentsByEmail = [];

    if (validStudentObjectIds.length) {
      studentsById = await User.find({
        _id: { $in: validStudentObjectIds },
        role: "student"
      }).select("_id name email role").lean();
    }

    if (studentEmails.length) {
      studentsByEmail = await User.find({
        email: { $in: studentEmails },
        role: "student"
      }).select("_id name email role").lean();
    }

    const studentMapById = new Map();
    const studentMapByEmail = new Map();

    studentsById.forEach((student) => {
      studentMapById.set(String(student._id), student);
    });

    studentsByEmail.forEach((student) => {
      studentMapByEmail.set(
        String(student.email).trim().toLowerCase(),
        student
      );
    });

    const courseData = courses.map((course) => {
      const currentCourseId = String(course._id);

      const courseLessons = lessons.filter(
        (lesson) => String(lesson.courseId) === currentCourseId
      );

      const courseEnrollments = enrollments.filter(
        (enrollment) =>
          String(enrollment.courseId) === currentCourseId
      );

      const uniqueStudents = new Set(
        courseEnrollments.map((enrollment) =>
          String(enrollment.studentId)
        )
      );

      return {
        _id: course._id,
        title: course.title,
        description: course.description || "",
        image: course.image || "",
        level: course.level,
        duration: course.duration,
        faculty: course.faculty,
        facultyId: course.facultyId || "",
        facultyEmail: course.facultyEmail || "",
        category: course.category,
        courseType: course.courseType,
        price: course.price,
        status: String(course.status || "draft").toLowerCase(),
        lessonCount: courseLessons.length,
        studentCount: uniqueStudents.size,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt
      };
    });

    const totalCourses = courses.length;

    const publishedCourses = courses.filter(
      (course) =>
        String(course.status || "").toLowerCase() === "published"
    ).length;

    const draftCourses = courses.filter(
      (course) =>
        String(course.status || "").toLowerCase() === "draft"
    ).length;

    const totalLessons = lessons.length;

    const uniqueStudentIds = new Set(
      enrollments.map((enrollment) =>
        String(enrollment.studentId)
      )
    );

    const totalStudents = uniqueStudentIds.size;

    const recentStudents = enrollments.map((enrollment) => {
  const relatedCourse = courses.find(
    (course) =>
      String(course._id) === String(enrollment.courseId)
  );

  const currentStudentId = String(
    enrollment.studentId || ""
  ).trim();

  const currentStudentEmail = String(
    enrollment.studentEmail || ""
  ).trim().toLowerCase();

  let student = studentMapById.get(currentStudentId);

  if (!student && currentStudentEmail) {
    student = studentMapByEmail.get(currentStudentEmail);
  }

  return {
    _id: enrollment._id,
    studentId: enrollment.studentId,
    studentName: student?.name || "Student",
    studentEmail:
      student?.email || enrollment.studentEmail || "",
    courseId: enrollment.courseId,
    courseName:
      enrollment.courseName || relatedCourse?.title || "Course",
    progress: Number(enrollment.progress || 0),
    createdAt: enrollment.createdAt
  };
});

    const progress = courses.map((course) => {
      const currentCourseId = String(course._id);

      const courseEnrollments = enrollments.filter(
        (enrollment) =>
          String(enrollment.courseId) === currentCourseId
      );

      let averageProgress = 0;

      if (courseEnrollments.length) {
        const totalProgress = courseEnrollments.reduce(
          (total, enrollment) =>
            total + Number(enrollment.progress || 0),
          0
        );

        averageProgress = Math.round(
          totalProgress / courseEnrollments.length
        );
      }

      return {
        courseId: course._id,
        courseName: course.title,
        progress: averageProgress,
        studentCount: new Set(
          courseEnrollments.map((enrollment) =>
            String(enrollment.studentId)
          )
        ).size
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        statistics: {
          totalCourses,
          totalStudents,
          publishedCourses,
          draftCourses,
          totalLessons
        },
        courses: courseData,
        recentStudents,
        progress
      }
    });
  } catch (error) {
    console.error("Unable to get faculty dashboard:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =========================================================
// UPDATE COURSE
// =========================================================
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      image,
      level,
      duration,
      faculty,
      facultyId,
      facultyEmail,
      category,
      courseType,
      price,
      students,
      status
    } = req.body;

    const existingCourse = await Course.findById(id);

    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Keep the previous assignment to detect a Faculty change.
    const previousFacultyId = String(
      existingCourse.facultyId || ""
    ).trim();

    const previousFacultyEmail = String(
      existingCourse.facultyEmail || ""
    ).trim().toLowerCase();

    existingCourse.title = title?.trim();
    existingCourse.description = description
      ? description.trim()
      : "";
    existingCourse.image = image || "";
    existingCourse.level = level;
    existingCourse.duration = duration?.trim();
    existingCourse.faculty = faculty?.trim();
    existingCourse.facultyId = facultyId || "";
    existingCourse.facultyEmail = facultyEmail
      ? String(facultyEmail).trim().toLowerCase()
      : "";
    existingCourse.category = category;
    existingCourse.courseType = courseType;
    existingCourse.price = Number(price || 0);
    existingCourse.students = Number(students || 0);
    existingCourse.status = status;

    const updatedCourse = await existingCourse.save();

    let assignmentEmailSent = false;

    // Send assignment email only for Admin updates where the
    // assigned Faculty ID or email has changed.
    const currentFacultyId = String(
      updatedCourse.facultyId || ""
    ).trim();

    const currentFacultyEmail = String(
      updatedCourse.facultyEmail || ""
    ).trim().toLowerCase();

    const facultyChanged =
      previousFacultyId !== currentFacultyId ||
      previousFacultyEmail !== currentFacultyEmail;

    if (isAdminCourseRequest(req) && facultyChanged) {
      try {
        const assignedFaculty = await findAssignedFaculty(
          updatedCourse.facultyId,
          updatedCourse.facultyEmail
        );

        if (assignedFaculty) {
          assignmentEmailSent = await sendCourseAssignmentEmail(
            updatedCourse,
            assignedFaculty
          );
        } else {
          console.error(
            "Course updated, but assigned faculty was not found:",
            updatedCourse.facultyId,
            updatedCourse.facultyEmail
          );
        }
      } catch (emailError) {
        console.error(
          "Course assignment email error:",
          emailError.message
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
      assignmentEmailSent
    });
  } catch (error) {
    console.error("Unable to update course:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =========================================================
// DELETE COURSE
// =========================================================
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCourse = await Course.findByIdAndDelete(id);

    if (!deletedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully"
    });
  } catch (error) {
    console.error("Unable to delete course:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
