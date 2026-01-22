const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  
  // 👇 แก้ตรงนี้ครับ: เพิ่ม ACTION และ SUPPORT เข้าไป
  type: { 
    type: String, 
    enum: ['HORSE', 'TRAINING', 'ACTION', 'SUPPORT'], 
    required: true 
  },

  // 👇 แก้ตรงนี้ด้วย (จากรอบที่แล้ว): เพิ่ม N เข้าไป
  rarity: { 
    type: String, 
    enum: ['N', 'R', 'SR', 'SSR'], 
    required: true 
  },

  value: { type: Number },
  statType: { type: String },
  condition: { type: String },
  image: { type: String }
});

module.exports = mongoose.model('Card', cardSchema);