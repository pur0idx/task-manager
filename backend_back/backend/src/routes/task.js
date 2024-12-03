import express from "express";
import authenticateJWT from '../middlewares/authenticateJWT.js'
import { authenticateToken } from '../utils/jwt.js'
import createTask from "../controllers/createTask.js";
import deleteTaskById from "../controllers/deleteTaskById.js";
import getTask from "../controllers/getTask.js";
import updateTaskById from "../controllers/updateTaskById.js";
import getArchivesByTaskId from "../controllers/getArchivesByTaskId.js";
import restoreItemFromTrash from "../controllers/restoreItemFromTrash.js";

const router = express.Router();

router.get("", authenticateJWT, getTask);
router.post("", authenticateToken, createTask);
router.delete("/:id", authenticateToken, deleteTaskById);
router.put("/:id", authenticateJWT, updateTaskById);
router.patch("/:id/restore", authenticateJWT, restoreItemFromTrash);
router.patch("/:id/archive", authenticateJWT, getArchivesByTaskId);


export default router;