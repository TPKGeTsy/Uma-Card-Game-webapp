const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');

// 1. เส้นทางสำหรับดูการ์ดทั้งหมด (GET /api/cards)
router.get('/cards', cardController.getCards);

// 2. เส้นทางสำหรับ Seed ข้อมูล (POST /api/seed)
router.post('/seed', cardController.seedDatabase);

module.exports = router;