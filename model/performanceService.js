import Enrollment from "../model/Enrollment.js";
import QuizAttempt from "../model/QuizAttempt.js";

const ML_PERFORMANCE_URL =
    "https://project-final-ml.onrender.com/predict-performance";


const getStudentPerformancePrediction = async (
    studentId,
    courseId
) => {

    try {

        const studentIdString =
            String(studentId);

        const courseIdString =
            String(courseId);


        console.log(
            "=========================================="
        );

        console.log(
            "Performance Prediction Request"
        );

        console.log(
            "Student ID:",
            studentIdString
        );

        console.log(
            "Course ID:",
            courseIdString
        );


        /* =====================================================
           1. FIND ENROLLMENT
        ===================================================== */

        const enrollment =
            await Enrollment.findOne({
                studentId:
                    studentIdString,
                courseId:
                    courseIdString
            }).lean();


        console.log(
            "Exact Enrollment Search Result:",
            enrollment
        );


        /* =====================================================
           2. IF NOT FOUND
        ===================================================== */

        if (!enrollment) {

            /*
             * Debug:
             * Find all enrollments of this student.
             */

            const studentEnrollments =
                await Enrollment.find({
                    studentId:
                        studentIdString
                }).lean();


            console.log(
                "All Enrollments For Student:",
                studentEnrollments
            );


            /*
             * Debug:
             * Find all enrollments of this course.
             */

            const courseEnrollments =
                await Enrollment.find({
                    courseId:
                        courseIdString
                }).lean();


            console.log(
                "All Enrollments For Course:",
                courseEnrollments
            );


            throw new Error(
                `Student enrollment not found for studentId=${studentIdString}, courseId=${courseIdString}`
            );
        }


        /* =====================================================
           3. COURSE PROGRESS
        ===================================================== */

        const courseProgress =
            Number(
                enrollment.progress || 0
            );


        const completedLessons =
            Number(
                enrollment.completedLessons ||
                0
            );


        const totalLessons =
            Number(
                enrollment.totalLessons ||
                0
            );


        /* =====================================================
           4. QUIZ ATTEMPTS
        ===================================================== */

        const quizAttempts =
            await QuizAttempt.find({
                studentId:
                    studentIdString,

                courseId:
                    courseIdString

            }).lean();


        console.log(
            "Quiz Attempts:",
            quizAttempts
        );


        const quizAttemptCount =
            quizAttempts.length;


        let quizAverage = 0;

        let passedQuizzes = 0;


        /* =====================================================
           5. QUIZ CALCULATION
        ===================================================== */

        if (
            quizAttemptCount > 0
        ) {

            const totalPercentage =
                quizAttempts.reduce(
                    (
                        total,
                        attempt
                    ) => {

                        return (
                            total +
                            Number(
                                attempt.percentage ||
                                0
                            )
                        );

                    },
                    0
                );


            quizAverage =
                totalPercentage /
                quizAttemptCount;


            passedQuizzes =
                quizAttempts.filter(
                    (attempt) =>
                        attempt.result ===
                        "passed"
                ).length;
        }


        /* =====================================================
           6. PERFORMANCE DATA
        ===================================================== */

        const performanceData = {

            courseProgress,

            completedLessons,

            totalLessons,

            quizAverage,

            quizAttempts:
                quizAttemptCount,

            passedQuizzes

        };


        console.log(
            "Performance ML Input:",
            performanceData
        );


       
        /* =====================================================
           7. CALL PYTHON ML SERVICE
        ===================================================== */

        const response = await fetch(ML_PERFORMANCE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(performanceData),
            signal: AbortSignal.timeout(60000)
        });

        const contentType =
            response.headers.get("content-type") || "";

        const responseText = await response.text();

        console.log("========== ML SERVICE RESPONSE ==========");
        console.log("ML URL:", ML_PERFORMANCE_URL);
        console.log("HTTP Status:", response.status);
        console.log("Content-Type:", contentType);
        console.log("Response Body:", responseText.slice(0, 3000));
        console.log("==========================================");

        if (!response.ok) {
            throw new Error(
                `ML service returned HTTP ${response.status}: ${responseText.slice(0, 500)}`
            );
        }

        let result;

        try {
            result = JSON.parse(responseText);
        } catch {
            throw new Error(
                `ML service returned invalid JSON. Content-Type: ${contentType}. Body: ${responseText.slice(0, 500)}`
            );
        }

        /* =====================================================
           8. ML RESPONSE
        ===================================================== */

        console.log("ML Performance Result:", result);

        if (!result.success) {
            throw new Error(
                result.message ||
                result.error ||
                "Performance prediction failed."
            );
        }


        /* =====================================================
           9. RETURN RESULT
        ===================================================== */

        return {

            studentId:
                studentIdString,

            courseId:
                courseIdString,

            input:
                performanceData,

            prediction:
                result.prediction,

            probabilities:
                result.probabilities ||
                {},

            model:
                result.model

        };


    } catch (error) {

        console.error(
            "Performance Service Error:",
            error
        );

        throw error;
    }
};


export default
    getStudentPerformancePrediction;