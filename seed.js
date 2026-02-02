const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); 
const Card = require('./models/card'); 

mongoose.connect('mongodb://127.0.0.1:27017/uma-card-game')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error(err));

const seedData = async () => {
    try {
        // 1. ล้างกระดาน
        await Card.deleteMany({});
        await User.deleteMany({});
        console.log("🧹 ล้างข้อมูลเก่าเรียบร้อย...");


        // ตัวอย่างการ์ดชุดใหม่ (New Meta)
const newActionCards = [
    // --- 🟢 Lane / Positioning (สำคัญมากในระบบใหม่) ---
    { 
        name: "Side Step", type: "ACTION", effectType: "LANE_CHANGE", 
        value: 0, desc: "เปลี่ยนเลนหลบสิ่งกีดขวางทันที", rarity: "N" 
    },
    { 
        name: "Overtake Mode", type: "ACTION", effectType: "LANE_CHANGE_BUFF", 
        value: 20, desc: "เปลี่ยนเลน + เร่งความเร็วชั่วขณะ", rarity: "SR" 
    },

    // --- 🔴 Speed / Accel (มีเงื่อนไข) ---
    { 
        name: "Slipstream", type: "ACTION", effectType: "SPEED", 
        value: 40, condition: "BEHIND_CLOSE", desc: "เร่งความเร็วเมื่อจี้ตูด (ระยะ < 5m)", rarity: "R" 
    },
    { 
        name: "Open Road", type: "ACTION", effectType: "SPEED", 
        value: 60, condition: "NO_BLOCK", desc: "วิ่งเร็วขึ้นเมื่อทางข้างหน้าโล่ง", rarity: "SR" 
    },

    // --- 💚 Heal (จำเป็นเพื่อความอยู่รอด) ---
    { 
        name: "Deep Breath", type: "ACTION", effectType: "HEAL", 
        value: 200, condition: "ANY", desc: "ฟื้นฟู Stamina ปานกลาง", rarity: "N" 
    },
    { 
        name: "Second Wind", type: "ACTION", effectType: "HEAL", 
        value: 400, condition: "STAMINA_RED", desc: "ฟื้นฟูมหาศาลเมื่อ Stamina ใกล้หมด", rarity: "SSR" 
    }
];

        // ==========================================
        // 2. สร้างการ์ด (Card Database)
        // ==========================================
        
        // 🐴 อัปเดต: เพิ่ม Power, Guts, Wisdom ให้ครบ 5 ค่า
        const horses = [
            { 
                name: "Special Week", rarity: "SR", type: "HORSE", 
                stats: { speed: 650, stamina: 700, power: 650, guts: 800, wisdom: 600 }, // พระเอกสายใจสู้
                image: "/images/uma/special_week.png" 
            },
            { 
                name: "Silence Suzuka", rarity: "SSR", type: "HORSE", 
                stats: { speed: 900, stamina: 500, power: 600, guts: 550, wisdom: 700 }, // เจ้าแม่สปีดต้นเกม
                image: "/images/uma/silence_suzuka.png" 
            },
            { 
                name: "Tokai Teio", rarity: "SSR", type: "HORSE", 
                stats: { speed: 780, stamina: 600, power: 750, guts: 700, wisdom: 800 }, // อัจฉริยะ (Wisdom สูง)
                image: "/images/uma/tokai_teio.png" 
            },
            { 
                name: "Oguri Cap", rarity: "SR", type: "HORSE", 
                stats: { speed: 700, stamina: 800, power: 850, guts: 750, wisdom: 600 }, // สายพลังและอึด
                image: "/images/uma/oguri_cap.png" 
            },
            { 
                name: "Gold Ship", rarity: "SR", type: "HORSE", 
                stats: { speed: 600, stamina: 950, power: 900, guts: 600, wisdom: 350 }, // แรงเยอะ อึดจัด แต่ติงต๊อง (Wisdom ต่ำ)
                image: "/images/uma/Goldship.jpg" 
            },
            { 
                name: "Vodka", rarity: "R", type: "HORSE", 
                stats: { speed: 720, stamina: 550, power: 800, guts: 600, wisdom: 550 }, // สาย Power
                image: "/images/uma/vodka.png" 
            },
            { 
                name: "Daiwa Scarlet", rarity: "R", type: "HORSE", 
                stats: { speed: 750, stamina: 600, power: 700, guts: 750, wisdom: 700 }, // สมดุล เก่งรอบด้าน
                image: "/images/uma/daiwa_scarlet.png" 
            },
            { 
                name: "Grass Wonder", rarity: "SR", type: "HORSE", 
                stats: { speed: 680, stamina: 750, power: 780, guts: 800, wisdom: 650 }, 
                image: "/images/uma/grass_wonder.png" 
            },
            { 
                name: "El Condor Pasa", rarity: "SR", type: "HORSE", 
                stats: { speed: 750, stamina: 650, power: 750, guts: 800, wisdom: 700 }, 
                image: "/images/uma/el_condor_pasa.png" 
            },
            { 
                name: "Haru Urara", rarity: "N", type: "HORSE", 
                stats: { speed: 400, stamina: 999, power: 300, guts: 999, wisdom: 300 }, // วิ่งช้าแต่ใจสู้เกินร้อย (Infinite Guts/Stamina)
                image: "/images/uma/haru_urara.png" 
            },
            { 
                name: "Gentildonna", rarity: "SSR", type: "HORSE", 
                stats: { speed: 800, stamina: 800, power: 950, guts: 700, wisdom: 650 }, // กอริลล่าสาว Power เวอร์วัง
                image: "/images/uma/gentildonna.png",
            },
            { 
                name: "T.M. Opera O", rarity: "SSR", type: "HORSE", 
                stats: { speed: 750, stamina: 900, power: 750, guts: 850, wisdom: 800 }, // ราชาโอเปร่า Stat สมดุลและสูงทุกค่า
                image: "/images/uma/tm_opera_o.png",
            }
        ];


        const actions = [
            // ==========================================
            // 🟢 START & POSITIONING (ช่วงต้นเกม / จัดระเบียบ)
            // ==========================================
            { 
                name: "Rocket Start", 
                type: "ACTION", 
                rarity: "SR", 
                value: 80, 
                effectType: "SPEED_BURST", 
                condition: "START_ONLY", // ใช้ได้แค่ 5 วินาทีแรก
                desc: "ออกตัวพุ่งนำทันทีเมื่อเริ่มเกม",
                image: "/images/ActionCard/rocket_start.png" 
            },
            { 
                name: "Positioning", 
                type: "ACTION", 
                rarity: "N", 
                value: 30, 
                effectType: "PASSIVE", 
                condition: "BLOCKED", // ใช้ได้เมื่อโดนบัง
                desc: "ขยับหาเลนว่างโดยอัตโนมัติ",
                image: "/images/ActionCard/positioning.png" 
            },
            { 
                name: "Pace Keeper", 
                type: "ACTION", 
                rarity: "N", 
                value: 20, 
                effectType: "STAMINA_SAVE", 
                condition: "MID_GAME", 
                desc: "รักษาระดับการใช้พลังงาน (ลด Stamina Drain)",
                image: "/images/ActionCard/pace_keeper.png" 
            },

            // ==========================================
            // 🔵 CORNER SKILLS (ใช้เมื่อเข้าโค้ง)
            // ==========================================
            { 
                name: "Corner Master", 
                type: "ACTION", 
                rarity: "SR", 
                value: 50, 
                effectType: "SPEED", 
                condition: "CORNER", // ใช้ได้เฉพาะในโค้ง
                desc: "เร่งความเร็วในทางโค้งโดยไม่หลุดเลน",
                image: "/images/ActionCard/corner_master.png" 
            },
            { 
                name: "Inner Drift", 
                type: "ACTION", 
                rarity: "R", 
                value: 40, 
                effectType: "SPEED", 
                condition: "CORNER",
                desc: "เสียบวงในเพื่อแซงทางโค้ง",
                image: "/images/ActionCard/drift.png" 
            },

            // ==========================================
            // 💨 STRAIGHT & UPHILL (ทางตรง / ขึ้นเนิน)
            // ==========================================
            { 
                name: "Hayate Rush", 
                type: "ACTION", 
                rarity: "SR", 
                value: 60, 
                effectType: "SPEED", 
                condition: "STRAIGHT", // ใช้ได้เฉพาะทางตรง
                desc: "ระเบิดความเร็วสายลมในทางตรง",
                image: "/images/ActionCard/hayate.png" 
            },
            { 
                name: "Mountain King", 
                type: "ACTION", 
                rarity: "R", 
                value: 50, 
                effectType: "POWER", 
                condition: "UPHILL", // ใช้ได้เฉพาะตอนขึ้นเนิน
                desc: "วิ่งขึ้นเนินโดยความเร็วไม่ตก",
                image: "/images/ActionCard/mountain.png" 
            },
            { 
                name: "Slipstream", 
                type: "ACTION", 
                rarity: "N", 
                value: 30, 
                effectType: "SPEED", 
                condition: "BEHIND_10M", // ใช้ได้เมื่อตามหลังคนอื่น < 10m
                desc: "อาศัยลมดูดจากคนหน้าเพื่อเร่งแซง",
                image: "/images/ActionCard/slipstream.png" 
            },

            // ==========================================
            // 🔴 ATTACK & DEBUFF (แกล้งคนอื่น)
            // ==========================================
            { 
                name: "Glare (จ้องตา)", 
                type: "ACTION", 
                rarity: "R", 
                value: 100, 
                effectType: "DEBUFF_STAMINA", 
                condition: "SIDE_BY_SIDE", // ใช้ได้เมื่อตีคู่
                desc: "ทำลายสมาธิคู่แข่ง ลด Stamina เป้าหมาย",
                image: "/images/ActionCard/glare.png" 
            },
            { 
                name: "Block", 
                type: "ACTION", 
                rarity: "R", 
                value: 50, 
                effectType: "DEBUFF_SPEED", 
                condition: "LEADING", // ใช้ได้เมื่อเราอยู่หน้า
                desc: "ขวางทางวิ่ง ลดความเร็วคนข้างหลัง",
                image: "/images/ActionCard/block.png" 
            },
            { 
                name: "Dust Cloud", 
                type: "ACTION", 
                rarity: "N", 
                value: 30, 
                effectType: "DEBUFF_SPEED", 
                condition: "ANY",
                desc: "เตะฝุ่นใส่คนข้างหลังเล็กน้อย",
                image: "/images/ActionCard/dust.png" 
            },

            // ==========================================
            // 💚 RECOVERY (ฟื้นฟู)
            // ==========================================
            { 
                name: "Deep Breath", 
                type: "ACTION", 
                rarity: "R", 
                value: 200, 
                effectType: "HEAL", 
                condition: "STAMINA_LOW", // ใช้ได้เมื่อ Stamina < 50%
                desc: "สูดหายใจลึก ฟื้นฟู Stamina ปานกลาง",
                image: "/images/ActionCard/breath.png" 
            },
            { 
                name: "Maestro", 
                type: "ACTION", 
                rarity: "SSR", 
                value: 400, 
                effectType: "HEAL", 
                condition: "CORNER", // ฮีลเทพ ใช้ได้เฉพาะทางโค้ง
                desc: "ฟื้นฟู Stamina มหาศาลด้วยเทคนิคชั้นสูง",
                image: "/images/ActionCard/maestro.png" 
            },
            { 
                name: "Carrot Snack", 
                type: "ACTION", 
                rarity: "N", 
                value: 100, 
                effectType: "HEAL", 
                condition: "ANY",
                desc: "กินแครอทเติมพลังเล็กน้อย",
                image: "/images/ActionCard/carrot.png" 
            },

            // ==========================================
            // 🔥 LAST SPURT (ช่วงสุดท้าย)
            // ==========================================
            { 
                name: "Full Throttle", 
                type: "ACTION", 
                rarity: "SR", 
                value: 100, 
                effectType: "SPEED", 
                condition: "LAST_SPURT", // 400m สุดท้าย
                desc: "เร่งความเร็วเต็มสูบเข้าเส้นชัย",
                image: "/images/ActionCard/full_throttle.png" 
            },
            { 
                name: "Never Give Up", 
                type: "ACTION", 
                rarity: "R", 
                value: 50, 
                effectType: "GUTS", 
                condition: "LAST_SPURT",
                desc: "รีดพลังเฮือกสุดท้ายแม้ Stamina หมด",
                image: "/images/ActionCard/never_give_up.png" 
            },
            
            // 👇 ใบเดิมที่คุณเคยใส่ไว้ (บัฟทีม)
            { 
                name: "Team Shout", 
                type: "ACTION", 
                rarity: "SR", 
                value: 30, 
                effectType: "BUFF_ALL", 
                condition: "ANY", 
                desc: "ตะโกนเชียร์ บัฟความเร็วทั้งทีม", 
                image: "/images/ActionCard/HeartofSpirit.png" 
            }
        ];

        // 🏋️‍♂️ อัปเดต: สร้างการ์ด Training ให้ครบ 5 Stat (วนลูป)
        const training = [];
        const statTypes = ['SPEED', 'STAMINA', 'POWER', 'GUTS', 'WISDOM'];
        
        for(let i=0; i<15; i++) { // เพิ่มจำนวนการ์ดฝึกซ้อมนิดหน่อยเป็น 15 ใบ
            const currentStat = statTypes[i % 5]; // วนลูป 5 ค่าพลัง
            training.push({
                name: `${currentStat} Training Lv.${Math.ceil((i+1)/5)}`,
                type: "TRAINING",
                rarity: i % 2 === 0 ? "N" : "R",
                value: 30 + (i*5),
                statType: currentStat,
                condition: `เพิ่มค่า ${currentStat}`,
                image: `https://placehold.co/300x200/gray/white?text=${currentStat}`
            });
        }

        const allCards = [...horses, ...actions, ...training, ...newActionCards];
        const createdCards = await Card.insertMany(allCards);
        console.log(`✅ สร้างการ์ดเสร็จสิ้น: ${createdCards.length} ใบ`);

        // ==========================================
        // 3. สร้าง User เทพ (a2)
        // ==========================================
        
        const fullInventory = createdCards.map(c => ({
            cardId: c._id,
            obtainedAt: new Date()
        }));

        const horseCards = createdCards.filter(c => c.type === 'HORSE');
        const defaultTeam = horseCards.slice(0, 3).map(c => c._id);

        const actionCards = createdCards.filter(c => c.type === 'ACTION');
        const defaultActionDeck = actionCards.slice(0, 10).map(c => c._id);

        const superUser = new User({
            username: 'a4',
            
            // ✅ แก้ตรงนี้ครับ! ใส่ string 'a3' ไปเลย (ไม่ต้องใช้ตัวแปร hashedPassword แล้ว)
            password: 'a4', 
            
            coins: 1000000,
            isAdmin: true,
            inventory: fullInventory,
            decks: defaultTeam,
            savedDecks: [{
                name: "God Deck",
                cards: defaultActionDeck
            }],
            activeDeckIndex: 0
        });

        await superUser.save();
        console.log(`
        🎉 สร้าง User: a3 เรียบร้อย! 
        🔑 Pass: a3
        💰 Coins: 1,000,000
        🎒 Inventory: ครบทุกใบ (พร้อมม้า 5 Stats)
        `);

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

seedData();