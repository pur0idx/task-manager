import Organization from "../models/Organization.js";
import User from "../models/User.js";
import Task from "../models/Task.js";

const deleteOrganizations = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    // Check if user is admin
    const isAdmin = organization.members.some(
      (m) => m.user.toString() === req.user.id && m.role === "admin"
    );

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this organization",
      });
    }

    // Delete the organization
    await Organization.findByIdAndDelete(req.params.id);

    // Delete associated tasks
    await Task.deleteMany({ organization: req.params.id });

    res.json({
      success: true,
      message: "Organization deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting organization:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export default deleteOrganizations