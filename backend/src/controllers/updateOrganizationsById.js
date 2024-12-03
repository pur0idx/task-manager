import Organization from "../models/Organization.js";
import User from "../models/User.js";
import Task from "../models/Task.js";

const updateOrganizationsById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const organization = await Organization.findById(id);

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
        message: "Not authorized to update this organization",
      });
    }

    // Check if new name is already taken (if name is being changed)
    if (name !== organization.name) {
      const existingOrg = await Organization.findOne({ name });
      if (existingOrg) {
        return res.status(400).json({
          success: false,
          message: "Organization name already exists",
        });
      }
    }

    // Update the organization
    const updatedOrg = await Organization.findByIdAndUpdate(
      id,
      {
        name,
        description,
        updatedAt: new Date(),
      },
      { new: true }
    ).populate("members.user", "username");

    res.json(updatedOrg);
  } catch (error) {
    console.error("Error updating organization:", error);
    res.status(500).json({
      success: false,
      message: "Error updating organization",
    });
  }
};

export default updateOrganizationsById;