import Course from "./course.model.js";
import User from "../user/user.model.js";
import { response, request } from "express";

export const saveCourse = async (req, res) => {
  try {
    const data = req.body;
    const teacher = await User.findOne({ email: data.teacher });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        msg: "Teacher not found",
      });
    }
    if (teacher.role != "TEACHER_ROLE") {
      return res.status(401).json({
        success: false,
        msg: "A student cannot be a teacher",
      });
    }
    const course = new Course({
      ...data,
      teacher: teacher.id,
    });

    await course.save();
    teacher.courses.push(course.id);
    await teacher.save();

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Error saving Course",
      error,
    });
  }
};

export const getCourses = async (req = request, res = response) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const user = req.user;
    console.log(user);
    let query = {};

    if (user.role == "TEACHER_ROLE") {
      console.log("teacher");
      query = { teacher: user.id, state: true };
    } else {
      console.log("student");
      query = { students: user.id, state: true };
    }

    const [total, courses] = await Promise.all([
      Course.countDocuments(query),
      Course.find(query)
        .skip(Number(offset))
        .limit(Number(limit))
        .populate("teacher", "name surname email")
        .populate("students", "name surname email"),
    ]);

    if (total === 0) {
      return res.status(200).json({
        success: true,
        total,
        courses: [],
        msg:
          user.role === "TEACHER_ROLE"
            ? "You do not have courses created yet."
            : "You are not enrolled in any course.",
      });
    }

    const coursesWithNames = courses.map((course) => ({
      ...course.toObject(),
      teacher: course.teacher ? course.teacher : "Teacher not found",
      students:
        course.students.length > 0 ? course.students : "No students enrolled",
    }));

    res.status(200).json({
      success: true,
      total,
      courses: coursesWithNames,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Error getting courses",
      error,
    });
  }
};

export const getAllCourses = async (req = request, res = response) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const [total, courses] = await Promise.all([
      Course.countDocuments({ state: true }),
      Course.find({ state: true })
        .skip(Number(offset))
        .limit(Number(limit))
        .populate("teacher", "name surname email")
        .populate("students", "name surname email"),
    ]);

    const coursesWithNames = courses.map((course) => ({
      ...course.toObject(),
      teacher: course.teacher ? course.teacher : "Teacher not found",
      students:
        course.students.length > 0 ? course.students : "No students enrolled",
    }));

    res.status(200).json({
      success: true,
      total,
      courses: coursesWithNames,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Error getting courses",
      error,
    });
  }
};

export const updateCourse = async (req, res = response) => {
  try {
    const { id } = req.params;
    const { ...data } = req.body;
    const newTeacher = await User.findOne({ email: data.teacher });

    if (!newTeacher) {
      return res.status(404).json({
        success: false,
        msg: "Teacher not found",
      });
    }

    if (newTeacher.role !== "TEACHER_ROLE") {
      return res.status(401).json({
        success: false,
        msg: "A student cannot be a teacher",
      });
    }

    data.teacher = newTeacher.id;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized | You can only update the courses you teach",
      });
    }

    const oldTeacher = await User.findById(course.teacher);

    const updatedCourse = await Course.findByIdAndUpdate(id, data, {
      new: true,
    })
      .populate("teacher", "name surname email")
      .populate("students", "name surname email");

    if (oldTeacher) {
      await User.findByIdAndUpdate(oldTeacher.id, {
        $pull: { courses: course.id },
      });
    }

    if (!newTeacher.courses.includes(course.id)) {
      await User.findByIdAndUpdate(newTeacher.id, {
        $push: { courses: course.id },
      });
    }

    res.status(200).json({
      success: true,
      msg: "Course updated successfully",
      updatedCourse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Error updating the course",
      error: error.message,
    });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    const authenticatedUser = req.user;

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.teacher.toString() !== authenticatedUser.id) {
      return res.status(403).json({
        message: "Unauthorized | You can only delete the courses you teach",
      });
    }

    const deletedCourse = await Course.findByIdAndUpdate(
      course.id,
      { state: false },
      { new: true }
    );

    await User.updateMany(
      { _id: { $in: course.students } },
      { $pull: { courses: course.id } }
    );

    res.status(200).json({
      success: true,
      msg: "Course deactivated successfully",
      deletedCourse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Error deactivating the course",
      error: error.message,
    });
  }
};

export const assignToCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const student = req.user;

    if (student.role != "STUDENT_ROLE") {
      return res.status(401).json({
        success: false,
        msg: "A teacher cannot be assigned to a course",
      });
    }
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Curso not found" });
    }

    if (student.courses.length >= 3) {
      return res
        .status(400)
        .json({ message: "You cannot be assigned to more than 3 courses." });
    }

    if (course.students.includes(student.id)) {
      return res
        .status(400)
        .json({ message: "You are already assigned to this course" });
    }

    course.students.push(student.id);
    await course.save();
    student.courses.push(course.id);
    await student.save();

    const coursesWithNames = await Promise.all(
      student.courses.map(async (c) => {
        const course = await Course.findById(c);
        return course ? course.name : "Course not found";
      })
    );

    res.status(200).json({
      success: true,
      msg: "Successfully assigned to course",
      student: {
        id: student.id,
        name: student.name,
        surname: student.surname,
        username: student.username,
        courses: coursesWithNames,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error assigning to course", error });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id)
      .populate("teacher", "name surname email")
      .populate("students", "name surname email");

    if (!course) {
      return res.status(400).json({
        success: false,
        msg: "Course not found",
      });
    }
    const courseWithNames = {
      ...course.toObject(),
      teacher: course.teacher ? course.teacher : "Teacher not found",
      students:
        course.students.length > 0 ? course.students : "No students enrolled",
    };

    res.status(200).json({
      success: true,
      course: courseWithNames,
    });
  } catch (error) {
    req.status(500).json({
      success: false,
      msg: "Error getting course",
      error,
    });
  }
};
