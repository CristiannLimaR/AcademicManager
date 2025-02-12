import { Router } from "express";
import { check } from "express-validator";
import { getUsers, updateUser, getUserById, deleteUser} from "./user.controller.js";
import { validateFields } from "../middlewares/validate-fields.js";
import { existsUserById } from "../helpers/db-validator.js";
import { validateJWT } from "../middlewares/validate-jwt.js";

const router = Router();

router.get("/", getUsers);

router.get(
  "/findUser/:id",
  [
    check("id", "No es un ID valido").isMongoId(),
    check("id").custom(existsUserById),
    validateFields,
  ],
  getUserById
);

router.get(
    "/",
    getUsers
)

router.put(
  "/:id",
  [
    check("id", "No es un ID valido").isMongoId(),
    check("id").custom(existsUserById),
    validateFields,
  ],
  updateUser
);


router.delete(
  "/:id",
  [
    validateJWT,
    check("id", "No es un ID valido").isMongoId(),
    check("id").custom(existsUserById),
    validateFields
  ],
  deleteUser
)
export default router;