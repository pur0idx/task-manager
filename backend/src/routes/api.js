import express from "express";
import signInController from "../controllers/signIn.js";
import signUpController from "../controllers/signUp.js";
import task from './task.js'
import organizations from './organizations.js'

const router = express.Router();

router.post("/signin", signInController);
router.post("/signup", signUpController);

router.use('/tasks',task)
router.use('/organizations',organizations)

export default router;