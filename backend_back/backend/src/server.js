import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import { jwtVerify, authenticateToken } from "./utils/jwt.js";
import authenticateJWT from "./middlewares/authenticateJWT.js";

import createTask from "./controllers/createTask.js";
import deleteTaskById from "./controllers/deleteTaskById.js";
import getTask from "./controllers/getTask.js";
import updateTaskById from "./controllers/updateTaskById.js";
import getArchivesByTaskId from "./controllers/getArchivesByTaskId.js";

import createOrganizations from "./controllers/createOrganizations.js";
import deleteOrganizations from "./controllers/deleteOrganizations.js";
import getOrganizations from "./controllers/getOrganizations.js";
import getOrganizationsByUserId from "./controllers/getOrganizationsByUserId.js";
import getOrganizationsMembers from "./controllers/getOrganizationMembers.js";
import deleteOrganizationMemberByUsername from "./controllers/deleteOrganizationMemberByUsername.js";
import updateOrganizationsById from "./controllers/updateOrganizationsById.js";
import deleteMemberFromOrganization from "./controllers/deleteMemberFromOrganization.js";

import getTrashItems from "./controllers/getTrashItems.js";
import router from "./routes/route.js";

const port = process.env.PORT || 4096;

const app = express();

// CORS configuration
app.use(cors({ origin: "*" }));

// Handle preflight requests
app.options("*", cors());

// Middleware
app.use(express.json());
app.use(router)


mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.error("MongoDB connection error:", error));

// app.get("/api/tasks", authenticateJWT, getTask);
// app.post("/api/tasks", authenticateToken, createTask);
// app.delete("/api/tasks/:id", authenticateToken, deleteTaskById);
// app.put("/api/tasks/:id", authenticateJWT, updateTaskById);
// app.patch("/api/tasks/:id/restore", authenticateJWT, restoreItemFromTrash);
// app.patch("/api/tasks/:id/archive", authenticateJWT, getArchivesByTaskId);

// app.get("/api/organizations", authenticateJWT, getOrganizations);
// app.post("/api/organizations", authenticateJWT, createOrganizations);
// app.get("/api/organizations/list", authenticateToken, getOrganizationsByUserId);
// app.post(
//   "/api/organizations/:orgId/members",
//   authenticateJWT,
//   getOrganizationsMembers
// );
// app.delete(
//   "/api/organizations/:orgId/members/:username",
//   authenticateJWT,
//   deleteOrganizationMemberByUsername
// );
// app.delete("/api/organizations/:id", authenticateJWT, deleteOrganizations);
// app.put("/api/organizations/:id", authenticateJWT, updateOrganizationsById);
// app.patch(
//   "/api/organizations/:id/members/leave",
//   authenticateJWT,
//   deleteMemberFromOrganization
// );

// app.patch("/api/:type/:id/trash", authenticateToken);
// app.get("/api/:type/trash", authenticateToken, getTrashItems);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
