require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const { jwtSign, jwtVerify, authenticateToken } = require('./utils/jwt');

// Import models
const User = require('./models/User');
const Task = require('./models/Task');
const Organization = require('./models/Organization');

const app = express();

// CORS configuration
app.use(cors({
    origin: "https://final-project.xyz",
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Handle preflight requests
app.options('*', cors());

// Middleware
app.use(express.json());

// JWT Authentication Middleware
const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const payload = await jwtVerify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch((error) => console.error('MongoDB connection error:', error));

// Authentication Routes
app.post('/api/signin', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        
        if (!user || user.password !== password) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password'
            });
        }

        // Create JWT token
        const token = await jwtSign({
            id: user._id,
            username: user.username,
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours expiration
        }, process.env.JWT_SECRET);

        res.json({ 
            success: true, 
            message: 'Login successful',
            token,
            user: { username: user.username }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during signin'
        });
    }
});

app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username already taken'
            });
        }

        const newUser = new User({ username, password });
        await newUser.save();
        
        res.status(201).json({ 
            success: true, 
            message: 'Account created successfully'
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during signup'
        });
    }
});

// Task Routes
app.get('/api/tasks', authenticateJWT, async (req, res) => {
    try {
        const userOrgs = await Organization.find({
            'members.user': req.user.id
        }).select('_id');
        
        const orgIds = userOrgs.map(org => org._id);

        const tasks = await Task.find({
            $or: [
                { createdBy: req.user.id },
                { organization: { $in: orgIds } }
            ]
        })
        .populate('organization', 'name')
        .sort({ createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Error fetching tasks' });
    }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const { title, description, dueDate, organization, tags, status } = req.body;
        
        const task = new Task({
            title,
            description,
            dueDate,
            organization: organization || null,
            tags: tags || [],
            status: status || 'To Do',
            createdBy: req.user.id
        });

        await task.save();
        await task.populate('organization', 'name');
        
        res.status(201).json(task);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Error creating task' });
    }
});

app.get('/api/organizations', authenticateJWT, async (req, res) => {
    try {
        const organizations = await Organization.find({
            'members.user': req.user.id
        }).populate('members.user', 'username');

        // Get task counts for each organization
        const orgsWithTaskCounts = await Promise.all(organizations.map(async (org) => {
            const taskCount = await Task.countDocuments({ organization: org._id });
            const orgObj = org.toObject();
            return {
                ...orgObj,
                taskCount: taskCount
            };
        }));

        res.json(orgsWithTaskCounts);
    } catch (error) {
        console.error('Error fetching organizations:', error);
        res.status(500).json({ message: 'Error fetching organizations' });
    }
});

app.post('/api/organizations', authenticateJWT, async (req, res) => {
    try {
        const { name, description, members } = req.body;

        const organization = new Organization({
            name,
            description,
            createdBy: req.user.id,
            members: [{ user: req.user.id, role: 'admin' }]
        });

        for (const memberEmail of members) {
            const user = await User.findOne({ username: memberEmail });
            if (user) {
                organization.members.push({ user: user._id, role: 'member' });
            }
        }

        await organization.save();
        await organization.populate('members.user', 'username');

        res.status(201).json(organization);
    } catch (error) {
        res.status(500).json({ message: 'Error creating organization' });
    }
});

app.get('/api/organizations/list', authenticateToken, async (req, res) => {
    try {
        const organizations = await Organization.find({
            'members.user': req.user.id
        }, '_id name');
        res.json(organizations);
    } catch (error) {
        console.error('Error fetching organizations list:', error);
        res.status(500).json({ message: 'Error fetching organizations' });
    }
});

const port = process.env.PORT || 4096;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

//deleteRoute
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user has permission to delete the task
        if (task.createdBy.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this task' });
        }

        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add member to organization
app.post('/api/organizations/:orgId/members', authenticateJWT, async (req, res) => {
    try {
        const { orgId } = req.params;
        const { username } = req.body;

        const organization = await Organization.findById(orgId);
        if (!organization) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        // Check if user is admin
        const isAdmin = organization.members.some(
            m => m.user.toString() === req.user.id && m.role === 'admin'
        );
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Find user to add
        const userToAdd = await User.findOne({ username });
        if (!userToAdd) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if user is already a member
        if (organization.members.some(m => m.user.toString() === userToAdd._id.toString())) {
            return res.status(400).json({ success: false, message: 'User is already a member' });
        }

        // Add new member
        organization.members.push({ user: userToAdd._id, role: 'member' });
        await organization.save();

        res.json({ success: true, message: 'Member added successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Remove member from organization
app.delete('/api/organizations/:orgId/members/:username', authenticateJWT, async (req, res) => {
    try {
        const { orgId, username } = req.params;

        const organization = await Organization.findById(orgId);
        if (!organization) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        // Check if user is admin
        const isAdmin = organization.members.some(
            m => m.user.toString() === req.user.id && m.role === 'admin'
        );
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Find user to remove
        const userToRemove = await User.findOne({ username });
        if (!userToRemove) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Remove member
        organization.members = organization.members.filter(
            m => m.user.toString() !== userToRemove._id.toString()
        );
        await organization.save();

        res.json({ success: true, message: 'Member removed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete organization endpoint
app.delete('/api/organizations/:id', authenticateJWT, async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);
        
        if (!organization) {
            return res.status(404).json({ 
                success: false, 
                message: 'Organization not found' 
            });
        }

        // Check if user is admin
        const isAdmin = organization.members.some(
            m => m.user.toString() === req.user.id && m.role === 'admin'
        );

        if (!isAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to delete this organization' 
            });
        }

        // Delete the organization
        await Organization.findByIdAndDelete(req.params.id);
        
        // Delete associated tasks
        await Task.deleteMany({ organization: req.params.id });

        res.json({ 
            success: true, 
            message: 'Organization deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting organization:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Add this endpoint for updating organizations
app.put('/api/organizations/:id', authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const organization = await Organization.findById(id);
        
        if (!organization) {
            return res.status(404).json({ 
                success: false, 
                message: 'Organization not found' 
            });
        }

        // Check if user is admin
        const isAdmin = organization.members.some(
            m => m.user.toString() === req.user.id && m.role === 'admin'
        );

        if (!isAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to update this organization' 
            });
        }

        // Check if new name is already taken (if name is being changed)
        if (name !== organization.name) {
            const existingOrg = await Organization.findOne({ name });
            if (existingOrg) {
                return res.status(400).json({
                    success: false,
                    message: 'Organization name already exists'
                });
            }
        }

        // Update the organization
        const updatedOrg = await Organization.findByIdAndUpdate(
            id,
            { 
                name,
                description,
                updatedAt: new Date()
            },
            { new: true }
        ).populate('members.user', 'username');

        res.json(updatedOrg);
    } catch (error) {
        console.error('Error updating organization:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating organization' 
        });
    }
});

// Update task endpoint (already exists, just make sure it can handle archived status)
app.put('/api/tasks/:id', authenticateJWT, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({ 
                success: false, 
                message: 'Task not found' 
            });
        }

        // Check if user owns the task
        if (task.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to update this task' 
            });
        }

        // Update the task
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            { 
                ...req.body,
                updatedAt: new Date()
            },
            { new: true }
        ).populate('organization', 'name');

        res.json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating task' 
        });
    }
});

