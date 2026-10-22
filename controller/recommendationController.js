import getStudentRecommendations
    from "../model/recommendationService.js";

export const getRecommendations = async (req, res) => {
    try {
        const studentId = req.user?.id;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Student identity not found in token.",
            });
        }

        const recommendations =
            await getStudentRecommendations(studentId);

        return res.status(200).json({
            success: true,
            message: "Course recommendations fetched successfully.",
            data: recommendations,
        });

    } catch (error) {
        console.error(
            "Recommendation Controller Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to generate course recommendations.",
            error: error.message,
        });
    }
};