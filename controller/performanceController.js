import getStudentPerformancePrediction
    from "../model/performanceService.js";


export const getPerformancePrediction =
    async (req, res) => {

        try {

            const {
                studentId,
                courseId
            } = req.params;


            if (!studentId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Student ID is required."

                });

            }


            if (!courseId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Course ID is required."

                });

            }


            const prediction =
                await getStudentPerformancePrediction(

                    studentId,

                    courseId

                );


            return res.status(200).json({

                success: true,

                message:
                    "Student performance predicted successfully.",

                data:
                    prediction

            });


        } catch (error) {

            console.error(

                "Performance Controller Error:",

                error

            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to predict student performance.",

                error:
                    error.message

            });

        }

    };