// Move item to trash
app.patch('/api/:type/:id/trash', authenticateToken, async (req, res) => {
    try {
        const { type, id } = req.params;
        const Model = type === 'tasks' ? Task : Organization;
        
        const item = await Model.findByIdAndUpdate(id, {
            isDeleted: true,
            deletedAt: new Date()
        }, { new: true });
        
        res.json({ success: true, item });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Restore item from trash
app.patch('/api/tasks/:id/restore', authenticateJWT, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({ 
                success: false, 
                message: 'Task not found' 
            });
        }

        // Check if user owns the task
        if (task.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to restore this task' 
            });
        }

        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            { 
                archived: false,
                archivedAt: null
            },
            { new: true }
        ).populate('organization', 'name');

        res.json({ success: true, task: updatedTask });
    } catch (error) {
        console.error('Error restoring task:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error restoring task' 
        });
    }
});

// Get trash items
app.get('/api/:type/trash', authenticateToken, async (req, res) => {
    try {
        const { type } = req.params;
        const Model = type === 'tasks' ? Task : Organization;
        
        const items = await Model.find({
            isDeleted: true,
            createdBy: req.user.id
        });
        
        res.json(items);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add this new route for archiving tasks
app.patch('/api/tasks/:id/archive', authenticateJWT, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({ 
                success: false, 
                message: 'Task not found' 
            });
        }

        // Check if user owns the task
        if (task.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to archive this task' 
            });
        }

        // Update the task to archived status
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            { 
                archived: true,
                archivedAt: new Date()
            },
            { new: true }
        ).populate('organization', 'name');

        res.json({ success: true, task: updatedTask });
    } catch (error) {
        console.error('Error archiving task:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error archiving task' 
        });
    }
});