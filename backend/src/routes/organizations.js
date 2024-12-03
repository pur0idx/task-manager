import express from "express";
import createOrganizations from "../controllers/createOrganizations.js";
import deleteOrganizations from "../controllers/deleteOrganizations.js";
import getOrganizations from "../controllers/getOrganizations.js";
import getOrganizationsByUserId from "../controllers/getOrganizationsByUserId.js";
import getOrganizationsMembers from "../controllers/getOrganizationMembers.js";
import deleteOrganizationMemberByUsername from "../controllers/deleteOrganizationMemberByUsername.js";
import updateOrganizationsById from "../controllers/updateOrganizationsById.js";
import deleteMemberFromOrganization from "../controllers/deleteMemberFromOrganization.js";
import authenticateJWT from "../middlewares/authenticateJWT.js";
import { authenticateToken } from "../utils/jwt.js";

const router = express.Router();

router.get("/", authenticateJWT, getOrganizations);
router.post("/", authenticateJWT, createOrganizations);
router.get("/list", authenticateToken, getOrganizationsByUserId);
router.post("/:orgId/members", authenticateJWT, getOrganizationsMembers);
router.delete(
  "/:orgId/members/:username",
  authenticateJWT,
  deleteOrganizationMemberByUsername
);
router.delete("/:id", authenticateJWT, deleteOrganizations);
router.put("/:id", authenticateJWT, updateOrganizationsById);
router.patch(
  "/:id/members/leave",
  authenticateJWT,
  deleteMemberFromOrganization
);

export default router;
