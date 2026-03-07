const express = require('express');
const router = express.Router();
const User = require('../models/User'); // 👈 เช็ค path ให้ถูก
const authenticateUser = require('../middleware/auth'); // 👈 เช็ค path ให้ถูก
const Card = require('../models/card');


// 1. 🎒 ดึง Inventory (เอาข้อมูลการ์ดมาโชว์ด้วย)
router.get('/inventory', authenticateUser, async (req, res) => {
    try {
        // populate('inventory.cardId') คือสั่งให้ไปหยิบข้อมูลจากตาราง Card มาแปะ
        const user = await User.findById(req.user.userId).populate('inventory.cardId');
        
        // ส่งกลับเฉพาะ Inventory (ที่มีข้อมูลการ์ดครบแล้ว)
        res.json(user.inventory);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. 🐎 จัดทีมม้า 3 ตัว (Set Horse Team)
// รับ body: { horseIds: ["id1", "id2", "id3"] }
router.post('/set-team', authenticateUser, async (req, res) => {
    try {
        const { horseIds } = req.body;

        if (!horseIds || horseIds.length > 3) {
            return res.status(400).json({ message: "เลือกม้าได้สูงสุด 3 ตัวครับ!" });
        }

        const user = await User.findById(req.user.userId);
        user.decks = horseIds; // บันทึกทีมม้า
        await user.save();

        res.json({ message: "จัดทีมม้าเรียบร้อย!", decks: user.decks });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 🏆 Leaderboard (ดึงอันดับโลก)
router.get('/leaderboard', async (req, res) => {
    try {
        const topPlayers = await User.find()
            .select('username wins') // ดึงแค่ชื่อและจำนวนที่ชนะ
            .sort({ wins: -1 })      // เรียงจากชนะมากไปน้อย
            .limit(10);             // เอาแค่ 10 อันดับแรก
        
        res.json(topPlayers);
    } catch (error) {
        res.status(500).json({ message: "Error fetching leaderboard" });
    }
});

router.get('/wiki-cards', async (req, res) => {
    try {
        // ดึงเฉพาะ Type = HORSE และเรียงตามชื่อ
        // select เอาแค่ field ที่จำเป็นเพื่อลดภาระ (id, name, image, rarity)
        const horses = await Card.find({ type: 'HORSE' })
            .select('name image rarity wikiProfile.themeColor') 
            .sort({ name: 1 });
            
        res.json(horses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
router.get('/wiki-cards/:id', async (req, res) => {
    try {
        const horse = await Card.findById(req.params.id);
        if (!horse) return res.status(404).json({ message: "ไม่พบม้าตัวนี้" });
        res.json(horse);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
router.get('/arena/opponents', async (req, res) => {
    try {
        // หา User ที่มีการจัดทีม (decks ไม่ว่าง) และไม่ใช่ตัวเรา (สมมติส่ง userId มาทาง header หรือ query ก็ได้)
        // เพื่อความง่าย ดึงมาหมดก่อนแล้วสุ่ม 5 คน
        const opponents = await User.find({ 
            decks: { $exists: true, $not: { $size: 0 } } 
        })
        .select('username decks') // เอาแค่ชื่อกับทีม
        .populate('decks')        // join ข้อมูลการ์ดม้ามาด้วย
        .limit(10);               // ดึงมาสัก 10 คน

        res.json(opponents);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. 🃏 บันทึก Action Deck (Deck Builder)
// รับ body: { deckName: "Speed Deck", cardIds: ["id1", "id2", ...] }
router.post('/save-deck', authenticateUser, async (req, res) => {
    try {
        const { deckName, cardIds } = req.body;
        
        if (!cardIds || cardIds.length === 0) {
            return res.status(400).json({ message: "Deck ต้องมีการ์ดอย่างน้อย 1 ใบ" });
        }

        const user = await User.findById(req.user.userId);
        
        // Demo: ถ้ายังไม่มี Deck ให้สร้างใหม่ / ถ้ามีแล้วให้ทับ Deck แรกไปเลย
        if (user.savedDecks.length === 0) {
            user.savedDecks.push({ name: deckName || "My Deck", cards: cardIds });
        } else {
            user.savedDecks[0] = { name: deckName || user.savedDecks[0].name, cards: cardIds };
        }
        
        await user.save();
        res.json({ message: "บันทึก Action Deck เรียบร้อย!", savedDecks: user.savedDecks });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;