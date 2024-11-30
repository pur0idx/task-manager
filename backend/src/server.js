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
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Handle preflight requests
app.options('*', cors());

// Middleware
app.use(express.json());
// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', 'https://final-project.xyz');
//     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//     res.header('Access-Control-Allow-Credentials', 'true');
//     next();
// });

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
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const tasks = await Task.find({ createdBy: req.user.id })
            .populate('organization', 'name');
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
        res.json(organizations);
    } catch (error) {
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