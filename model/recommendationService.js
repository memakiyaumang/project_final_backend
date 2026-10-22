import Course from "../model/Course.js";
import Enrollment from "../model/Enrollment.js";

const ML_RECOMMENDATION_URL =
    "https://project-final-ml.onrender.com/recommend";

const getStudentRecommendations = async (studentId) => {
    try {
        const studentIdString = String(studentId);

        // =====================================================
        // 1. GET ALL PUBLISHED COURSES
        // =====================================================

        const courses = await Course.find({
            status: "published",
        }).lean();

        if (!courses.length) {
            return [];
        }

        // =====================================================
        // 2. GET STUDENT ENROLLMENTS
        // =====================================================

        const enrollments = await Enrollment.find({
            studentId: studentIdString,
        }).lean();

        // =====================================================
        // 3. GET ENROLLED COURSE IDs
        // =====================================================

        const enrolledCourseIds = enrollments.map(
            (item) => String(item.courseId)
        );

        // =====================================================
        // 4. STUDENT MUST HAVE LEARNING HISTORY
        // =====================================================

        if (!enrolledCourseIds.length) {
            return [];
        }

        // =====================================================
        // 5. SEND DATA TO PYTHON ML SERVICE
        // =====================================================

        const response = await fetch(
            ML_RECOMMENDATION_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    courses,
                    enrolledCourseIds,
                }),
            }
        );

        // =====================================================
        // 6. CHECK ML SERVICE RESPONSE
        // =====================================================

        if (!response.ok) {
            const errorText = await response.text();

            console.error(
                "ML Recommendation Service Error:",
                errorText
            );

            throw new Error(
                "ML recommendation service returned an error."
            );
        }

        const result = await response.json();

        // =====================================================
        // 7. CHECK ML RESULT
        // =====================================================

        if (!result.success) {
            throw new Error(
                result.message ||
                "ML recommendation failed."
            );
        }

        // =====================================================
        // 8. RETURN ML RECOMMENDATIONS
        // =====================================================

        return result.data || [];

    } catch (error) {

        console.error(
            "Recommendation Service Error:",
            error
        );

        throw error;
    }
};

export default getStudentRecommendations;