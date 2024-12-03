import Organization from "../models/Organization.js";
import User from "../models/User.js";
import Task from "../models/Task.js";

const getTask = async (req, res) => {
  try {
    const userOrgs = await Organization.find({
      "members.user": req.user.id,
    }).select("_id");

    const orgIds = userOrgs.map((org) => org._id);

    const tasks = await Task.find({
      $or: [{ createdBy: req.user.id }, { organization: { $in: orgIds } }],
    })
      .populate("organization", "name")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Error fetching tasks" });
  }
};

export default getTask;