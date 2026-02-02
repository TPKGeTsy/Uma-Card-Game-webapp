const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Card = require('../models/card'); // ตรวจสอบชื่อไฟล์ Model ให้ตรงกับของคุณ (เช่น Card.js หรือ card.js)
const authenticateUser = require('../middleware/auth');

router.post('/pull', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { cost, poolType } = req.body; 
        // poolType รับค่าได้: 'HORSE', 'ACTION', 'TRAINING', หรือ 'ALL'

        // 1. เช็คเงิน User
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.coins < cost) return res.status(400).json({ message: "Coins ไม่พอ! ไปฟาร์มมาก่อนนะวัยรุ่น" });

        // 2. หักเงิน
        user.coins -= cost;

        // 3. ตั้งค่า Filter ตามตู้ที่เลือก
        let filter = {};
        
        // ถ้าไม่ใช่ 'ALL' ให้เลือกเฉพาะประเภทนั้น
        // แต่ถ้าเป็น 'ALL' (หรือค่าอื่นแปลกๆ) ให้ปล่อย filter เป็น {} เพื่อดึงการ์ดทั้งหมด
        if (poolType && poolType !== 'ALL') {
            filter.type = poolType; 
        }

        // 4. สุ่มการ์ด (ใช้ Aggregation $sample เพื่อประสิทธิภาพที่ดีกว่า Math.random ใน JS)
        const randomCards = await Card.aggregate([
            { $match: filter },    // กรองประเภท (ถ้ามี)
            { $sample: { size: 1 } } // สุ่มมา 1 ใบ
        ]);

        if (randomCards.length === 0) {
            return res.status(500).json({ message: "ตู้ว่างเปล่า! แอดมินลืมเติมของรึเปล่า?" });
        }

        const selectedCard = randomCards[0];

        // 5. ยัดใส่กระเป๋า (Inventory)
        user.inventory.push({ 
            cardId: selectedCard._id, 
            obtainedAt: new Date() 
        });
        
        await user.save();

        // 6. ส่งผลลัพธ์กลับไป
        res.json({ 
            newCoins: user.coins, 
            card: selectedCard 
        });

    } catch (error) {
        console.error("Gacha Error:", error);
        res.status(500).json({ message: "Server Error: " + error.message });
    }
});

module.exports = router;