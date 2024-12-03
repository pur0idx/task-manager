const User = require('../models/User')
const { jwtSign } = require('../utils/jwt')

const signInController = async (req, res) => {
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
}

module.exports = signInController