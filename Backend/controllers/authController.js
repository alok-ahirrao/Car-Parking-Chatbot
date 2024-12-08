// controllers/authController
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require("uuid");
exports.register = async (req, res) => {
    const { firstName, lastName, phoneNumber, email, password } = req.body;
    try {
        // Check if the email or phone number already exists
        const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
        if (existingUser) {
            return res.status(400).json({ error: "Email or phone number already in use." });
        }

        // Create the user with a unique userId
        const user = await User.create({
            userId: uuidv4(), // Generate unique userId
            firstName,
            lastName,
            phoneNumber,
            email,
            password,
        });

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Login
exports.login = async (req, res) => {
    const { identifier, password } = req.body; // Change to 'identifier' for flexibility
    try {
        // Check if the identifier is a phone number or an email
        const query = identifier.includes('@') ? { email: identifier } : { phoneNumber: identifier };
        
        const user = await User.findOne(query);
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get User Info (after login using JWT)
exports.getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ firstName: user.firstName });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
