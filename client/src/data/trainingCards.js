// client/src/data/trainingCards.js

export const TRAINING_CARDS = [
  // ==========================================
  // TYPE A: STAT MONSTERS (แดง - พลังล้วน)
  // ==========================================
  { id: 't1', name: "Interval Sprint", type: "STAT", stats: { speed: 80, stamina: -10 }, desc: "วิ่งสลับหยุด เร่งความเร็วสูงสุด" },
  { id: 't2', name: "Tire Dragging", type: "STAT", stats: { power: 80, speed: -10 }, desc: "ลากยางเพิ่มพลังขา" },
  { id: 't3', name: "Long Swim", type: "STAT", stats: { stamina: 80, speed: -10 }, desc: "ว่ายน้ำระยะไกล" },
  { id: 't4', name: "Waterfall Meditate", type: "STAT", stats: { guts: 80 }, desc: "นั่งสมาธิใต้น้ำตก" },
  { id: 't5', name: "Adv. Theory", type: "STAT", stats: { wisdom: 80 }, desc: "เรียนทฤษฎีขั้นสูง" },
  { id: 't6', name: "Protein Overload", type: "STAT", stats: { power: 40, stamina: 40 }, desc: "อัดโปรตีนเน้นๆ" },
  { id: 't7', name: "High Altitude", type: "STAT", stats: { speed: 40, stamina: 40 }, desc: "วิ่งบนที่สูง" },
  { id: 't8', name: "Limit Break", type: "STAT", stats: { speed: 100, stamina: -30 }, desc: "ทะลุขีดจำกัด (เสี่ยง)" },

  // ==========================================
  // TYPE B: AGGRO / DEBUFF (ม่วง - แถมการ์ดแดง)
  // ==========================================
  {
    id: 't9', name: "Intimidation", type: "DEBUFF", stats: { guts: 40 }, desc: "ฝึกจ้องตาข่มขวัญ",
    bonusAction: { name: "Stare Down", type: "DEBUFF", effect: "ลด Stamina เป้าหมาย -100", color: "red" }
  },
  {
    id: 't10', name: "Block Drill", type: "DEBUFF", stats: { power: 40 }, desc: "ฝึกบังไลน์วิ่ง",
    bonusAction: { name: "Block", type: "DEBUFF", effect: "ลด Speed ตัวหลัง -50", color: "red" }
  },
  {
    id: 't11', name: "Trash Talk", type: "DEBUFF", stats: { wisdom: 40 }, desc: "ฝึกฝีปากกล้า",
    bonusAction: { name: "Provoke", type: "DEBUFF", effect: "เป้าหมายเปลืองแรง x1.5", color: "red" }
  },
  {
    id: 't12', name: "Mud Running", type: "DEBUFF", stats: { stamina: 40 }, desc: "วิ่งในโคลน",
    bonusAction: { name: "Mud Splash", type: "DEBUFF", effect: "ลด Speed ตัวหลัง -50", color: "red" }
  },
  {
    id: 't13', name: "Shoulder Charge", type: "DEBUFF", stats: { power: 30, guts: 20 }, desc: "เบียดไหล่",
    bonusAction: { name: "Bump", type: "DEBUFF", effect: "กระแทกให้เสียจังหวะ", color: "red" }
  },
  {
    id: 't14', name: "Ghost Step", type: "DEBUFF", stats: { wisdom: 30, speed: 20 }, desc: "ย่างก้าวไร้เสียง",
    bonusAction: { name: "Panic", type: "DEBUFF", effect: "เป้าหมายหยุดชะงัก 2 วิ", color: "red" }
  },
  {
    id: 't15', name: "Pace Disrupt", type: "DEBUFF", stats: { speed: 30 }, desc: "ก่อกวนจังหวะ",
    bonusAction: { name: "Slow Down", type: "DEBUFF", effect: "บังคับลดความเร็ว", color: "red" }
  },

  // ==========================================
  // TYPE C: UTILITY / TECH (ฟ้า - แถมการ์ดเขียว/ฟ้า)
  // ==========================================
  {
    id: 't16', name: "Carrot Tasting", type: "UTILITY", stats: { stamina: 30 }, desc: "ชิมแครอทพรีเมียม",
    bonusAction: { name: "Carrot Snack", type: "HEAL", effect: "Stamina +150", color: "green" }
  },
  {
    id: 't17', name: "Yoga Stretch", type: "UTILITY", stats: { power: 30 }, desc: "ยืดเหยียด",
    bonusAction: { name: "Deep Breath", type: "HEAL", effect: "Stamina +250", color: "green" }
  },
  {
    id: 't18', name: "Video Analysis", type: "UTILITY", stats: { wisdom: 30 }, desc: "วิเคราะห์เทป",
    bonusAction: { name: "Positioning", type: "PASSIVE", effect: "หาช่องว่างอัตโนมัติ", color: "blue" }
  },
  {
    id: 't19', name: "Start Block", type: "UTILITY", stats: { speed: 30 }, desc: "ซ้อมออกตัว",
    bonusAction: { name: "Rocket Start", type: "PASSIVE", effect: "พุ่งแรงตอนเริ่มเกม", color: "blue" }
  },
  {
    id: 't20', name: "Cornering Tech", type: "UTILITY", stats: { power: 20, speed: 20 }, desc: "เทคนิคเข้าโค้ง",
    bonusAction: { name: "Corner Pro", type: "PASSIVE", effect: "ไม่ลด Speed ในโค้ง", color: "blue" }
  },
  {
    id: 't21', name: "Uphill Training", type: "UTILITY", stats: { power: 30 }, desc: "วิ่งขึ้นเขา",
    bonusAction: { name: "Mountain King", type: "PASSIVE", effect: "ไม่ลด Speed บนเนิน", color: "blue" }
  },
  {
    id: 't22', name: "Rain Sim", type: "UTILITY", stats: { guts: 30 }, desc: "จำลองฝนตก",
    bonusAction: { name: "Rainy Mood", type: "PASSIVE", effect: "วิ่งตากฝนดีขึ้น", color: "blue" }
  },
  {
    id: 't23', name: "Last Spurt", type: "UTILITY", stats: { speed: 30 }, desc: "ซ้อมเข้าเส้น",
    bonusAction: { name: "Final Leg", type: "PASSIVE", effect: "เร่งเฮือกสุดท้ายแรงขึ้น", color: "blue" }
  },
  {
    id: 't24', name: "Team Bonding", type: "UTILITY", stats: { guts: 20, wisdom: 20 }, desc: "สร้างสัมพันธ์ทีม",
    bonusAction: { name: "Encourage", type: "BUFF", effect: "บัฟเพื่อนร่วมทีม", color: "green" }
  },
  {
    id: 't25', name: "Power Nap", type: "UTILITY", stats: { stamina: 10 }, desc: "งีบหลับ",
    bonusAction: { name: "Full Recovery", type: "HEAL", effect: "Stamina เต็ม (ใช้ยาก)", color: "gold" }
  },

  // ==========================================
  // TYPE D: GAMBLER (ทอง - เสี่ยงดวง)
  // ==========================================
  {
    id: 't26', name: "Dice of Destiny", type: "GAMBLE", stats: { text: "All +/- 30" }, desc: "ทอยเต๋า > 3 เพื่อรับรางวัล",
    gamble: { minRoll: 4, winStats: { speed: 30, stamina: 30, power: 30, guts: 30, wisdom: 30 }, loseStats: { speed: -10, stamina: -10, power: -10, guts: -10, wisdom: -10 } }
  },
  {
    id: 't27', name: "Coin Flip", type: "GAMBLE", stats: { text: "Speed +100 / 0" }, desc: "โยนเหรียญเสี่ยงทาย",
    gamble: { minRoll: 4, winStats: { speed: 100 }, loseStats: {} } // 4-6 (50%) ถือเป็นหัว
  },
  {
    id: 't28', name: "Joker's Trick", type: "GAMBLE", stats: { text: "Random +150 / -50" }, desc: "ตลกเสี่ยงดวง",
    gamble: { minRoll: 3, winStats: { wisdom: 150 }, loseStats: { wisdom: -50 } }
  },
  {
    id: 't29', name: "Rocket or Crash", type: "GAMBLE", stats: { text: "Speed +200 / Stam -100" }, desc: "วัดใจ 20%",
    gamble: { minRoll: 6, winStats: { speed: 200 }, loseStats: { stamina: -100 } }
  },
  {
    id: 't30', name: "Lazy Genius", type: "GAMBLE", stats: { text: "Wisdom +200 / Sleep" }, desc: "Gold Ship Special",
    gamble: { minRoll: 6, winStats: { wisdom: 200 }, loseStats: {} }
  }
];