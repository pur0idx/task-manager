import express from "express";
import api from './api.js'

const router = express.Router();

router.use('/api', api);

export default router;