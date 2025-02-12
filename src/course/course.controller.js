import User from "../user/user.model.js"
import Course from "./course.model.js";

export const saveCourse = async (req, res) => {
    try {
        const data = req.body
        const teacher = await User.findOne({ email: data.teacher });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                msg: "Teacher not found",
            });
        }

        const course = new Course({
            ...data,
            teacher: teacher._id
        })

        await course.save();

        res.status(200).json({
            success: true,
            course
        })


    } catch (error) {
        res.status(500).json({
            success: false,
            msg: "Error saving Course",
            error,
        });
    }
}