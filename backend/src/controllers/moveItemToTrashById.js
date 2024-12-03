import Organization from "../models/Organization.js";
import User from "../models/User.js";
import Task from "../models/Task.js";

const moveItemToTrashById = async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = type === "tasks" ? Task : Organization;

    const item = await Model.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default moveItemToTrashById