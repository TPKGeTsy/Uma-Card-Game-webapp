const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateUser = require('../middleware/auth');

// 📝 Register
router.post('/register', authController.register);

// 🔑 Login
router.post('/login', authController.login);

// 👤 Get Profile
router.get('/profile', authenticateUser, authController.getProfile);

module.exports = router;