const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // เช็ค path
const Card = require('./models/card'); // เช็ค path (ระวังตัวเล็ก/ใหญ่)

mongoose.connect('mongodb://127.0.0.1:27017/uma-card-game')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error(err));

const seedData = async () => {
    try {
        // 1. ล้างกระดาน
        await Card.deleteMany({});
        await User.deleteMany({});
        console.log("🧹 ล้างข้อมูลเก่าเรียบร้อย...");

        // ==========================================
        // 2. สร้างการ์ด (Card Database)
        // ==========================================
        const horses = [
            { name: "Special Week", rarity: "SR", type: "HORSE", stats: { speed: 650, stamina: 700 }, image: "https://placehold.co/300x400/e91e63/white?text=Special+Week" },
            { name: "Silence Suzuka", rarity: "SSR", type: "HORSE", stats: { speed: 850, stamina: 500 }, image: "https://placehold.co/300x400/2ecc71/white?text=Silence+Suzuka" },
            { name: "Tokai Teio", rarity: "SSR", type: "HORSE", stats: { speed: 780, stamina: 600 }, image: "https://placehold.co/300x400/3498db/white?text=Tokai+Teio" },
            { name: "Oguri Cap", rarity: "SR", type: "HORSE", stats: { speed: 700, stamina: 800 }, image: "https://placehold.co/300x400/9b59b6/white?text=Oguri+Cap" },
            { name: "Gold Ship", rarity: "SR", type: "HORSE", stats: { speed: 600, stamina: 950 }, image: "https://placehold.co/300x400/f1c40f/white?text=Gold+Ship" },
            { name: "Vodka", rarity: "R", type: "HORSE", stats: { speed: 720, stamina: 550 }, image: "https://placehold.co/300x400/e67e22/white?text=Vodka" },
            { name: "Daiwa Scarlet", rarity: "R", type: "HORSE", stats: { speed: 710, stamina: 560 }, image: "https://placehold.co/300x400/e74c3c/white?text=Daiwa+Scarlet" },
            { name: "Grass Wonder", rarity: "SR", type: "HORSE", stats: { speed: 680, stamina: 750 }, image: "https://placehold.co/300x400/1abc9c/white?text=Grass+Wonder" },
            { name: "El Condor Pasa", rarity: "SR", type: "HORSE", stats: { speed: 750, stamina: 650 }, image: "https://placehold.co/300x400/d35400/white?text=El+Condor+Pasa" },
            { name: "Haru Urara", rarity: "N", type: "HORSE", stats: { speed: 400, stamina: 999 }, image: "https://placehold.co/300x400/ff9ff3/white?text=Haru+Urara" }
        ];

        const actions = [
            { name: "Whip Lash", type: "ACTION", rarity: "R", value: 50, effectType: "SPEED", condition: "เร่งความเร็วระยะสั้น", image: "https://placehold.co/300x200/333/white?text=Whip" },
            { name: "Last Spurt", type: "ACTION", rarity: "SR", value: 100, effectType: "SPEED", condition: "ใช้ได้เฉพาะช่วงท้าย", image: "https://placehold.co/300x200/333/gold?text=Last+Spurt" },
            { name: "Positioning", type: "ACTION", rarity: "N", value: 30, effectType: "SPEED", condition: "หาตำแหน่งวิ่ง", image: "https://placehold.co/300x200/ccc/black?text=Positioning" },
            { name: "Carrot Snack", type: "ACTION", rarity: "N", value: 100, effectType: "HEAL", condition: "ฟื้นฟูเล็กน้อย", image: "https://placehold.co/300x200/e67e22/white?text=Carrot" },
            { name: "Energy Drink", type: "ACTION", rarity: "R", value: 250, effectType: "HEAL", condition: "ฟื้นฟูปานกลาง", image: "https://placehold.co/300x200/f1c40f/black?text=Energy+Drink" },
            { name: "Team Shout", type: "ACTION", rarity: "SR", value: 30, effectType: "BUFF_ALL", condition: "บัฟความเร็วทั้งทีม", image: "https://placehold.co/300x200/9b59b6/white?text=Team+Shout" },
            { name: "Strategy Meeting", type: "ACTION", rarity: "R", value: 200, effectType: "HEAL_ALL", condition: "ฮีลทั้งทีม", image: "https://placehold.co/300x200/8e44ad/white?text=Meeting" },
            { name: "Focus", type: "ACTION", rarity: "N", value: 40, effectType: "SPEED", condition: "ตั้งสมาธิ", image: "https://placehold.co/300x200/teal/white?text=Focus" },
            { name: "Sprint", type: "ACTION", rarity: "N", value: 45, effectType: "SPEED", condition: "วิ่งเร็ว", image: "https://placehold.co/300x200/teal/white?text=Sprint" },
            { name: "Power Bar", type: "ACTION", rarity: "N", value: 120, effectType: "HEAL", condition: "กินขนม", image: "https://placehold.co/300x200/orange/white?text=Bar" }
        ];

        const training = [];
        for(let i=0; i<12; i++) {
            training.push({
                name: `Training Session ${i+1}`,
                type: "TRAINING",
                rarity: i % 2 === 0 ? "N" : "R",
                value: 400 + (i*30),
                statType: i % 2 === 0 ? "SPEED" : "STAMINA",
                condition: `ชนะถ้า Stat > ${400 + (i*30)}`,
                image: `https://placehold.co/300x200/gray/white?text=Training+${i+1}`
            });
        }

        const allCards = [...horses, ...actions, ...training];
        const createdCards = await Card.insertMany(allCards);
        console.log(`✅ สร้างการ์ดเสร็จสิ้น: ${createdCards.length} ใบ`);

        // ==========================================
        // 3. สร้าง User เทพ (a2)
        // ==========================================
        
        // แฮชรหัสผ่าน a2 (รหัส: a2)
        const hashedPassword = await bcrypt.hash('a2', 10);
        
        // ดึงการ์ดที่เพิ่งสร้างมาใส่กระเป๋า a2 ให้หมด!
        const fullInventory = createdCards.map(c => ({
            cardId: c._id,
            obtainedAt: new Date()
        }));

        // ดึงม้า 3 ตัวแรก มาจัดทีมให้เลย
        const horseCards = createdCards.filter(c => c.type === 'HORSE');
        const defaultTeam = horseCards.slice(0, 3).map(c => c._id);

        // ดึง Action 10 ใบ มาจัด Deck ให้เลย
        const actionCards = createdCards.filter(c => c.type === 'ACTION');
        const defaultActionDeck = actionCards.slice(0, 10).map(c => c._id);

        const superUser = new User({
            username: 'a2',
            password: hashedPassword,
            coins: 1000000, // รวยจัด
            isAdmin: true,
            inventory: fullInventory, // ของครบ
            decks: defaultTeam, // ทีมพร้อม
            savedDecks: [{
                name: "God Deck",
                cards: defaultActionDeck // Action Deck พร้อม
            }],
            activeDeckIndex: 0
        });

        await superUser.save();
        console.log(`
        🎉 สร้าง User: a2 เรียบร้อย! 
        🔑 Pass: a2
        💰 Coins: 1,000,000
        🎒 Inventory: ครบทุกใบ
        `);

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

seedData();