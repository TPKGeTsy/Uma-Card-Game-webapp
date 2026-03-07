// 🎁 ส่วนจัดการระบบกาชา (Gacha System)
const User = require('../models/User');
const Card = require('../models/card');

/**
 * 🎲 ฟังก์ชันสุ่มกาชา (Pull Gacha)
 * 1. ตรวจสอบว่าผู้เล่นมีเงินเพียงพอหรือไม่ (100 Coins ต่อการสุ่ม)
 * 2. หักเงินผู้เล่น
 * 3. สุ่มหยิบการ์ด 1 ใบจากรายการการ์ดทั้งหมดใน Database
 * 4. เพิ่มการ์ดที่สุ่มได้ลงใน Inventory ของผู้เล่น
 */
exports.pullGacha = async (req, res) => {
    try {
        const PRICE = 100; // กำหนดราคากาชา

        // หาข้อมูลผู้ใช้ปัจจุบัน
        const user = await User.findById(req.user.userId);

        // ตรวจสอบยอดเงิน
        if (user.coins < PRICE) {
            return res.status(400).json({ message: "เงินไม่พอครับพี่! ไปหามาเพิ่มก่อน" });
        }

        // หักเงิน
        user.coins -= PRICE;

        // ดึงการ์ดทั้งหมดและสุ่มเลือก 1 ใบ
        const allCards = await Card.find();
        const randomCard = allCards[Math.floor(Math.random() * allCards.length)];

        // บันทึกการ์ดลงกระเป๋าผู้เล่น
        user.inventory.push({
            cardId: randomCard._id,
            obtainedAt: new Date()
        });

        // บันทึกสถานะล่าสุดลง Database
        await user.save();

        // ส่งข้อมูลการ์ดที่สุ่มได้กลับไปที่หน้าเว็บ
        res.json({
            message: `ยินดีด้วย! คุณได้รับ ${randomCard.name}`,
            card: randomCard,
            remainingCoins: user.coins
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};