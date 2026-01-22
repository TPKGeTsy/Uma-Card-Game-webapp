const mongoose = require('mongoose');

const trainingCardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, default: "" },
  
  // ประเภทค่าพลังที่จะเพิ่ม (Speed หรือ Stamina)
  statType: { 
    type: String, 
    enum: ['SPEED', 'STAMINA', 'POWER'], 
    required: true 
  },
  value: { type: Number, required: true }, // เพิ่มเท่าไหร่ (+5, +10)
  
  // Effect พิเศษ (ถ้ามีในอนาคต เช่น เพิ่มพลังคูณ 1.5 ถ้าม้าเป็นสาย Speed)
  bonusMultiplier: { type: Number, default: 1 }
});

module.exports = mongoose.model('TrainingCard', trainingCardSchema);