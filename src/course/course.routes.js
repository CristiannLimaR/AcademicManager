import { Router } from "express";
import { check } from "express-validator"
import { saveCourse } from "./course.controller.js";
import { validateFields } from "../middlewares/validate-fields.js";
import { validateJWT } from "../middlewares/validate-jwt.js";


const router = Router();

router.post(
    "/",
    [
        validateJWT,
        check('teacher').isEmail().withMessage('This is not a valid email'),
        validateFields
    ],
    saveCourse
)

export default router;

