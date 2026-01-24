// คำนวณผลกระทบสภาพอากาศ (Hidden Gimmick)
export const calculateWeatherEffect = (weather, horse) => {
    let speedMult = 1.0;
    let staminaDrainMult = 1.0;
    let logs = [];

    const stats = horse.stats || { speed: 600, stamina: 600, power: 600, guts: 600, wisdom: 600 };

    if (weather === 'Rainy') {
        // ฝนตก: กินแรง x1.2
        if (stats.guts > 600) {
            logs.push(`${horse.name} ใจสู้! ไม่กลัวฝน (Guts)`);
            staminaDrainMult = 1.05; // ลดผลกระทบ
        } else {
            staminaDrainMult = 1.2;
            logs.push(`${horse.name} เปียกปอน.. (Stamina Drain x1.2)`);
        }
    } else if (weather === 'Snowy') {
        // หิมะ: วิ่งช้า x0.9
        if (stats.power > 700) {
            logs.push(`${horse.name} พลังขาโหด! ลุยหิมะสบาย (Power)`);
        } else {
            speedMult = 0.9;
            logs.push(`${horse.name} ลื่นหิมะ.. (Speed x0.9)`);
        }
    }

    return { speedMult, staminaDrainMult, logs };
};

// คำนวณ Event Trigger (RNG + Stat Check)
export const processRaceEvent = (event, horse, currentStamina) => {
    // 🎲 RNG: มีโอกาส 30% ที่ Event จะไม่เกิดกับตัวนี้ (ดวง)
    if (Math.random() > 0.7) return { triggered: false, msg: "" };

    const stats = horse.stats;
    let effect = {};
    let msg = "";

    if (event.type === "CHECK") {
        if (event.statCheck === "POWER") {
            if (stats.power < event.threshold) {
                effect.speed = -50; // โดนลดความเร็ว
                msg = `❌ ${event.name}: Power ไม่พอ! โดนเนินเล่นงาน`;
            } else {
                msg = `✅ ${event.name}: พลังขาเหลือเฟือ! วิ่งฉิว`;
            }
        } else if (event.statCheck === "STAMINA") {
            if (currentStamina < event.threshold) {
                effect.speed = -100; // ขาตาย
                msg = `💀 ${event.name}: หมดแรงข้าวต้ม...`;
            } else {
                msg = `🔥 ${event.name}: ยังฟิตเปรี้ยะ!`;
            }
        }
    }

    return { triggered: true, msg, effect };
};