const mongoose = require('mongoose');

const actionCardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String }, // คำอธิบายสกิล
  image: { type: String, default: "" },
  
  // ผลของสกิล
  effectType: { 
    type: String, 
    enum: ['SPEED_BOOST', 'STAMINA_HEAL', 'DEBUFF'], 
    required: true 
  },
  value: { type: Number, required: true }, // เพิ่มความเร็วเท่าไหร่ หรือฮีลเท่าไหร่

  // เงื่อนไขการใช้ (Gameplay Logic จะมาอ่านตรงนี้)
  condition: { 
    type: String, 
    enum: ['START', 'ANY', 'CURVE', 'STRAIGHT', 'SLOPE', 'LAST_SPURT'], 
    default: 'ANY' 
  },
  
  rarity: { type: String, enum: ['N', 'R', 'SR', 'SSR'], default: 'R' }
});

module.exports = mongoose.model('ActionCard', actionCardSchema);