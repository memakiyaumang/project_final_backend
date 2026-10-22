import crypto from "node:crypto";
import Razorpay from "razorpay";

import Course from "../model/Course.js";
import Enrollment from "../model/Enrollment.js";
import Payment from "../model/Payment.js";
import Lesson from "../model/Lesson.js";
import Notification from "../model/Notification.js";

import { sendEmail } from "../utils/emailService.js";

// ============================================
// INITIALIZE RAZORPAY CLIENT
// ============================================
const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay environment variables are missing.");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

// ============================================
// GET AUTHENTICATED STUDENT ID
// ============================================
const getAuthenticatedStudentId = (req) => {
  const user = req.user || {};

  return (
    user.id ||
    user.userId ||
    user._id ||
    user.studentId ||
    null
  );
};

// ============================================
// GET AUTHENTICATED STUDENT EMAIL
// ============================================
const getAuthenticatedEmail = (req) => {
  const user = req.user || {};

  return String(user.email || user.emailAddress || "")
    .trim()
    .toLowerCase();
};

// ============================================
// ESCAPE HTML
// ============================================
const escapeHtml = (value) => {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
};

// ============================================
// SEND PAID COURSE ENROLLMENT EMAIL
// ============================================
const sendPaidEnrollmentEmail = async ({
  to,
  courseName,
  amount,
  paymentId,
}) => {
  if (!to) {
    console.warn(
      "Enrollment email skipped: student email is missing."
    );
    return false;
  }

  const safeCourseName = escapeHtml(courseName);
  const safePaymentId = escapeHtml(paymentId);

  const amountInRupees = (
    Number(amount) / 100
  ).toLocaleString("en-IN");

  const result = await sendEmail({
    to,
    subject: `Enrollment Confirmed - ${courseName}`,
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#333;">
        <h2 style="color:#6d3df5;">Welcome to LearnDesk!</h2>

        <h3>Payment Successful</h3>

        <p>
          Your payment has been verified successfully
          and your course enrollment is complete.
        </p>

        <div style="background:#f5f2ff;padding:18px;border-radius:8px;">
          <h3 style="margin-top:0;">Course Details</h3>

          <p>
            <strong>Course:</strong>
            ${safeCourseName}
          </p>

          <p>
            <strong>Amount:</strong>
            ₹${amountInRupees}
          </p>

          <p>
            <strong>Payment ID:</strong>
            ${safePaymentId}
          </p>

          <p>
            <strong>Status:</strong>
            Enrolled
          </p>
        </div>

        <p>
          You can now continue your learning on LearnDesk.
        </p>

        <p>
          Happy Learning!<br/>
          <strong>Team LearnDesk</strong>
        </p>
      </div>
    `,
    textContent:
      `Hello, your payment for ${courseName} was successful. ` +
      `Amount: INR ${amountInRupees}. ` +
      `Payment ID: ${paymentId}. ` +
      "Your course enrollment is complete. Thank you for choosing LearnDesk!",
  });

  return result?.success === true;
};

// ============================================
// CREATE ENROLLMENT IF NEEDED
// ============================================
const createEnrollmentIfNeeded = async ({
  studentId,
  studentEmail,
  course,
}) => {
  const courseId = String(course._id);

  let enrollment = await Enrollment.findOne({
    studentId: String(studentId),
    courseId,
  });

  if (enrollment) {
    return {
      enrollment,
      created: false,
    };
  }

  const totalLessons = await Lesson.countDocuments({
    courseId,
  });

  try {
    enrollment = await Enrollment.create({
      studentId: String(studentId),
      studentEmail,
      courseId,
      courseName: course.title,
      progress: 0,
      completedLessons: 0,
      totalLessons,
      completed: false,
    });

    return {
      enrollment,
      created: true,
    };
  } catch (error) {
    // Handle duplicate enrollment created concurrently.
    if (error.code === 11000) {
      enrollment = await Enrollment.findOne({
        studentId: String(studentId),
        courseId,
      });

      if (enrollment) {
        return {
          enrollment,
          created: false,
        };
      }
    }

    throw error;
  }
};

// ============================================
// 1. CREATE RAZORPAY PAYMENT ORDER
// ============================================
export const createPaymentOrder = async (req, res) => {
  try {
    const studentId = getAuthenticatedStudentId(req);
    const studentEmail = getAuthenticatedEmail(req);
    const { courseId } = req.body;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Student authentication is required.",
      });
    }

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required.",
      });
    }

    let course;

    try {
      course = await Course.findById(String(courseId));
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID.",
      });
    }

    if (!course || course.status !== "published") {
      return res.status(404).json({
        success: false,
        message: "Published course not found.",
      });
    }

    if (course.courseType !== "paid") {
      return res.status(400).json({
        success: false,
        message: "This course does not require payment.",
      });
    }

    const price = Number(course.price);

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course price.",
      });
    }

    // Check whether the student is already enrolled.
    const existingEnrollment = await Enrollment.findOne({
      studentId: String(studentId),
      courseId: String(course._id),
    });

    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: "You are already enrolled in this course.",
      });
    }

    const amount = Math.round(price * 100);

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount.",
      });
    }

    const razorpay = getRazorpayClient();

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `rcpt_${crypto
        .randomUUID()
        .replace(/-/g, "")
        .slice(0, 30)}`,
      notes: {
        studentId: String(studentId),
        courseId: String(course._id),
        courseName: String(course.title).slice(0, 200),
      },
    });

    // Save payment as pending.
    await Payment.create({
      studentId: String(studentId),
      studentEmail,
      courseId: String(course._id),
      courseName: course.title,
      amount,
      currency: "INR",
      razorpayOrderId: order.id,
      razorpayPaymentId: "",
      razorpaySignature: "",
      paymentMethod: "razorpay",
      status: "created",
    });

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully.",
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        courseName: course.title,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Create Payment Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment order.",
    });
  }
};

// ============================================
// 2. VERIFY RAZORPAY PAYMENT
// ============================================
export const verifyPayment = async (req, res) => {
  try {
    const studentId = getAuthenticatedStudentId(req);
    const studentEmail = getAuthenticatedEmail(req);

    const {
      orderId,
      paymentId,
      signature,
    } = req.body;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Student authentication is required.",
      });
    }

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        message: "Order ID, payment ID and signature are required.",
      });
    }

    // Find the payment order belonging to this student.
    const paymentRecord = await Payment.findOne({
      razorpayOrderId: orderId,
      studentId: String(studentId),
      paymentMethod: "razorpay",
    });

    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: "Payment order not found.",
      });
    }

    const course = await Course.findById(
      paymentRecord.courseId
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    // ============================================
    // VERIFY RAZORPAY SIGNATURE
    // ============================================
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return res.status(500).json({
        success: false,
        message: "Payment verification is not configured.",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(
      expectedSignature,
      "hex"
    );

    const receivedBuffer = Buffer.from(
      String(signature),
      "hex"
    );

    const validSignature =
      /^[a-fA-F0-9]{64}$/.test(String(signature)) &&
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      );

    if (!validSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature.",
      });
    }

    // ============================================
    // VERIFY PAYMENT DIRECTLY WITH RAZORPAY
    // ============================================
    const razorpay = getRazorpayClient();

    const razorpayPayment =
      await razorpay.payments.fetch(paymentId);

    if (
      String(razorpayPayment.order_id) !== String(orderId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment does not match the order.",
      });
    }

    if (
      Number(razorpayPayment.amount) !==
        Number(paymentRecord.amount) ||
      String(razorpayPayment.currency) !==
        String(paymentRecord.currency)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment amount or currency does not match.",
      });
    }

    if (
      !["authorized", "captured"].includes(
        razorpayPayment.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Razorpay has not authorized this payment.",
      });
    }

    // ============================================
    // MARK PAYMENT AS SUCCESSFUL
    // ============================================
    paymentRecord.status = "paid";
    paymentRecord.razorpayPaymentId = paymentId;
    paymentRecord.razorpaySignature = signature;

    await paymentRecord.save();

    // ============================================
    // DELETE OLD PENDING / FAILED PAYMENTS
    // ============================================
    await Payment.deleteMany({
      studentId: String(studentId),
      courseId: String(paymentRecord.courseId),
      _id: { $ne: paymentRecord._id },
      status: {
        $in: ["created", "failed"],
      },
    });

    // ============================================
    // CREATE OR RECOVER ENROLLMENT
    // ============================================
    const enrollmentResult = await createEnrollmentIfNeeded({
      studentId,
      studentEmail:
        studentEmail || paymentRecord.studentEmail,
      course,
    });

    const enrollment = enrollmentResult.enrollment;

    // ============================================
    // CREATE NOTIFICATION FOR NEW ENROLLMENT
    // ============================================
    let notificationCreated = false;

    if (enrollmentResult.created) {
      try {
        await Notification.create({
          studentId: studentId,
          title: "Enrollment Successful",
          message:
            `Your payment was successful and you are now enrolled in "${course.title}".`,
          type: "enrollment",
          isRead: false,
          link: "/courses",
        });

        notificationCreated = true;
      } catch (notificationError) {
        console.error(
          "Paid enrollment notification error:",
          notificationError.message
        );
      }
    }

    // ============================================
    // SEND EMAIL ONLY FOR A NEW ENROLLMENT
    // ============================================
    let emailSent = false;

    if (enrollmentResult.created) {
      try {
        emailSent = await sendPaidEnrollmentEmail({
          to:
            studentEmail ||
            paymentRecord.studentEmail ||
            enrollment.studentEmail,
          courseName: course.title,
          amount: paymentRecord.amount,
          paymentId,
        });

        if (emailSent) {
          console.log(
            "Paid course enrollment email accepted by Brevo."
          );
        } else {
          console.warn(
            "Paid course enrollment email was not accepted."
          );
        }
      } catch (emailError) {
        console.error(
          "Paid Enrollment Email Error:",
          emailError.message
        );
      }
    } else {
      console.log(
        "Enrollment already exists; duplicate confirmation email skipped."
      );
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      emailSent,
      notificationCreated,
      data: {
        payment: paymentRecord,
        enrollment,
      },
    });
  } catch (error) {
    console.error("Verify Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment. Please try again.",
    });
  }
};