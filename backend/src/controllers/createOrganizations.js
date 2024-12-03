import Organization from "../models/Organization.js";
import User from "../models/User.js";
import Task from "../models/Task.js";


const createOrganizations = async (req, res) => {
  try {
    const { name, description, members } = req.body;

    const organization = new Organization({
      name,
      description,
      createdBy: req.user.id,
      members: [{ user: req.user.id, role: "admin" }],
    });

    for (const memberEmail of members) {
      const user = await User.findOne({ username: memberEmail });
      if (user) {
        organization.members.push({ user: user._id, role: "member" });
      }
    }

    await organization.save();
    await organization.populate("members.user", "username");

    res.status(201).json(organization);
  } catch (error) {
    res.status(500).json({ message: "Error creating organization" });
  }
};

export default createOrganizations;