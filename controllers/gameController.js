const User = require('../models/User');
const Track = require('../models/Track');
const ActionCard = require('../models/ActionCard');
const TrainingCard = require('../models/TrainingCard');

// 1. ฟังก์ชันขอการ์ด Draft (แก้ใหม่: คำนวณ Quota ตามจำนวนจุดในสนาม)
exports.getDraftPool = async (req, res) => {
    try {
        // ดึงสนาม (สมมติเอาตัวแรก หรือจะสุ่มก็ได้)
        const track = await Track.findOne(); 

        if (!track) return res.status(404).json({ message: "ไม่พบสนามแข่ง (กรุณาเพิ่มสนามใน Admin)" });

        // --- 🧠 Logic คำนวณโควต้า Draft ---
        // สูตร: จำนวน Segment - 3 (ต่ำสุดให้เลือกได้ 1 ใบ กันติดลบ)
        let draftQuota = (track.segments ? track.segments.length : 5) - 3;
        if (draftQuota < 1) draftQuota = 1;

        // ดึงการ์ดมาให้เลือก (Pool)
        const trainings = await TrainingCard.find();
        const actions = await ActionCard.find();

        const pool = [
            ...trainings.sort(() => 0.5 - Math.random()).slice(0, 8),
            ...actions.sort(() => 0.5 - Math.random()).slice(0, 8)
        ];
        const finalPool = pool.sort(() => 0.5 - Math.random()).slice(0, 12);
        
        // ส่งข้อมูลกลับไป
        res.json({
            pool: finalPool,
            draftQuota: draftQuota, 
            trackName: track.name
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. ฟังก์ชันจำลองการวิ่ง (Simulation Logic)
exports.simulateRace = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // ดึงข้อมูล User และจัดทีม
        const user = await User.findById(userId).populate('decks');
        const track = await Track.findOne(); // ดึงสนามจริง

        if (!user.decks || user.decks.length !== 3) {
            return res.status(400).json({ message: "กรุณาจัดทีมม้าให้ครบ 3 ตัวก่อนครับ!" });
        }
        if (!track) {
            return res.status(500).json({ message: "ไม่พบสนามแข่ง" });
        }

        // --- PHASE 1: PROCESS DRAFTED CARDS (เตรียมการ์ดที่ผู้เล่นเลือกมา) ---
        let myTrainings = [];
        let draftedActions = [];

        // เช็คว่ามีการ์ดส่งมาไหม
        if (req.body.trainingCardIds && req.body.trainingCardIds.length > 0) {
            const ids = req.body.trainingCardIds;
            myTrainings = await TrainingCard.find({ '_id': { $in: ids } });
            draftedActions = await ActionCard.find({ '_id': { $in: ids } });
        } else {
            // Auto Mode (เผื่อไม่ได้เลือกมา)
            myTrainings = (await TrainingCard.find()).slice(0, 3);
            draftedActions = (await ActionCard.find()).slice(0, 1);
        }

        // รวมการ์ด Action (Deck พื้นฐาน 5 ใบ + ที่ Draft มา)
        const baseActions = await ActionCard.find().limit(5); 
        const myActionDeck = [...baseActions, ...draftedActions];

        // --- PHASE 2: RACE CALCULATION (เริ่มวิ่ง!) ---
        let totalTime = 0;

        const teamResult = user.decks.map((horse, index) => {
            let log = [`🏁 ม้าตัวที่ ${index + 1}: ${horse.name}`];
            
            // 2.1 คำนวณพลังต้น (Base + Training Cards)
            let speed = horse.stats.speed;
            let stamina = horse.stats.stamina;

            myTrainings.forEach(card => {
                if (card.statType === 'SPEED') speed += card.value;
                if (card.statType === 'STAMINA') stamina += card.value;
            });
            log.push(`📊 พลังสุทธิ -> Speed: ${speed}, Stamina: ${stamina}`);

            let currentTime = 0;
            let currentStamina = stamina * 10; 

            // ---------------------------------------------------------
            // 🚨 วนลูปตาม track.segments จริงๆ จาก Database
            // ---------------------------------------------------------
            track.segments.forEach((segment, segIndex) => {
                let segmentLog = `📍 จุดที่ ${segIndex + 1}: ${segment.type} (${segment.distance}m)`;
                let speedModifier = 1.0; 

                // --- Logic การใช้การ์ด ---
                const luckyCard = myActionDeck[Math.floor(Math.random() * myActionDeck.length)];
                if (luckyCard) {
                    let conditionMet = false;
                    if (luckyCard.condition === 'ANY') conditionMet = true;
                    // เทียบ condition กับ segment.type จริงๆ
                    if (luckyCard.condition === segment.type) conditionMet = true; 

                    if (conditionMet) {
                         if (luckyCard.effectType === 'SPEED_BOOST') {
                            speedModifier += (luckyCard.value / 100); 
                            segmentLog += ` 🔥 skill "${luckyCard.name}"!`;
                        }
                        if (luckyCard.effectType === 'STAMINA_HEAL') {
                            currentStamina += luckyCard.value;
                            segmentLog += ` 💚 skill "${luckyCard.name}"!`;
                        }
                    }
                }

                // --- Physics: คำนวณแรงที่ใช้ ---
                let staminaCost = segment.distance * 0.1; 
                if (segment.type === 'SLOPE') staminaCost *= 2.5; // เนินกินแรงมาก
                if (segment.type === 'CURVE') staminaCost *= 1.2; 
                
                currentStamina -= staminaCost;

                if (currentStamina <= 0) {
                    speedModifier *= 0.2; 
                    segmentLog += ` 💀 หมดแรง!`;
                }

                // คำนวณเวลา
                let timeTaken = segment.distance / (speed * speedModifier);
                currentTime += timeTaken;

                // เก็บ Log
                if (segmentLog.includes('skill') || segmentLog.includes('หมดแรง')) {
                     log.push(segmentLog);
                }
            });

            totalTime += currentTime;
            return {
                horseName: horse.name,
                finalTime: currentTime.toFixed(2),
                logs: log
            };
        }); // ปิด .map

        // --- PHASE 3: สรุปผล (ส่วนที่หายไป) ---
        // ตั้งเกณฑ์เวลาบอท (เช่น เฉลี่ย 100 วิ ต่อตัว x 3 = 300)
        // หรือคำนวณจากระยะทางสนามรวม หารด้วย Speed กลางๆ
        const totalDistance = track.distance * 3; 
        const standardSpeed = 15; // ความเร็วมาตรฐาน
        const botTime = totalDistance / standardSpeed; // เวลามาตรฐานที่ต้องทำลาย

        const myTotalTime = teamResult.reduce((acc, curr) => acc + parseFloat(curr.finalTime), 0);
        const result = myTotalTime < botTime ? "WIN" : "LOSE";

        // แจกรางวัล
        const reward = result === "WIN" ? 1000 : 100;
        user.coins += reward;
        await user.save();

        // ส่ง Response กลับ
        res.json({
            result: result,
            track: track.name,
            reward: reward,
            details: teamResult,
            myTrainings: myTrainings,
            myActionDeck: myActionDeck
        });

    } catch (error) { // ปิด try
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}; // ปิด function