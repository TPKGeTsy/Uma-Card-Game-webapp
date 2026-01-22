const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 👇 1. ต้อง Import ตัวเช็ค Login เข้ามาด้วย (สำคัญมาก!)
const authenticateUser = require('../middleware/auth'); 

// Route สมัครสมาชิก & ล็อกอิน
router.post('/register', authController.register);
router.post('/login', authController.login);

// 👇 2. ต้องใส่ authenticateUser คั่นตรงกลาง เพื่อเช็ค Token ก่อนเข้า Controller
router.get('/profile', authenticateUser, authController.getProfile);

module.exports = router;