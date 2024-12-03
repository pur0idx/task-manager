const express = require('express');
const router = express.Router();
const Task = require('./Task');
const auth = require('../middleware/auth'); // Assuming you have auth middleware

// Delete task route
router.delete('/api/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Archive a task
router.patch('/tasks/:id/archive', auth, async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            {
                archived: true,
                archivedAt: new Date()
            },
            { new: true }
        );

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({ success: true, task });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Restore task from archive
router.patch('/api/tasks/:id/restore', auth, async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            {
                $set: { 
                    archived: false,
                    archivedAt: null
                }
            },
            { new: true }
        );

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({ success: true, task });
    } catch (error) {
        console.error('Error restoring task:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;