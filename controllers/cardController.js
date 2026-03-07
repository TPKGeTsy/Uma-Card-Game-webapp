// 📇 ส่วนจัดการข้อมูลการ์ด (Card Management)
const Card = require('../models/card');

/**
 * 🔍 ฟังก์ชันดึงรายการการ์ดทั้งหมด (Get All Cards)
 * ใช้สำหรับแสดงรายการการ์ดที่มีทั้งหมดในระบบ (เช่น ในหน้า Wiki)
 */
exports.getCards = async (req, res) => {
  try {
    const cards = await Card.find();
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * 🌱 ฟังก์ชันตั้งค่าข้อมูลเริ่มต้น (Seed Database)
 * ใช้สำหรับลบข้อมูลการ์ดเก่าและสร้างข้อมูลการ์ดพื้นฐานขึ้นมาใหม่ (ม้า และ การ์ดฝึก)
 */
exports.seedDatabase = async (req, res) => {
  try {
    // ข้อมูลเริ่มต้นสำหรับทดสอบระบบ
    const initialCards = [
      {
        name: "Silent Suzuka",
        type: "HORSE",
        rarity: "SSR",
        stats: { speed: 9, stamina: 6 },
        skill: { type: "BOOST_SPEED", value: 3 }
      },
      {
        name: "Special Week",
        type: "HORSE",
        rarity: "SR",
        stats: { speed: 7, stamina: 8 },
        skill: { type: "BOOST_SPEED", value: 2 }
      },
      {
        name: "Gold Ship",
        type: "HORSE",
        rarity: "SSR",
        stats: { speed: 5, stamina: 9 },
        skill: { type: "DEBUFF_OPPONENT", value: -2 }
      },
      {
        name: "วิ่งลากยาง",
        type: "TRAINING",
        rarity: "R",
        effect: { type: "BOOST_SPEED", value: 2 }
      },
      {
        name: "แครอทเกรดเอ",
        type: "TRAINING",
        rarity: "R",
        effect: { type: "RECOVER_STAMINA", value: 2 }
      },
      {
        name: "รองเท้าเทพ",
        type: "TRAINING",
        rarity: "SSR",
        effect: { type: "BOOST_SPEED", value: 4 }
      }
    ];

    // ล้างข้อมูลเดิมและเพิ่มข้อมูลใหม่ (Batch Insert)
    await Card.deleteMany({});
    await Card.insertMany(initialCards);

    res.json({ 
        message: "✅ Seed Data สำเร็จ! เพิ่มการ์ดลง Database เรียบร้อย", 
        count: initialCards.length 
    });

  } catch (error) {
    res.status(500).json({ error: "เกิดข้อผิดพลาด: " + error.message });
  }
};