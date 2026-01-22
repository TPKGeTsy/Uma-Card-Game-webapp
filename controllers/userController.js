const User = require('../models/User');

// 1. ดูของในกระเป๋า (ใช้ populate เพื่อเปลี่ยน ID เป็นข้อมูลการ์ดจริง)
exports.getInventory = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate('inventory.cardId');
        // ส่งกลับเฉพาะรายการของในกระเป๋า
        res.json(user.inventory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. จัดทีม 3 ตัว (ส่ง ID การ์ดมา 3 ใบ)
exports.setDeck = async (req, res) => {
    try {
        const { cardIds } = req.body; // รับ Array ID มา เช่น ["id1", "id2", "id3"]

        // เช็คว่าส่งมาครบ 3 ใบไหม
        if (!cardIds || cardIds.length !== 3) {
            return res.status(400).json({ message: "กรุณาเลือกการ์ดให้ครบ 3 ใบครับ!" });
        }

        const user = await User.findById(req.user.userId);
        
        // บันทึกทีมใหม่ทับของเดิม
        user.decks = cardIds; 
        await user.save();

        res.json({ message: "จัดทีมเสร็จเรียบร้อย! พร้อมลุย", deck: cardIds });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};