const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  
  // ประเภทการ์ด: รองรับ HORSE, TRAINING, ACTION และเผื่ออนาคต SUPPORT
  type: { 
    type: String, 
    enum: ['HORSE', 'TRAINING', 'ACTION', 'SUPPORT'], 
    required: true 
  },

  // ความหายาก: มี N, R, SR, SSR
  rarity: { 
    type: String, 
    enum: ['N', 'R', 'SR', 'SSR'], 
    default: 'N' 
  },

  image: { type: String }, // Path รูปภาพ

  // 🐎 ค่าพลังม้า (สำคัญมากสำหรับหน้า Battle)
  stats: {
    speed: { type: Number, default: 0 },
    stamina: { type: Number, default: 0 },
    power: { type: Number, default: 0 },
    guts: { type: Number, default: 0 },
    wisdom: { type: Number, default: 0 }
  },

  // 🛠️ สำหรับ Action & Training Cards
  value: { type: Number },          // ค่าตัวเลข (เช่น +50 speed)
  statType: { type: String },       // ประเภท stat ที่ฝึก (SPEED, STAMINA)
  effectType: { type: String },     // ผลลัพธ์สกิล (HEAL, SPEED_BURST)
  condition: { type: String },      // เงื่อนไข (START_ONLY, CORNER)
  desc: { type: String },           // คำอธิบายการ์ด (เอาไว้โชว์ Tooltip)

  // 🎲 รองรับระบบลูกเต๋า (Gambler)
  gamble: {
    minRoll: Number,
    winStats: Object,
    loseStats: Object
  },

  // 🎁 รองรับ Training ที่แถมการ์ด Action (Bonus)
  bonusAction: {
    name: String,
    type: String,
    effect: String,
    color: String
  }
});

module.exports = mongoose.model('Card', cardSchema);