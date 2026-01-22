const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  name: { type: String, required: true }, // ชื่อสนาม เช่น "Tokyo 2400m"
  distance: { type: Number, required: true }, // ระยะทางรวม
  image: { type: String, default: "" }, // รูปปกสนาม
  
  // สำคัญ: แบ่งสนามเป็นช่วงๆ (Segments)
  // เช่น: [ {type: 'START', dist: 200}, {type: 'CURVE', dist: 400}, {type: 'SLOPE', dist: 200} ]
  segments: [{
    type: { 
      type: String, 
      enum: ['STRAIGHT', 'CURVE', 'SLOPE', 'START', 'LAST_SPURT'], 
      required: true 
    },
    distance: { type: Number, required: true } // ความยาวของช่วงนั้นๆ
  }]
});

module.exports = mongoose.model('Track', trackSchema);