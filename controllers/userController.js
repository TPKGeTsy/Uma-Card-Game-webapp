// 👤 ส่วนจัดการข้อมูลผู้ใช้งาน (User & Social System)
const User = require('../models/User');

/**
 * 🎒 ฟังก์ชันดึงไอเทมในกระเป๋า (Get Inventory)
 * ดึงรายการการ์ดทั้งหมดที่ผู้เล่นครอบครอง พร้อมรายละเอียดสเตตัสของการ์ดแต่ละใบ
 */
exports.getInventory = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate('inventory.cardId');
        res.json(user.inventory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * 🛠️ ฟังก์ชันจัดทีม (Set Deck)
 * รับ ID ของการ์ด 3 ใบจากหน้าเว็บ เพื่อบันทึกเป็นทีมหลักที่ใช้ในการแข่งขัน
 */
exports.setDeck = async (req, res) => {
    try {
        const { cardIds } = req.body;
        if (!cardIds || cardIds.length !== 3) {
            return res.status(400).json({ message: "กรุณาเลือกการ์ดให้ครบ 3 ใบครับ!" });
        }

        const user = await User.findById(req.user.userId);
        user.decks = cardIds; 
        await user.save();

        res.json({ message: "จัดทีมเสร็จเรียบร้อย! พร้อมลุย", deck: cardIds });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * 🏆 ฟังก์ชันดึงอันดับผู้เล่น (Get Leaderboard)
 * ค้นหาผู้เล่นที่มียอดการชนะ (Wins) สูงสุด 10 อันดับแรกเพื่อแสดงในหน้า Ranking
 */
exports.getLeaderboard = async (req, res) => {
    try {
        const topPlayers = await User.find()
            .select('username wins')
            .sort({ wins: -1 })
            .limit(10);
        
        res.json(topPlayers);
    } catch (error) {
        res.status(500).json({ message: "Error fetching leaderboard" });
    }
};