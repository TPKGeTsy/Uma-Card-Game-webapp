const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Card = require('../models/card'); // หรือ require('../models/Card') เช็คตัวเล็กตัวใหญ่ให้ตรงไฟล์จริง
const TrainingCard = require('../models/TrainingCard');
const ActionCard = require('../models/ActionCard');
const Track = require('../models/Track');
const checkAdmin = require('../middleware/checkAdmin');
const authenticateUser = require('../middleware/auth'); 

// --- 1. ตั้งค่าการอัปโหลดรูป (Multer Config) ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../client/public/images');
        if (!fs.existsSync(uploadPath)){
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- 2. API: CREATE (เพิ่มข้อมูลพร้อมรูป) ---
router.post('/add-card', authenticateUser, upload.single('imageFile'), checkAdmin, async (req, res) => {
    try {
        const { type, ...data } = req.body; // type = HORSE, TRAINING, ACTION, TRACK
        let newCard;
        
        // สร้าง Object ข้อมูลเตรียมบันทึก
        const cardData = {
            ...data,
            image: req.file ? `/images/${req.file.filename}` : req.body.image
        };

        // แปลง string เป็น object สำหรับ stats (กรณี HORSE)
        if (cardData.stats) cardData.stats = JSON.parse(cardData.stats);
        if (cardData.wikiProfile) cardData.wikiProfile = JSON.parse(cardData.wikiProfile); // 🔥 เพิ่มบรรทัดนี้

        // --- Logic การเลือก Model เพื่อบันทึก ---
        if (type === 'HORSE') {
            newCard = new Card({ ...cardData, type: 'HORSE' });
        } 
        else if (type === 'TRAINING') {
            newCard = new TrainingCard(cardData);
        } 
        else if (type === 'ACTION') {
            newCard = new ActionCard(cardData);
        } 
        // ... (ส่วน HORSE, TRAINING, ACTION เหมือนเดิม)

    else if (type === 'TRACK') { 
    // ❌ ลบโค้ดสุ่ม for loop เก่าทิ้งให้หมดครับ
    
    // ✅ ใช้อันนี้แทน: รับข้อมูลดิบที่ User กรอกมา
    // (Frontend จะส่งมาเป็น JSON String เราต้อง Parse กลับเป็น Object)
    let segments = [];
    if (cardData.segments) {
        segments = JSON.parse(cardData.segments);
    }

    newCard = new Track({
        name: cardData.name,
        image: cardData.image,
        description: cardData.description,
        distance: cardData.distance,
        segments: segments // บันทึกตามที่กรอกเป๊ะๆ
    });
}

        await newCard.save();
        res.json({ message: "✅ เพิ่มข้อมูลสำเร็จ!", data: newCard });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// --- 3. API: READ (ดึงข้อมูลทั้งหมดมาโชว์) ---
router.get('/all-cards', async (req, res) => {
    try {
        const horses = await Card.find({ type: 'HORSE' });
        const trainings = await TrainingCard.find();
        const actions = await ActionCard.find();
        const tracks = await Track.find(); // รวม Tracks เข้ามาแล้ว

        res.json({ horses, trainings, actions, tracks });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- 4. API: UPDATE (แก้ไขข้อมูล) ---
router.put('/update-card/:id', authenticateUser, upload.single('imageFile'), checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { collectionType, ...updateTextData } = req.body;
        
        let updateData = { ...updateTextData };

        if (req.file) {
            updateData.image = `/images/${req.file.filename}`;
        }

        if (collectionType === 'HORSE' && updateData.stats) {
             updateData.stats = JSON.parse(updateData.stats);
        }
        if (collectionType === 'HORSE' && updateData.wikiProfile) {
             updateData.wikiProfile = JSON.parse(updateData.wikiProfile); // 🔥 เพิ่มการ Parse Wiki
        }

        let Model;
        if (collectionType === 'HORSE') Model = Card;
        else if (collectionType === 'TRAINING') Model = TrainingCard;
        else if (collectionType === 'ACTION') Model = ActionCard;
        else if (collectionType === 'TRACK') Model = Track; // เพิ่ม Track แล้ว

        await Model.findByIdAndUpdate(id, updateData);
        res.json({ message: "📝 แก้ไขข้อมูลเรียบร้อย!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// --- 5. API: DELETE (ลบข้อมูล) ---
router.delete('/delete-card/:id', authenticateUser, checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { collectionType } = req.query;

        let Model;
        if (collectionType === 'HORSE') Model = Card;
        else if (collectionType === 'TRAINING') Model = TrainingCard;
        else if (collectionType === 'ACTION') Model = ActionCard;
        else if (collectionType === 'TRACK') Model = Track; // เพิ่ม Track แล้ว

        await Model.findByIdAndDelete(id);
        res.json({ message: "🗑️ ลบข้อมูลเรียบร้อย!" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;