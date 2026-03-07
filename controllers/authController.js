// 📌 ส่วนจัดการการยืนยันตัวตน (Authentication)
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// คีย์ลับสำหรับถอดรหัส Token (ต้องตรงกับ Middleware)
const JWT_SECRET = 'mysecretkey123';

/**
 * 📝 ฟังก์ชันสมัครสมาชิก (Register)
 * 1. รับข้อมูล Username/Password
 * 2. ตรวจสอบว่าชื่อซ้ำหรือไม่
 * 3. บันทึกผู้ใช้ใหม่ลงฐานข้อมูล (มีการแจกเหรียญเริ่มต้น 1000 Coins)
 */
exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("📝 Register Request:", username);

        if (!username || !password) {
            return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบครับ" });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "ชื่อผู้ใช้นี้มีคนใช้แล้วครับ" });
        }

        // สร้าง Object ผู้ใช้ใหม่ (รหัสผ่านจะถูก Hash ที่ระดับ Model)
        const newUser = new User({ 
            username, 
            password, 
            coins: 1000,
            isAdmin: false,
            inventory: [],
            decks: [],
            savedDecks: []
        });
        
        await newUser.save();
        console.log("✅ Register Success:", username);
        res.status(201).json({ message: "สมัครสมาชิกเรียบร้อย!" });

    } catch (error) {
        console.error("❌ Register Error:", error);
        res.status(500).json({ message: "Server Error: " + error.message });
    }
};

/**
 * 🔑 ฟังก์ชันเข้าสู่ระบบ (Login)
 * 1. ตรวจสอบชื่อผู้ใช้และรหัสผ่าน
 * 2. หากถูกต้อง จะสร้าง JWT Token เพื่อใช้ระบุตัวตนใน Request ต่อไป
 */
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("🔑 Login Attempt:", username);

        const user = await User.findOne({ username });
        if (!user) {
            console.log("❌ Login Fail: User Not Found");
            return res.status(400).json({ message: "ไม่พบชื่อผู้ใช้นี้ครับ" });
        }

        let isMatch = false;
        // ตรวจสอบรหัสผ่าน (รองรับทั้ง Plain Text และ Bcrypt)
        if (user.password === password) {
            isMatch = true;
        } else {
            isMatch = await user.comparePassword(password);
        }

        if (!isMatch) {
            console.log("❌ Login Fail: Wrong Password");
            return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้องครับ" });
        }

        // สร้าง JWT Token อายุ 1 วัน
        const token = jwt.sign(
            { userId: user._id, username: user.username }, 
            JWT_SECRET, 
            { expiresIn: '1d' }
        );

        console.log("✅ Login Success:", username);
        res.json({ 
            token, 
            username: user.username, 
            isAdmin: user.isAdmin,
            coins: user.coins 
        });

    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ message: "Server Error: " + error.message });
    }
};

/**
 * 👤 ฟังก์ชันดึงข้อมูลโปรไฟล์ (Get Profile)
 * 1. ตรวจสอบความถูกต้องของ Token ผ่าน Middleware
 * 2. ดึงข้อมูลผู้ใช้พร้อมรายการไอเทมใน Inventory และทีมที่จัดไว้
 */
exports.getProfile = async (req, res) => {
    try {
        console.log("👤 Get Profile Requested by UserID:", req.user?.userId);

        if (!req.user || !req.user.userId) {
            return res.status(400).json({ message: "Token Invalid: No User ID found" });
        }

        // ดึงข้อมูลผู้ใช้ (ตัดรหัสผ่านออก) และนำ ID การ์ดไปแปลงเป็นข้อมูลการ์ดจริง (Populate)
        const user = await User.findById(req.user.userId)
            .select('-password')
            .populate('inventory.cardId')
            .populate('savedDecks.cards');
        
        if (!user) {
            return res.status(404).json({ message: "User not found in Database" });
        }

        res.json(user);

    } catch (error) {
        console.error("❌ Get Profile Error:", error);
        res.status(500).json({ message: "Server Error: " + error.message });
    }
};