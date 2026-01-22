const User = require('../models/User');

exports.startBattle = async (req, res) => {
    try {
        // 1. ดึงข้อมูล User และ Team ที่จัดไว้
        const user = await User.findById(req.user.userId).populate('decks');

        // เช็คว่าจัดทีมหรือยัง?
        if (!user.decks || user.decks.length !== 3) {
            return res.status(400).json({ message: "คุณยังไม่ได้จัดทีม 3 ตัวเลย! ไปจัดก่อนที่หน้า Deck" });
        }

        // 2. คำนวณพลังทีมเรา (รวม Speed + Stamina ของม้าทุกตัว)
        let myPower = 0;
        user.decks.forEach(card => {
            myPower += (card.stats.speed + card.stats.stamina);
        });

        // 3. สร้างพลังบอท (ให้พลังใกล้เคียงเรา บวกลบ 10 หน่วย)
        // บอทจะเก่งตามเรา ยิ่งเราเก่ง บอทยิ่งเก่ง
        const variance = Math.floor(Math.random() * 20) - 5; // สุ่มเลข -5 ถึง +15
        const botPower = myPower + variance; 

        // 4. ตัดสินผลแพ้ชนะ
        let result = "";
        let reward = 0;

        if (myPower >= botPower) {
            result = "WIN";
            reward = 500; // ชนะได้ 500
            user.coins += reward;
        } else {
            result = "LOSE";
            reward = 50; // แพ้ได้ค่ารถกลับบ้าน 50
            user.coins += reward;
        }

        // 5. บันทึกเหรียญล่าสุด
        await user.save();

        // 6. ส่งผลการแข่งกลับไป
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