const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // เช็ค path ให้ถูก
const Card = require('./models/card'); // เช็ค path ให้ถูก

// เชื่อมต่อ MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/uma-card-game')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error(err));

const giveItems = async () => {
    try {
        const targetUsername = "a3"; 
        const targetPassword = "a3"; // รหัสผ่านเดียวกับชื่อ

        console.log(`🔍 กำลังดำเนินการให้ User: ${targetUsername}...`);

        // 1. ดึงการ์ดทั้งหมดจาก DB มาเตรียมไว้
        const allHorses = await Card.find({ type: 'HORSE' });
        const allActions = await Card.find({ type: 'ACTION' });

        if (allHorses.length < 3 || allActions.length < 10) {
            console.log("❌ การ์ดในระบบมีไม่พอ! กรุณารัน node seed.js ก่อนครับ");
            process.exit();
        }

        // 2. เตรียมข้อมูล Inventory (ใส่ให้หมดที่มีในเกม)
        const fullInventory = [
            ...allHorses.map(c => ({ cardId: c._id, obtainedAt: new Date() })),
            ...allActions.map(c => ({ cardId: c._id, obtainedAt: new Date() }))
        ];

        // 3. เตรียมทีมม้า 3 ตัวแรก
        const defaultTeam = allHorses.slice(0, 3).map(c => c._id);

        // 4. เตรียม Deck Action (10 ใบแรก)
        const defaultActionDeck = {
            name: "Starter Deck",
            cards: allActions.slice(0, 10).map(c => c._id)
        };

        // 5. หา User หรือสร้างใหม่
        let user = await User.findOne({ username: targetUsername });

        if (!user) {
            console.log(`✨ ไม่พบ User ${targetUsername}, กำลังสร้างใหม่...`);
            // แฮชรหัสผ่านเองเลย เพื่อความชัวร์ (กันปัญหา pre-save hook)
            const hashedPassword = await bcrypt.hash(targetPassword, 10);
            
            user = new User({
                username: targetUsername,
                password: hashedPassword,
                coins: 999999,
                inventory: fullInventory,
                decks: defaultTeam,
                savedDecks: [defaultActionDeck],
                activeDeckIndex: 0
            });
        } else {
            console.log(`🔄 เจอ User ${targetUsername}, กำลังอัปเดตของ...`);
            // อัปเดตของอย่างเดียว ไม่แก้รหัสผ่าน
            user.coins = 999999;
            user.inventory = fullInventory;
            user.decks = defaultTeam;
            user.savedDecks = [defaultActionDeck];
            user.activeDeckIndex = 0;
        }

        await user.save();

        console.log(`
        🎉 เสกของสำเร็จ!
        --------------------------------
        👤 User: ${targetUsername}
        🔑 Pass: ${targetPassword} (ถ้าสร้างใหม่)
        💰 Coins: ${user.coins}
        🎒 Inventory: ${user.inventory.length} ชิ้น
        🐎 Active Team: 3 ตัว
        🃏 Saved Deck: 1 ชุด (${defaultActionDeck.cards.length} ใบ)
        --------------------------------
        👉 ลอง Login เข้าไปเทสได้เลย!
        `);

        process.exit();

    } catch (err) {
        console.error("❌ เกิดข้อผิดพลาด:", err);
        process.exit(1);
    }
};

giveItems();