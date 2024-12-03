const signUpController = async (req, res) => {
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
}

module.exports = signUpController;