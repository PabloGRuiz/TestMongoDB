const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

const registerUser = async (req, res) => {
    try {
        const { email } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email is already registered." });
        }

        const newUser = new User(req.body);
        await newUser.save();
        return res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("=> [REGISTER] Error registering user:", error);
        return res.status(400).json({ error: "Error registering user", details: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        return res.json({ message: "Login successful", token });
    } catch (error) {
        console.error("=> [LOGIN] Server error during login:", error);
        return res.status(500).json({ error: "Server error during login" });
    }
};

module.exports = {
    registerUser,
    loginUser
};
