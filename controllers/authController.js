const User = require('../models/User');
const jwt = require('jsonwebtoken');

// 1. สมัครสมาชิก (ไม่ต้อง Hash เองแล้ว ให้ Model ทำ)
exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("📝 Register Request:", username);

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "ชื่อผู้ใช้นี้มีคนใช้แล้วครับ" });
        }

        const newUser = new User({ 
            username, 
            password, 
            coins: 500,
            decks: [] 
        });
        
        await newUser.save();
        console.log("✅ Register Success:", username);
        res.status(201).json({ message: "สมัครสมาชิกเรียบร้อย!" });

    } catch (error) {
        console.error("❌ Register Error:", error);
        res.status(500).json({ message: "Server Error: " + error.message });
    }
};

// 2. ล็อกอิน
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("🔑 Login Attempt:", username);

        const user = await User.findOne({ username });
        if (!user) {
            console.log("❌ Login Fail: User Not Found");
            return res.status(400).json({ message: "ไม่พบชื่อผู้ใช้นี้ครับ" });
        }

        // ใช้ method ที่เราเขียนไว้ใน User Model
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log("❌ Login Fail: Wrong Password");
            return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้องครับ" });
        }

        const token = jwt.sign(
            { userId: user._id, username: user.username }, 
            'secret', 
            { expiresIn: '1h' }
        );
        console.log("✅ Login Success:", username);
        res.json({ token, username: user.username, coins: user.coins });

    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ message: "Server Error: " + error.message });
    }
};

// 3. ดึงข้อมูลโปรไฟล์ (ตัวปัญหา!)
exports.getProfile = async (req, res) => {
    try {
        // Log ดูซิว่า Middleware ส่งอะไรมาให้เรา
        console.log("👤 Get Profile Requested by UserID:", req.user?.userId);

        if (!req.user || !req.user.userId) {
            console.log("❌ Error: No User ID in Request");
            return res.status(400).json({ message: "Token Invalid: No User ID found" });
        }

        const user = await User.findById(req.user.userId).select('-password');
        
        if (!user) {
            console.log("❌ Error: User Not Found in DB (ID:", req.user.userId, ")");
            return res.status(404).json({ message: "User not found in Database" });
        }

        console.log("✅ Profile Found:", user.username);
        res.json(user);

    } catch (error) {
        console.error("❌ Get Profile Error:", error);
        res.status(500).json({ message: "Server Error: " + error.message });
    }
};