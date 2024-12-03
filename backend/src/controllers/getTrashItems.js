import Organization from "../models/Organization.js";
import User from "../models/User.js";
import Task from "../models/Task.js";

const getTrashItems = async (req, res) => {
  try {
    const { type } = req.params;
    const Model = type === "tasks" ? Task : Organization;

    const items = await Model.find({
      isDeleted: true,
      createdBy: req.user.id,
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export default getTrashItems;