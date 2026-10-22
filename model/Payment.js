import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      index: true,
    },

    studentEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    courseId: {
      type: String,
      required: true,
      index: true,
    },

    courseName: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      // Amount in paise: ₹499 = 49900 paise
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      default: "INR",
      required: true,
    },

    razorpayOrderId: {
  type: String,
  default: undefined,
  unique: true,
  sparse: true,
},

    razorpayPaymentId: {
      type: String,
      default: "",
      index: true,
    },

    razorpaySignature: {
      type: String,
      default: "",
    },

   paymentMethod: {
  type: String,
  enum: ["razorpay", "demo"],
  default: "razorpay",
},

status: {
  type: String,
  enum: ["created", "paid", "failed", "demo"],
  default: "created",
},
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;