import Organization from "../models/Organization.js";
import User from "../models/User.js";
import Task from "../models/Task.js";

const createTask = async (req, res) => {
  try {
    const { title, description, dueDate, organization, tags, status } =
      req.body;

    const task = new Task({
      title,
      description,
      dueDate,
      organization: organization || null,
      tags: tags || [],
      status: status || "To Do",
      createdBy: req.user.id,
    });

    await task.save();
    await task.populate("organization", "name");

    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Error creating task" });
  }
};

export default createTask;