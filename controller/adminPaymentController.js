import Payment from "../model/Payment.js";

// ============================================
// GET ALL PAYMENTS — ADMIN ONLY
// ============================================
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .sort({ createdAt: -1 })
      .lean();

    const formattedPayments = payments.map((payment) => {
      const status = String(
        payment.status || "created"
      ).toLowerCase();

      let displayStatus = "pending";

      if (status === "paid") {
        displayStatus = "successful";
      } else if (status === "failed") {
        displayStatus = "failed";
      }

      return {
        id: String(payment._id),
        studentId: payment.studentId,
        studentEmail: payment.studentEmail || "",
        studentName: payment.studentName || "",
        courseId: payment.courseId,
        courseName: payment.courseName,
        amount: Number(payment.amount || 0) / 100,
        currency: payment.currency || "INR",
        paymentMethod: payment.paymentMethod || "razorpay",
        razorpayOrderId: payment.razorpayOrderId || "",
        razorpayPaymentId: payment.razorpayPaymentId || "",
        status: displayStatus,
        date: payment.createdAt || null,
        updatedAt: payment.updatedAt || null,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedPayments.length,
      data: formattedPayments,
    });
  } catch (error) {
    console.error("Get All Payments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch payment records.",
    });
  }
};