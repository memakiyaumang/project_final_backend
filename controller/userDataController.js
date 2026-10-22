import User from "../model/User.js";
import Course from "../model/Course.js";
import Enrollment from "../model/Enrollment.js";
import Lesson from "../model/Lesson.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import genrateToken from "../utils/jwtutils.js";
import { sendEmail } from "../utils/emailService.js";

// =============================================
// BREVO - ACCOUNT APPROVAL EMAIL
// =============================================
const sendApprovalEmail = async (user) => {
  try {
    const roleName =
      user.role === "faculty" ? "Faculty" : "Student";

    const safeName = String(user.name || "User")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

    await sendEmail({
      to: user.email,
      subject: "Your LearnDesk Account Has Been Approved",
      htmlContent: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background:#f5f3ff; padding:24px;">
            <div style="max-width:600px; margin:auto; background:#ffffff; padding:30px; border-radius:12px;">
              <h1 style="color:#6d3df5;">LearnDesk</h1>
              <h2>Account Approved!</h2>

              <p>Hello ${safeName},</p>

              <p>
                Good news! Your LearnDesk ${roleName.toLowerCase()}
                account has been approved by the administrator.
              </p>

              <p>You can now log in to LearnDesk using your registered email and password.</p>

              <p style="margin-top:28px;">
                Regards,<br />
                <strong>LearnDesk Team</strong>
              </p>
            </div>
          </body>
        </html>
      `,
      textContent: `
Hello ${user.name || "User"},

Your LearnDesk ${roleName.toLowerCase()} account has been approved by the administrator.

You can now log in using your registered email and password.

Regards,
LearnDesk Team
      `,
    });

    return true;
  } catch (error) {
    console.error(
      `Approval email failed for ${user.email}:`,
      error.message
    );

    return false;
  }
};


// =============================================
// UPDATE STATUS AND SEND APPROVAL EMAIL IF NEEDED
// =============================================
const updateAccountStatus = async (user, newStatus) => {
  const previousStatus = String(
    user.status || "pending"
  ).toLowerCase();

  user.status = newStatus;
  await user.save();

  let emailSent = false;

  // Send email only for the first pending -> approved transition.
  if (
    previousStatus === "pending" &&
    newStatus === "approved"
  ) {
    emailSent = await sendApprovalEmail(user);
  }

  return {
    emailSent,
    previousStatus,
  };
};

// =============================================
// REGISTER STUDENT / FACULTY
// =============================================
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      qualification,
      specialization,
    } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = String(role || "")
      .trim()
      .toLowerCase();

    if (!["student", "faculty"].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Only student or faculty registration is allowed.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const saveUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole,
      qualification: qualification || "",
      specialization: specialization || "",
      status: "pending",

      notifications: {
        courseUpdates: true,
        newCourses: true,
        emailNotifications: false,
      },

      appearance: "light",
    });

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Your account is pending admin approval.",

      data: {
        id: saveUser._id,
        _id: saveUser._id,
        name: saveUser.name,
        email: saveUser.email,
        role: saveUser.role,
        qualification: saveUser.qualification,
        specialization: saveUser.specialization,
        status: saveUser.status,
        notifications: saveUser.notifications,
        appearance: saveUser.appearance,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
};

// =============================================
// LOGIN STUDENT / FACULTY
// =============================================
export const login = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const uData = await User.findOne({
      email,
    });

    if (!uData) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const comparePassword = await bcrypt.compare(
      password,
      uData.password
    );

    if (!comparePassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const status = String(uData.status || "pending")
      .toLowerCase();

    if (status === "pending") {
      return res.status(403).json({
        success: false,
        message: `Your ${uData.role} account is pending admin approval.`,
      });
    }

    if (status === "rejected") {
      return res.status(403).json({
        success: false,
        message: `Your ${uData.role} account has been rejected by the admin.`,
      });
    }

    if (status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Your account is not approved yet.",
      });
    }

    const token = genrateToken(uData);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,

      data: {
        id: uData._id,
        _id: uData._id,
        name: uData.name,
        email: uData.email,
        role: uData.role,
        qualification: uData.qualification || "",
        specialization: uData.specialization || "",
        phone: uData.phone || "",
        department: uData.department || "",
        experience: uData.experience || "",
        education: uData.education || "",
        bio: uData.bio || "",
        status: uData.status,

        notifications: uData.notifications || {
          courseUpdates: true,
          newCourses: true,
          emailNotifications: false,
        },

        appearance: uData.appearance || "light",
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};


// ===============================
// GET ALL USERS
// ===============================
export const getUser = async (req, res) => {
  try {

    // Password deliberately excluded
    const users = await User.find()
      .select("-password")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      data: users,
    });

  } catch (error) {
    console.error(
      "Get users error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ===============================
// GET USER BY ID
// ===============================
export const getUserById = async (
  req,
  res
) => {
  try {
    const userId = String(
      req.params.id || ""
    ).trim();

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await User.findById(
      userId
    ).select(
      "_id name email role qualification specialization phone department experience education bio status notifications appearance createdAt updatedAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userData = {
      ...user.toObject(),

      notifications:
        user.notifications || {
          courseUpdates: true,
          newCourses: true,
          emailNotifications: false,
        },

      appearance:
        user.appearance || "light",
    };

    res.status(200).json({
      success: true,
      data: userData,
    });

  } catch (error) {
    console.error(
      "Get user by ID error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ===============================
// GET FACULTY PROFILE
// ===============================
export const getFacultyProfile = async (
  req,
  res
) => {
  try {
    const facultyId = String(
      req.params.facultyId || ""
    ).trim();

    if (!facultyId) {
      return res.status(400).json({
        success: false,
        message: "Faculty ID is required",
      });
    }

    const faculty = await User.findOne({
      _id: facultyId,
      role: "faculty",
    }).select(
      "_id name email role qualification specialization phone department experience education bio status createdAt updatedAt"
    );

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    const courses = await Course.find({
      facultyId: facultyId,
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    const courseIds = courses.map(
      (course) => String(course._id)
    );

    let lessons = [];

    if (courseIds.length > 0) {
      lessons = await Lesson.find({
        courseId: {
          $in: courseIds,
        },
      }).lean();
    }

    let enrollments = [];

    if (courseIds.length > 0) {
      enrollments =
        await Enrollment.find({
          courseId: {
            $in: courseIds,
          },
        }).lean();
    }

    const uniqueStudents = new Set();

    enrollments.forEach(
      (enrollment) => {
        const studentId =
          String(
            enrollment.studentId || ""
          ).trim();

        const studentEmail =
          String(
            enrollment.studentEmail || ""
          )
            .trim()
            .toLowerCase();

        if (studentId) {
          uniqueStudents.add(
            `id:${studentId}`
          );
        } else if (studentEmail) {
          uniqueStudents.add(
            `email:${studentEmail}`
          );
        }
      }
    );

    const courseData = courses.map(
      (course) => {

        const courseId =
          String(course._id);

        const courseLessons =
          lessons.filter(
            (lesson) =>
              String(
                lesson.courseId
              ) === courseId
          );

        const courseEnrollments =
          enrollments.filter(
            (enrollment) =>
              String(
                enrollment.courseId
              ) === courseId
          );

        const courseStudents =
          new Set();

        courseEnrollments.forEach(
          (enrollment) => {

            const studentId =
              String(
                enrollment.studentId ||
                  ""
              ).trim();

            const studentEmail =
              String(
                enrollment.studentEmail ||
                  ""
              )
                .trim()
                .toLowerCase();

            if (studentId) {
              courseStudents.add(
                `id:${studentId}`
              );
            } else if (
              studentEmail
            ) {
              courseStudents.add(
                `email:${studentEmail}`
              );
            }
          }
        );

        return {
          _id: course._id,

          title: course.title,

          image:
            course.image || "",

          level:
            course.level,

          duration:
            course.duration,

          faculty:
            course.faculty,

          facultyId:
            course.facultyId || "",

          facultyEmail:
            course.facultyEmail || "",

          category:
            course.category,

          courseType:
            course.courseType,

          price:
            course.price,

          students:
            courseStudents.size,

          studentCount:
            courseStudents.size,

          lessonCount:
            courseLessons.length,

          status:
            String(
              course.status || "draft"
            ).toLowerCase(),

          createdAt:
            course.createdAt,

          updatedAt:
            course.updatedAt,
        };
      }
    );

    res.status(200).json({
      success: true,

      data: {
        profile: faculty,

        courses:
          courseData,

        statistics: {
          totalCourses:
            courses.length,

          totalStudents:
            uniqueStudents.size,

          totalLessons:
            lessons.length,
        },
      },
    });

  } catch (error) {
    console.error(
      "Get faculty profile error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// ADMIN - GET ALL FACULTY
// =====================================================
export const adminGetFaculty = async (
  req,
  res
) => {
  try {

    const faculty = await User.find({
      role: "faculty",
    })
      .select(
        "_id name email role qualification specialization phone department experience education bio status createdAt updatedAt"
      )
      .sort({
        createdAt: -1,
      });

    const facultyData = faculty.map(
      (item) => ({
        ...item.toObject(),

        id: item._id,

        fullName:
          item.name ||
          item.fullName ||
          item.username ||
          "Unknown Faculty",

        qualification:
          item.qualification ||
          "Not Provided",

        specialization:
          item.specialization ||
          "Not Provided",

        status:
          item.status || "pending",
      })
    );

    return res.status(200).json({
      success: true,
      message:
        "Faculty list fetched successfully.",
      data: facultyData,
    });

  } catch (error) {

    console.error(
      "Admin Get Faculty Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching faculty.",
    });
  }
};


// =====================================================
// ADMIN - ADD FACULTY
// =====================================================
export const adminAddFaculty = async (
  req,
  res
) => {
  try {

    const {
      name,
      email,
      password,
      qualification,
      specialization,
      status,
      phone,
      department,
      experience,
      education,
      bio,
    } = req.body;

    // ===============================
    // VALIDATION
    // ===============================

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Faculty name is required.",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Faculty email is required.",
      });
    }

    if (!password || !password.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Faculty password is required.",
      });
    }

    if (
      !qualification ||
      !qualification.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Qualification is required.",
      });
    }

    if (
      !specialization ||
      !specialization.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Specialization is required.",
      });
    }

    // ===============================
    // EMAIL NORMALIZATION
    // ===============================

    const trimmedEmail =
      email.trim().toLowerCase();

    // ===============================
    // CHECK EXISTING USER
    // ===============================

    const existingUser =
      await User.findOne({
        email: trimmedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "Email already registered.",
      });
    }

    // ===============================
    // PASSWORD HASH
    // ===============================

    const hashedPassword =
      await bcrypt.hash(
        password.trim(),
        10
      );

    // ===============================
    // VALID STATUS
    // ===============================

    const allowedStatuses = [
      "pending",
      "approved",
      "rejected",
    ];

    const finalStatus =
      allowedStatuses.includes(status)
        ? status
        : "pending";

    // ===============================
    // CREATE FACULTY
    // ===============================

    const faculty =
      await User.create({
        name: name.trim(),

        email: trimmedEmail,

        password: hashedPassword,

        role: "faculty",

        qualification:
          qualification.trim(),

        specialization:
          specialization.trim(),

        phone:
          phone || "",

        department:
          department || "",

        experience:
          experience || "",

        education:
          education || "",

        bio:
          bio || "",

        status:
          finalStatus,

        notifications: {
          courseUpdates: true,
          newCourses: true,
          emailNotifications: false,
        },

        appearance: "light",
      });

    // ===============================
    // SAFE RESPONSE
    // ===============================

    return res.status(201).json({
      success: true,
      message:
        "Faculty added successfully.",

      data: {
        id: faculty._id,
        _id: faculty._id,

        name:
          faculty.name,

        fullName:
          faculty.name,

        email:
          faculty.email,

        role:
          faculty.role,

        qualification:
          faculty.qualification,

        specialization:
          faculty.specialization,

        status:
          faculty.status,
      },
    });

  } catch (error) {

    console.error(
      "Admin Add Faculty Error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Email already registered.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while adding faculty.",
    });
  }
};


// =====================================================
// ADMIN - UPDATE FACULTY + APPROVAL EMAIL
// =====================================================
export const adminUpdateFaculty = async (req, res) => {
  try {
    const facultyId = String(req.params.id || "").trim();

    if (!mongoose.Types.ObjectId.isValid(facultyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid faculty ID.",
      });
    }

    const faculty = await User.findOne({
      _id: facultyId,
      role: "faculty",
    });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found.",
      });
    }

    const {
      name,
      email,
      qualification,
      specialization,
      password,
      phone,
      department,
      experience,
      education,
      bio,
      status,
    } = req.body;

    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Faculty name cannot be empty.",
      });
    }

    if (email !== undefined && !String(email).trim()) {
      return res.status(400).json({
        success: false,
        message: "Faculty email cannot be empty.",
      });
    }

    const allowedStatuses = ["pending", "approved", "rejected"];
    let normalizedStatus;

    if (status !== undefined) {
      normalizedStatus = String(status).trim().toLowerCase();

      if (!allowedStatuses.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid faculty status.",
        });
      }
    }

    const updateData = {};

    if (name !== undefined) {
      updateData.name = String(name).trim();
    }

    if (email !== undefined) {
      updateData.email = String(email).trim().toLowerCase();
    }

    if (qualification !== undefined) {
      updateData.qualification = String(qualification).trim();
    }

    if (specialization !== undefined) {
      updateData.specialization = String(specialization).trim();
    }

    if (phone !== undefined) {
      updateData.phone = String(phone).trim();
    }

    if (department !== undefined) {
      updateData.department = String(department).trim();
    }

    if (experience !== undefined) {
      updateData.experience = String(experience).trim();
    }

    if (education !== undefined) {
      updateData.education = String(education).trim();
    }

    if (bio !== undefined) {
      updateData.bio = String(bio).trim();
    }

    if (normalizedStatus !== undefined) {
      updateData.status = normalizedStatus;
    }

    if (password !== undefined && String(password).trim()) {
      updateData.password = await bcrypt.hash(
        String(password).trim(),
        10
      );
    }

    // Remember the status before updating.
    const previousStatus = String(
      faculty.status || "pending"
    ).toLowerCase();

    Object.assign(faculty, updateData);
    await faculty.save();

    // Send email only on pending -> approved.
    let emailSent = false;

    if (
      previousStatus === "pending" &&
      String(faculty.status).toLowerCase() === "approved"
    ) {
      emailSent = await sendApprovalEmail(faculty);
    }

    const updatedFaculty = await User.findById(faculty._id)
      .select(
        "_id name email role qualification specialization phone department experience education bio status createdAt updatedAt"
      );

    return res.status(200).json({
      success: true,
      message:
        previousStatus === "pending" &&
        String(faculty.status).toLowerCase() === "approved"
          ? emailSent
            ? "Faculty approved and email sent."
            : "Faculty approved, but email could not be sent."
          : "Faculty updated successfully.",
      emailSent,
      data: updatedFaculty,
    });
  } catch (error) {
    console.error("Admin Update Faculty Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating faculty.",
    });
  }
};


// =============================================
// ADMIN - UPDATE FACULTY STATUS
// =============================================
export const adminUpdateFacultyStatus = async (req, res) => {
  try {
    const facultyId = String(req.params.id || "").trim();

    const status = String(req.body.status || "")
      .trim()
      .toLowerCase();

    if (!mongoose.Types.ObjectId.isValid(facultyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid faculty ID.",
      });
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid faculty status.",
      });
    }

    const faculty = await User.findOne({
      _id: facultyId,
      role: "faculty",
    });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found.",
      });
    }

    const { emailSent } = await updateAccountStatus(
      faculty,
      status
    );

    const updatedFaculty = await User.findById(
      faculty._id
    ).select("-password");

    return res.status(200).json({
      success: true,
      message:
        status === "approved"
          ? emailSent
            ? "Faculty approved and confirmation email sent."
            : "Faculty approved, but the confirmation email could not be sent."
          : `Faculty status updated to ${status}.`,
      emailSent,
      data: updatedFaculty,
    });
  } catch (error) {
    console.error("Admin Update Faculty Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating faculty status.",
    });
  }
};


// =====================================================
// ADMIN - DELETE FACULTY
// =====================================================
export const adminDeleteFaculty = async (
  req,
  res
) => {
  try {

    const facultyId =
      String(
        req.params.id || ""
      ).trim();

    // ===============================
    // VALIDATE ID
    // ===============================

    if (
      !facultyId ||
      !mongoose.Types.ObjectId.isValid(
        facultyId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid faculty ID.",
      });
    }

    // ===============================
    // DELETE ONLY FACULTY
    // ===============================

    const deletedFaculty =
      await User.findOneAndDelete({
        _id: facultyId,
        role: "faculty",
      });

    if (!deletedFaculty) {
      return res.status(404).json({
        success: false,
        message:
          "Faculty not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Faculty deleted successfully.",

      data: {
        id:
          deletedFaculty._id,
      },
    });

  } catch (error) {

    console.error(
      "Admin Delete Faculty Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while deleting faculty.",
    });
  }
};


// =============================================
// UPDATE USER STATUS + APPROVAL EMAIL
// =============================================
export const updateUserStatus = async (req, res) => {
  try {
    const userId = String(req.params.id || "").trim();

    const status = String(req.body.status || "")
      .trim()
      .toLowerCase();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user status.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const { emailSent } = await updateAccountStatus(user, status);

    const updatedUser = await User.findById(userId)
      .select("-password");

    return res.status(200).json({
      success: true,
      message:
        status === "approved"
          ? emailSent
            ? "Account approved and email sent."
            : "Account approved. No new email was sent or email delivery failed."
          : `User status updated to ${status}.`,
      emailSent,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update user status.",
    });
  }
};

// ===============================
// UPDATE USER / FACULTY PROFILE
// ===============================
export const updateUser = async (
  req,
  res
) => {
  try {
    const userId = req.params.id;

    const updateData = {
      name: req.body.name,
      email: req.body.email,

      qualification:
        req.body.qualification || "",

      specialization:
        req.body.specialization || "",

      phone:
        req.body.phone || "",

      department:
        req.body.department || "",

      experience:
        req.body.experience || "",

      education:
        req.body.education || "",

      bio:
        req.body.bio || "",
    };

    if (
      req.body.notifications &&
      typeof req.body.notifications === "object"
    ) {
      updateData.notifications = {
        courseUpdates:
          req.body.notifications
            .courseUpdates ??
          true,

        newCourses:
          req.body.notifications
            .newCourses ??
          true,

        emailNotifications:
          req.body.notifications
            .emailNotifications ??
          false,
      };
    }

    if (
      req.body.appearance === "light" ||
      req.body.appearance === "dark"
    ) {
      updateData.appearance =
        req.body.appearance;
    }

    const updatedUser =
      await User.findByIdAndUpdate(
        userId,
        updateData,
        {
          returnDocument: "after",
          runValidators: true,
        }
      ).select(
        "_id name email role qualification specialization phone department experience education bio status notifications appearance createdAt updatedAt"
      );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "User profile updated successfully",

      data: updatedUser,
    });

  } catch (error) {
    console.error(
      "Update user error:",
      error
    );

    if (
      error.code === 11000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email already registered",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ===============================
// DELETE USER
// Existing Student/Faculty API
// ===============================
export const deleteUser = async (
  req,
  res
) => {
  try {
    const userId = req.params.id;

    const deletedUser =
      await User.findByIdAndDelete(
        userId
      );

    if (!deletedUser) {
      return res.status(500).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "User deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete user error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// =====================================================
// ADMIN - GET ALL STUDENTS
// =====================================================

export const adminGetStudents = async (req, res) => {
    try {

        const students = await User.find({
            role: "student"
        })
            .select("-password")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Students fetched successfully.",
            data: students
        });

    } catch (error) {

        console.error(
            "Admin Get Students Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to fetch students.",
            error: error.message
        });
    }
};


// =====================================================
// ADMIN - UPDATE STUDENT + APPROVAL EMAIL
// =====================================================
export const adminUpdateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID.",
      });
    }

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Student name is required.",
      });
    }

    if (!email || !String(email).trim()) {
      return res.status(400).json({
        success: false,
        message: "Student email is required.",
      });
    }

    const allowedStatuses = ["pending", "approved", "rejected"];
    const normalizedStatus =
      status === undefined
        ? undefined
        : String(status).trim().toLowerCase();

    if (
      normalizedStatus !== undefined &&
      !allowedStatuses.includes(normalizedStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid student status.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existingStudent = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: id },
    });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    const student = await User.findOne({
      _id: id,
      role: "student",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const previousStatus = String(
      student.status || "pending"
    ).toLowerCase();

    student.name = String(name).trim();
    student.email = normalizedEmail;

    if (normalizedStatus !== undefined) {
      student.status = normalizedStatus;
    }

    await student.save();

    let emailSent = false;

    if (
      previousStatus === "pending" &&
      String(student.status).toLowerCase() === "approved"
    ) {
      emailSent = await sendApprovalEmail(student);
    }

    const updatedStudent = await User.findById(student._id)
      .select("-password");

    return res.status(200).json({
      success: true,
      message:
        previousStatus === "pending" &&
        String(student.status).toLowerCase() === "approved"
          ? emailSent
            ? "Student approved and email sent."
            : "Student approved, but email could not be sent."
          : "Student updated successfully.",
      emailSent,
      data: updatedStudent,
    });
  } catch (error) {
    console.error("Admin Update Student Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update student.",
    });
  }
};


// =============================================
// ADMIN - UPDATE STUDENT STATUS
// =============================================
export const adminUpdateStudentStatus = async (req, res) => {
  try {
    const studentId = String(req.params.id || "").trim();

    const status = String(req.body.status || "")
      .trim()
      .toLowerCase();

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID.",
      });
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student status.",
      });
    }

    const student = await User.findOne({
      _id: studentId,
      role: "student",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const { emailSent } = await updateAccountStatus(
      student,
      status
    );

    const updatedStudent = await User.findById(
      student._id
    ).select("-password");

    return res.status(200).json({
      success: true,
      message:
        status === "approved"
          ? emailSent
            ? "Student approved and confirmation email sent."
            : "Student approved, but the confirmation email could not be sent."
          : `Student status updated to ${status}.`,
      emailSent,
      data: updatedStudent,
    });
  } catch (error) {
    console.error("Admin Update Student Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update student status.",
    });
  }
};

// =====================================================
// ADMIN - DELETE STUDENT
// =====================================================

export const adminDeleteStudent = async (
    req,
    res
) => {
    try {

        const { id } = req.params;


        // ---------------------------------------------
        // VALIDATE ID
        // ---------------------------------------------

        if (!mongoose.Types.ObjectId.isValid(id)) {

            return res.status(400).json({
                success: false,
                message: "Invalid student ID."
            });
        }


        // ---------------------------------------------
        // DELETE ONLY STUDENT
        // ---------------------------------------------

        const deletedStudent =
            await User.findOneAndDelete({
                _id: id,
                role: "student"
            });


        if (!deletedStudent) {

            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }


        return res.status(200).json({
            success: true,
            message: "Student deleted successfully.",
            data: {
                id: deletedStudent._id
            }
        });

    } catch (error) {

        console.error(
            "Admin Delete Student Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to delete student.",
            error: error.message
        });
    }
};