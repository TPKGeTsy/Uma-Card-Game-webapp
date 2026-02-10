const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['HORSE', 'TRAINING', 'ACTION', 'TRACK'], required: true },
    rarity: { type: String, default: 'N' },
    image: String,
    
    // Stats สำหรับเกม
    stats: {
        speed: Number,
        stamina: Number,
        power: Number,
        guts: Number,
        wisdom: Number
    },

    // Action/Training specific
    statType: String,
    value: Number,
    condition: String,
    effectType: String,
    description: String,

    // Track specific
    distance: Number,
    weatherOptions: [String],
    segments: Array,
    landmarks: Array,

    // 🔥 ส่วนที่เพิ่มใหม่: WIKI PROFILE (เก็บข้อมูลประวัติแบบละเอียด)
    wikiProfile: {
        themeColor: String, // สีประจำตัว (เช่น #e91e63)
        subColor: String,   // สีรอง (เช่น #1a237e)
        birthDate: String,  // วันเกิด
        origin: String,     // บ้านเกิด
        alias: String,      // ฉายา
        voiceActor: String, // นักพากย์
        introQuote: String, // คำพูดเปิดตัว
        fullStory: String,  // ประวัติยาวๆ
        goals: [String],    // เป้าหมาย (Array)
        raceHistory: [{     // ประวัติการแข่ง
            name: String,
            result: String,
            grade: String
        }]
    }
});

module.exports = mongoose.model('Card', cardSchema);