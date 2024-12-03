import Organization from "../models/Organization.js";
import User from "../models/User.js";
import Task from "../models/Task.js";

const deleteOrganizationMemberByUsername = async (req, res) => {
  try {
    const { orgId, username } = req.params;

    const organization = await Organization.findById(orgId);
    if (!organization) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found" });
    }

    // Check if user is admin
    const isAdmin = organization.members.some(
      (m) => m.user.toString() === req.user.id && m.role === "admin"
    );
    if (!isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    // Find user to remove
    const userToRemove = await User.findOne({ username });
    if (!userToRemove) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Remove member
    organization.members = organization.members.filter(
      (m) => m.user.toString() !== userToRemove._id.toString()
    );
    await organization.save();

    res.json({ success: true, message: "Member removed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export default deleteOrganizationMemberByUsername