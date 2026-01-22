const User = require('../models/User');
const Card = require('../models/card');

exports.pullGacha = async (req, res) => {
    try {
        const PRICE = 100; // ราคากาชาต่อครั้ง

        // 1. หา User จาก Token (ที่ผ่านยามมาแล้ว)
        const user = await User.findById(req.user.userId);

        // 2. เช็คเงิน
        if (user.coins < PRICE) {
            return res.status(400).json({ message: "เงินไม่พอครับพี่! ไปหามาเพิ่มก่อน" });
        }

        // 3. หักเงิน
        user.coins -= PRICE;

        // 4. สุ่มการ์ด (ดึงมาทั้งหมดแล้วสุ่มหยิบ 1 ใบ)
        // (วิธีนี้เหมาะกับโปรเจกต์เล็กๆ ถ้าข้อมูลเยอะต้องใช้วิธีอื่น)
        const allCards = await Card.find();
        const randomCard = allCards[Math.floor(Math.random() * allCards.length)];

        // 5. เอาการ์ดใส่กระเป๋า (Inventory)
        user.inventory.push({
            cardId: randomCard._id,
            obtainedAt: new Date()
        });

        // 6. บันทึกข้อมูล User ลง Database
        await user.save();

        res.json({
            message: `ยินดีด้วย! คุณได้รับ ${randomCard.name}`,
            card: randomCard,
            remainingCoins: user.coins
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};