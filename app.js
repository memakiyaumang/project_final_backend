
import express from "express";
import cors from "cors";
import "dotenv/config";

import connectDB from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import lessonRoutes from "./routes/lessonRoutes.js";
import studentProgressRoutes from "./routes/studentProgressRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";

import adminRoutes from "./routes/adminRoutes.js";
import adminSettingsRoutes from "./routes/adminSettingsRoutes.js";
import adminPaymentRoutes from "./routes/adminPaymentRoutes.js";

import recommendationRoutes from "./routes/recommendationRoutes.js";
import performanceRoutes from "./routes/performanceRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

connectDB();

app.get("/", (req, res) => {
    res.send("LearnDesk API is running");
});

app.use("/", userRoutes);
app.use("/", courseRoutes);
app.use("/", lessonRoutes);
app.use("/", studentProgressRoutes);
app.use("/", enrollmentRoutes);
app.use("/", quizRoutes);

app.use("/", adminRoutes);
app.use("/", adminSettingsRoutes);
app.use("/", adminPaymentRoutes);

app.use("/", recommendationRoutes);
app.use("/", performanceRoutes);
app.use("/", paymentRoutes);
app.use("/", chatbotRoutes);
app.use("/", notificationRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});