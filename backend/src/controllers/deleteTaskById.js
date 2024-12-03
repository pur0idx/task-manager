import Organization from "../models/Organization.js";
import User from "../models/User.js";
import Task from "../models/Task.js";

const deleteTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Check if user has permission to delete the task
        if (task.createdBy.toString() !== req.user.id.toString()) {
            return res
                .status(403)
                .json({ message: "Not authorized to delete this task" });
        }

        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export default deleteTaskById;