import Organization from "../models/Organization.js";
import User from "../models/User.js";
import Task from "../models/Task.js";

const getOrganizationsMembers = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { username } = req.body;

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

    // Find user to add
    const userToAdd = await User.findOne({ username });
    if (!userToAdd) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if user is already a member
    if (
      organization.members.some(
        (m) => m.user.toString() === userToAdd._id.toString()
      )
    ) {
      return res
        .status(400)
        .json({ success: false, message: "User is already a member" });
    }

    // Add new member
    organization.members.push({ user: userToAdd._id, role: "member" });
    await organization.save();

    res.json({ success: true, message: "Member added successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export default getOrganizationsMembers;