const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticateUser = require('../middleware/auth'); 
const JWT_SECRET = 'mysecretkey123';

// 📝 Register
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validation
        if (!username || !password) return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });

        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: "Username นี้มีคนใช้แล้ว" });

        // 🔥 สำคัญ: ทำการ Hash Password เองเลย ไม่ต้องรอ Model Hook (กันพลาด)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ 
            username, 
            password: hashedPassword, // บันทึกแบบ Hash เสมอ
            coins: 1000,
            isAdmin: false 
        });
        
        await newUser.save();
        res.status(201).json({ message: "สมัครสมาชิกสำเร็จ!" });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ message: err.message });
    }
});

// 🔑 Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        
        if (!user) return res.status(400).json({ message: "ไม่พบชื่อผู้ใช้งานนี้" });

        // 🔍 DEBUG LOG: ดูค่าที่ส่งมา vs ค่าใน DB (ดูที่ Terminal ฝั่ง Backend นะครับ)
        console.log(`Login Attempt: ${username}`);
        console.log(`Input Pass: ${password}`);
        console.log(`DB Pass:    ${user.password}`);

        let isMatch = false;

        // ✅ วิธีเช็คแบบ Hybrid (รองรับทั้งแบบ Hash และแบบ a4)
        if (user.password === password) {
            // 1. เช็คแบบตรงๆ (สำหรับ a4 ที่ Seed มาแบบดิบๆ)
            console.log("Matched: Plain Text");
            isMatch = true;
        } else {
            // 2. ถ้าไม่ตรง ให้ลองเช็คแบบ Hash (สำหรับ User ที่สมัครใหม่)
            isMatch = await bcrypt.compare(password, user.password);
            console.log("Matched: Bcrypt ->", isMatch);
        }

        if (!isMatch) return res.status(400).json({ message: "รหัสผ่านผิด" });

        // สร้าง Token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });

        // ส่งข้อมูลกลับ
        res.json({ 
            token, 
            username: user.username, 
            isAdmin: user.isAdmin,
            coins: user.coins 
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: err.message });
    }
});

// Get Profile
router.get('/profile', authenticateUser, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password').populate('inventory.cardId').populate('savedDecks.cards');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;