import Organization from "../models/Organization.js";
import User from "../models/User.js";
import Task from "../models/Task.js";

const restoreItemFromTrash = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if user owns the task
    if (task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to restore this task",
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        archived: false,
        archivedAt: null,
      },
      { new: true }
    ).populate("organization", "name");

    res.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error("Error restoring task:", error);
    res.status(500).json({
      success: false,
      message: "Error restoring task",
    });
  }
};

export default restoreItemFromTrash;
