const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Card = require('../models/card'); // เช็คชื่อไฟล์ดีๆ
const authenticateUser = require('../middleware/auth');

router.post('/pull', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { cost, poolType } = req.body; // รับ poolType: 'HORSE' หรือ 'ACTION'

        const user = await User.findById(userId);
        if (user.coins < cost) return res.status(400).json({ message: "Coins ไม่พอ!" });

        // หักเงิน
        user.coins -= cost;

        // เลือกตู้สุ่ม
        const typeFilter = poolType === 'HORSE' ? 'HORSE' : 'ACTION'; 
        const allCards = await Card.find({ type: typeFilter });

        if (allCards.length === 0) return res.status(500).json({ message: "ตู้ว่างเปล่า!" });

        // สุ่ม (Basic RNG)
        const randomCard = allCards[Math.floor(Math.random() * allCards.length)];

        // ยัดลงกระเป๋า
        user.inventory.push({ cardId: randomCard._id, obtainedAt: new Date() });
        await user.save();

        res.json({ newCoins: user.coins, card: randomCard });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;