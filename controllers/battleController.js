// ⚔️ ส่วนจัดการการต่อสู้ (Battle System)
const User = require('../models/User');

/**
 * 🐎 ฟังก์ชันเริ่มการต่อสู้ (Start Battle)
 * 1. ตรวจสอบทีมของผู้เล่น (ต้องมีม้า 3 ตัว)
 * 2. คำนวณพลังรวมของทีมเรา (Speed + Stamina)
 * 3. สุ่มสร้างพลังคู่ต่อสู้ (AI) ที่มีความเก่งใกล้เคียงกับเรา
 * 4. ตัดสินผลแพ้-ชนะ และมอบรางวัล (Coins)
 */
exports.startBattle = async (req, res) => {
    try {
        // ดึงข้อมูลผู้เล่นและม้าในทีมที่จัดไว้
        const user = await User.findById(req.user.userId).populate('decks');

        // ตรวจสอบความพร้อมของทีม
        if (!user.decks || user.decks.length !== 3) {
            return res.status(400).json({ message: "คุณยังไม่ได้จัดทีม 3 ตัวเลย! ไปจัดก่อนที่หน้า Deck" });
        }

        // คำนวณพลังรวมฝั่งผู้เล่น
        let myPower = 0;
        user.decks.forEach(card => {
            myPower += (card.stats.speed + card.stats.stamina);
        });

        // ระบบ Dynamic Difficulty: สร้างบอทให้เก่งตามเรา (สุ่มค่าพลังบวกลบเล็กน้อย)
        const variance = Math.floor(Math.random() * 20) - 5; 
        const botPower = myPower + variance; 

        // ตัดสินผลแพ้ชนะ
        let result = "";
        let reward = 0;

        if (myPower >= botPower) {
            result = "WIN";
            reward = 500; // รางวัลสำหรับผู้ชนะ
            user.coins += reward;
            user.wins = (user.wins || 0) + 1; // เพิ่มสถิติชัยชนะ
        } else {
            result = "LOSE";
            reward = 50; // รางวัลปลอบใจสำหรับผู้แพ้
            user.coins += reward;
        }

        // บันทึกผลลัพธ์ลง Database
        await user.save();

        // ส่งผลการแข่งกลับไปแสดงผลที่หน้าบ้าน (Frontend)
        res.json({
            result: result,
            myTeamPower: myPower,
            botTeamPower: botPower,
            reward: reward,
            currentCoins: user.coins,
            message: result === "WIN" ? "ยินดีด้วย! คุณชนะการแข่งขัน" : "เสียใจด้วย คุณแพ้ราบคาบ..."
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};