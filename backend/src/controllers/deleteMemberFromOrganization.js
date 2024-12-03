import Organization from "../models/Organization.js";
import User from "../models/User.js";
import Task from "../models/Task.js";

const deleteMemberFromOrganization = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    // Check if user is a member of the organization
    const memberIndex = organization.members.findIndex(
      (member) => member.user.toString() === req.user.id
    );

    if (memberIndex === -1) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this organization",
      });
    }

    // Check if user is the last admin
    const isAdmin = organization.members[memberIndex].role === "admin";
    const adminCount = organization.members.filter(
      (m) => m.role === "admin"
    ).length;

    if (isAdmin && adminCount === 1) {
      return res.status(403).json({
        success: false,
        message:
          "Cannot leave organization: You are the last admin. Please assign another admin first.",
      });
    }

    // Remove the member
    organization.members.splice(memberIndex, 1);
    await organization.save();

    res.json({
      success: true,
      message: "Successfully left the organization",
    });
  } catch (error) {
    console.error("Error leaving organization:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export default deleteMemberFromOrganization;