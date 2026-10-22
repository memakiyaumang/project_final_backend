import StudentProgress from "../model/StudentProgress.js";


// Save / Update Student Progress
export const updateProgress = async (req, res) => {
  try {
    const {
      studentId,
      studentEmail,
      courseId,
      lessonId,
      completed
    } = req.body;

    const progress = await StudentProgress.findOneAndUpdate(
      {
        studentId: String(studentId),
        courseId: String(courseId),
        lessonId: String(lessonId)
      },
      {
        studentId: String(studentId),
        studentEmail: studentEmail,
        courseId: String(courseId),
        lessonId: String(lessonId),
        completed: completed === true
      },
      {
        upsert: true,
        returnDocument: "after"
      }
    );

    res.status(200).json({
      success: true,
      message: "Progress updated successfully",
      data: progress
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// Get Progress of a Student for a Course
export const getStudentProgress = async (req, res) => {
  try {
    const {
      studentId,
      courseId
    } = req.params;

    const progress = await StudentProgress.find({
      studentId: String(studentId),
      courseId: String(courseId)
    }).sort({
      createdAt: 1
    });

    res.status(200).json({
      success: true,
      data: progress
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// Delete Student Progress
export const deleteProgress = async (req, res) => {
  try {
    const {
      studentId,
      courseId
    } = req.params;

    const deletedProgress =
      await StudentProgress.deleteMany({
        studentId: String(studentId),
        courseId: String(courseId)
      });

    res.status(200).json({
      success: true,
      message: "Student progress deleted successfully",
      data: deletedProgress
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};