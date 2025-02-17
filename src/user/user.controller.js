import { response, request } from "express";
import pkg from "bcryptjs";
import User from "./user.model.js";
import Course from "../course/course.model.js";

const { hash } = pkg;

export const getUsers = async (req = request, res = response) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const query = { state: true };

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .skip(Number(offset))
        .limit(Number(limit))
        .populate({
          path: "courses",
          select: "name description teacher",
          populate: {
            path: "teacher",
            select: "name surname",
          },
        }),
    ]);

    const usersWithCourses = users.map((user) => ({
      ...user.toObject(),
      courses: user.courses
        ? user.courses.map((course) => ({
            name: course.name,
            description: course.description,
            teacher: course.teacher ? course.teacher : "Teacher not found",
          }))
        : [],
    }));

    res.status(200).json({
      success: true,
      total,
      users: usersWithCourses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "error when searching for users",
      error: error.message,
    });
  }
};

export const getUserById = async (req = request, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate({
      path: "courses",
      select: "name description teacher",
      populate: {
        path: "teacher",
        select: "name surname",
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        msg: "User not found",
      });
    }

    const usersWithCourses = {
      ...user.toObject(),
      courses: user.courses
        ? user.courses.map((course) => ({
            name: course.name,
            description: course.description,
            teacher: course.teacher ? course.teacher : "Teacher not found",
          }))
        : [],
    };

    res.status(200).json({
      succes: true,
      usersWithCourses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "error when searching for user",
      error: error.message,
    });
  }
};

export const updateUser = async (req, res = response) => {
  try {
    const { id } = req.params;
    const { password, ...data } = req.body;
    const authenticatedUser = req.user;

    if (authenticatedUser.id !== id) {
      return res.status(403).json({
        success: false,
        msg: "You can only update your own account",
      });
    }

    if (password) {
      data.password = await hash(password, 10);
    }
    const user = await User.findByIdAndUpdate(id, data, { new: true });

    res.status(200).json({
      success: true,
      msg: "User successfully updated",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Error updating user",
      error: error.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const authenticatedUser = req.user;

    if (authenticatedUser.id !== id) {
      return res.status(403).json({
        success: false,
        msg: "You can only delete your own account",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }

    if (user.role === "TEACHER_ROLE") {
      const adminUser = await User.findOne({ email: "ADMIN@gmail.com" });

      if (!adminUser) {
        return res.status(404).json({
          success: false,
          msg: "Admin user not found",
        });
      }

      await Course.updateMany({ teacher: user.id }, { teacher: adminUser.id });

      if (!adminUser.courses.includes(user.courses)) {
        await User.findByIdAndUpdate(adminUser.id, {
          $push: { courses: { $each: user.courses } },
        });
      }
    } else {
      await Course.updateMany(
        { students: user.id },
        { $pull: { students: user.id } }
      );

      user.courses = [];
      await user.save();
    }

    await User.findByIdAndUpdate(id, { state: false }, { new: true });

    res.status(200).json({
      success: true,
      msg: "User deactivated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Error deactivating user",
      error: error.message,
    });
  }
};
