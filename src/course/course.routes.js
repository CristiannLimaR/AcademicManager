import { Router } from "express";
import { check } from "express-validator"
import { assignToCourse, deleteCourse, getAllCourses, getCourseById, getCourses, saveCourse, updateCourse } from "./course.controller.js";
import { validateFields } from "../middlewares/validate-fields.js";
import { validateJWT } from "../middlewares/validate-jwt.js";
import { hasRole } from "../middlewares/validate-roles.js";


const router = Router();

router.post(
    "/",
    [
        validateJWT,
        hasRole("TEACHER_ROLE"),
        check('teacher').isEmail().withMessage('This is not a valid email'),
        validateFields
    ],
    saveCourse
)

router.get(
    "/getAll",
    getAllCourses
)

router.get(
    "/",
    [
        validateJWT
    ],
    getCourses
)

router.get(
    "/findCourse/:id",
    getCourseById
)

router.post(
    "/assignToCourse/:courseId",
    [
        validateJWT,

    ],
    assignToCourse
)

router.put(
    "/:id",
    [
        validateJWT,
        hasRole("TEACHER_ROLE"),
        check('teacher').optional().isEmail().withMessage('This is not a valid email'),
        validateFields
    ],
    updateCourse
)

router.delete(
    "/:id",
    [
        validateJWT,
        hasRole("TEACHER_ROLE")
    ],
    deleteCourse
)

export default router;

