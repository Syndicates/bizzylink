require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/minecraft', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
});

mongoose.connection.on('error', err => {
    console.error(`MongoDB Error: ${err.message}`);
});

// User Schema & Model
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mcUUID: { type: String, required: false, unique: true },
    linked: { type: Boolean, default: false },
    linkCode: { type: String, required: false },
    codeExpiry: { type: Date, required: false },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, required: false }
});

const User = mongoose.model('User', UserSchema);

// Middleware: Centralized error handler
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error: ${err.message}`, err.stack);
    res.status(500).json({ error: "Something went wrong, please try again later." });
});

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit requests per IP per window
    message: "Too many requests from this IP, please try again later"
});
app.use(limiter);

// Utility Functions
async function isUsernameTaken(username) {
    const user = await User.findOne({ username });
    return user !== null;
}

async function isMcUUIDLinked(mcUUID) {
    const user = await User.findOne({ mcUUID });
    return user !== null;
}

// 🟢 Register User
app.post('/register', [
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    if (await isUsernameTaken(username)) {
        return res.status(400).json({ error: "Username already taken." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ username, password: hashedPassword });
    await user.save();

    res.json({ message: "User registered successfully!" });
});

// 🟢 Login User
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found!" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid password!" });

    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login successful!", token });
});

// 🟢 Link Minecraft Account
app.post('/link', [
    body('mcUsername').isLength({ min: 3 }).withMessage('Minecraft username must be at least 3 characters long')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, mcUsername } = req.body;

    if (!username || !mcUsername) {
        return res.status(400).json({ error: "Username or Minecraft username is missing." });
    }

    try {
        let user = await User.findOne({ username });

        if (user && user.linked) {
            return res.status(400).json({ error: "Your account is already linked!" });
        }

        const response = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${mcUsername}`);
        if (!response.data || !response.data.id) {
            return res.status(400).json({ error: "Could not find Minecraft username" });
        }

        const mcUUID = response.data.id;

        if (await isMcUUIDLinked(mcUUID)) {
            return res.status(400).json({ error: "This Minecraft account is already linked to another user!" });
        }

        const linkCode = Math.random().toString(36).substring(2, 8);
        const codeExpiry = Date.now() + 30 * 60 * 1000; // Code expires in 30 minutes

        await User.findOneAndUpdate(
            { username },
            { mcUUID, linked: true, linkCode, codeExpiry },
            { new: true }
        );

        res.json({ message: "Minecraft account linked successfully!", linkCode });

    } catch (error) {
        res.status(400).json({ error: "Could not link Minecraft account." });
    }
});

// 🟢 Verify Link Code
app.post('/verify', [
    body('code').isLength({ min: 6 }).withMessage('Invalid link code.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, code } = req.body;

    try {
        const response = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`);
        if (!response.data || !response.data.id) {
            return res.status(400).json({ error: "Could not retrieve UUID for username." });
        }

        const mcUUID = response.data.id;
        let user = await User.findOne({ mcUUID });

        if (!user || user.linkCode !== code) {
            return res.status(400).json({ error: "Invalid or expired verification code." });
        }

        if (Date.now() > user.codeExpiry) {
            return res.status(400).json({ error: "Link code has expired." });
        }

        await User.updateOne({ mcUUID }, { linkCode: "", codeExpiry: null });
        res.json({ message: "Minecraft account successfully linked!" });

    } catch (error) {
        res.status(400).json({ error: "Verification failed. Check UUID and link code." });
    }
});

// 🟢 Fetch Player Stats (Example API Call)
app.get('/player/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const response = await axios.get(`http://your-minecraft-server-ip:4567/essentials/player/${username}`);
        res.json(response.data);
    } catch (error) {
        res.status(400).json({ error: "Failed to fetch player data" });
    }
});

// Serve HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'link.html'));
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});