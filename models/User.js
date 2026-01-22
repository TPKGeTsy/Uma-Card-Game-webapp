const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  coins: { type: Number, default: 1000 },
  isAdmin: { type: Boolean, default: false },

  // 🎒 Inventory รวม (เก็บทั้ง ม้า, Action, Training)
  inventory: [{
    cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
    obtainedAt: { type: Date, default: Date.now }
  }],

  // 🐎 ทีมม้า 3 ตัว (Active Team) ที่เลือกไว้ลงแข่ง
  // เก็บ Strategy (แผนการวิ่ง) ไว้ในนี้ด้วยเลยก็ได้ แต่ใน Demo เก็บแค่ ID การ์ดก่อน
  decks: [{
    type: mongoose.Schema.Types.ObjectId, ref: 'Card'
  }],

  // 🃏 ระบบ Deck Builder (เก็บชุดการ์ด Action ที่จัดไว้)
  savedDecks: [{
    name: { type: String, default: "My Deck" },
    cards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }]
  }],

  // เก็บ index ว่าตอนนี้เลือกใช้ Action Deck ชุดไหนอยู่
  activeDeckIndex: { type: Number, default: 0 }
});

// --- Logic เข้ารหัสผ่าน (Async/Await แบบใหม่ ไม่ใช้ next) ---
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ฟังก์ชันเทียบรหัสผ่าน
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 👇 ป้องกัน Error: OverwriteModelError
module.exports = mongoose.models.User || mongoose.model('User', userSchema);