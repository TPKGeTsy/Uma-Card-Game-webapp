// 🏁 ส่วนจัดการตรรกะของเกม (Race & Simulation Logic)
const User = require('../models/User');
const Track = require('../models/Track');
const ActionCard = require('../models/ActionCard');
const TrainingCard = require('../models/TrainingCard');

/**
 * 🃏 ฟังก์ชันดึงรายการการ์ดสำหรับ Draft (Draft Pool)
 * 1. ดึงข้อมูลสนามแข่งเพื่อคำนวณจำนวนการ์ดที่เลือกได้ (Draft Quota)
 * 2. สุ่มการ์ด Training และ Action จาก Database ขึ้นมาเป็นตัวเลือกให้ผู้เล่น
 */
exports.getDraftPool = async (req, res) => {
    try {
        const track = await Track.findOne(); 
        if (!track) return res.status(404).json({ message: "ไม่พบสนามแข่ง" });

        // คำนวณจำนวนการ์ดที่ผู้เล่นสามารถเลือกได้ตามความยาวสนาม
        let draftQuota = (track.segments ? track.segments.length : 5) - 3;
        if (draftQuota < 1) draftQuota = 1;

        // สุ่มดึงการ์ดประเภทต่างๆ ขึ้นมาเป็นชุดตัวเลือก (Pool)
        const trainings = await TrainingCard.find();
        const actions = await ActionCard.find();

        const pool = [
            ...trainings.sort(() => 0.5 - Math.random()).slice(0, 8),
            ...actions.sort(() => 0.5 - Math.random()).slice(0, 8)
        ];
        const finalPool = pool.sort(() => 0.5 - Math.random()).slice(0, 12);
        
        res.json({
            pool: finalPool,
            draftQuota: draftQuota, 
            trackName: track.name
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * 🏎️ ฟังก์ชันจำลองการแข่งขันแบบละเอียด (Race Simulation)
 * เป็นหัวใจหลักของเกมที่มีการคำนวณ Physics และการใช้ Skill ตามจุดต่างๆ ของสนาม
 */
exports.simulateRace = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId).populate('decks');
        const track = await Track.findOne();

        if (!user.decks || user.decks.length !== 3) {
            return res.status(400).json({ message: "กรุณาจัดทีมม้าให้ครบ 3 ตัวก่อนครับ!" });
        }

        // เตรียมชุดการ์ดที่ผู้เล่นเลือก (Drafted Cards)
        let myTrainings = [];
        let draftedActions = [];
        if (req.body.trainingCardIds && req.body.trainingCardIds.length > 0) {
            const ids = req.body.trainingCardIds;
            myTrainings = await TrainingCard.find({ '_id': { $in: ids } });
            draftedActions = await ActionCard.find({ '_id': { $in: ids } });
        }

        const baseActions = await ActionCard.find().limit(5); 
        const myActionDeck = [...baseActions, ...draftedActions];

        // --- เริ่มการคำนวณการวิ่งรายตัว ---
        const teamResult = user.decks.map((horse, index) => {
            let log = [`🏁 ม้าตัวที่ ${index + 1}: ${horse.name}`];
            
            // 1. คำนวณพลังพื้นฐานรวมกับการ์ดฝึก (Training)
            let speed = horse.stats.speed;
            let stamina = horse.stats.stamina;
            myTrainings.forEach(card => {
                if (card.statType === 'SPEED') speed += card.value;
                if (card.statType === 'STAMINA') stamina += card.value;
            });

            let currentTime = 0;
            let currentStamina = stamina * 10; 

            // 2. จำลองการวิ่งทีละจุดของสนาม (Segments)
            track.segments.forEach((segment, segIndex) => {
                let segmentLog = `📍 จุดที่ ${segIndex + 1}: ${segment.type}`;
                let speedModifier = 1.0; 

                // เช็คการใช้การ์ด Skill (Action Card)
                const luckyCard = myActionDeck[Math.floor(Math.random() * myActionDeck.length)];
                if (luckyCard && (luckyCard.condition === 'ANY' || luckyCard.condition === segment.type)) {
                    if (luckyCard.effectType === 'SPEED_BOOST') speedModifier += (luckyCard.value / 100);
                    if (luckyCard.effectType === 'STAMINA_HEAL') currentStamina += luckyCard.value;
                }

                // คำนวณการใช้แรง (Stamina) ตามสภาพภูมิประเทศ
                let staminaCost = segment.distance * 0.1; 
                if (segment.type === 'SLOPE') staminaCost *= 2.5; 
                currentStamina -= staminaCost;

                // หากแรงหมด ความเร็วจะตกฮวบ
                if (currentStamina <= 0) speedModifier *= 0.2;

                // คำนวณเวลาที่ใช้ในจุดนี้ (Physics: Time = Distance / Speed)
                let timeTaken = segment.distance / (speed * speedModifier);
                currentTime += timeTaken;
            });

            return { horseName: horse.name, finalTime: currentTime.toFixed(2), logs: log };
        });

        // 3. ตัดสินผลแพ้ชนะโดยเทียบกับเวลามาตรฐาน (Bot Time)
        const botTime = (track.distance * 3) / 15; 
        const myTotalTime = teamResult.reduce((acc, curr) => acc + parseFloat(curr.finalTime), 0);
        const result = myTotalTime < botTime ? "WIN" : "LOSE";

        // แจกรางวัลและบันทึกลง Database
        const reward = result === "WIN" ? 1000 : 100;
        user.coins += reward;
        await user.save();

        res.json({
            result: result,
            track: track.name,
            reward: reward,
            details: teamResult
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};