const Card = require('../models/card');


// ... (ฟังก์ชัน seedDatabase อันเดิม อยู่ด้านบน) ...

// [เพิ่มใหม่] ฟังก์ชันดึงการ์ดทั้งหมด
exports.getCards = async (req, res) => {
  try {
    const cards = await Card.find(); // คำสั่งศักดิ์สิทธิ์: ไปหาการ์ดมาให้หมด!
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ฟังก์ชันสำหรับ Reset และใส่ข้อมูลการ์ดใหม่ (Seed)
exports.seedDatabase = async (req, res) => {
  try {
    // 1. ข้อมูลการ์ดที่จะใส่ (3 ม้า, 3 การ์ดฝึก)
    const initialCards = [
      // --- การ์ดม้า (Horse) ---
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
      // --- การ์ดฝึก (Training) ---
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

    // 2. ลบข้อมูลเก่าทิ้งก่อน (เพื่อไม่ให้ซ้ำ)
    await Card.deleteMany({});
    
    // 3. เพิ่มข้อมูลใหม่ลงไป
    await Card.insertMany(initialCards);

    // 4. แจ้งกลับว่าเสร็จแล้ว
    res.json({ 
        message: "✅ Seed Data สำเร็จ! เพิ่มการ์ดลง Database เรียบร้อย", 
        count: initialCards.length 
    });

  } catch (error) {
    res.status(500).json({ error: "เกิดข้อผิดพลาด: " + error.message });
  }
};