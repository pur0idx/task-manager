import Organization from "../models/Organization.js";
import User from "../models/User.js";
import Task from "../models/Task.js";

const getOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find({
      "members.user": req.user.id,
    }).populate("members.user", "username");

    // Get task counts for each organization
    const orgsWithTaskCounts = await Promise.all(
      organizations.map(async (org) => {
        const taskCount = await Task.countDocuments({ organization: org._id });
        const orgObj = org.toObject();
        return {
          ...orgObj,
          taskCount: taskCount,
        };
      })
    );

    res.json(orgsWithTaskCounts);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    res.status(500).json({ message: "Error fetching organizations" });
  }
};

export default getOrganizations;