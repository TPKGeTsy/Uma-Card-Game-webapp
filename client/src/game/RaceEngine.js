// client/src/game/RaceEngine.js

const CONFIG = {
    BASE_SPEED: 18.0,
    MIN_SPEED: 3.0,       // เดินเต่าตอนหมดแรง
    
    // Stats Factors
    SPEED_CAP: 60,
    POWER_ACCEL: 1500,
    HILL_RESIST: 500,
    GUTS_BURST: 2000,
    WISDOM_SAVE: 3000,
    
    // 🔋 Stamina Config (ปรับให้โหดขึ้นสำหรับคนวิ่งไว)
    BASE_DRAIN: 5.0,        // ยืนเฉยๆ ก็กินแรง
    SPEED_PENALTY: 60.0,    // ยิ่งน้อย ยิ่งกินแรงตอนวิ่งไว (ปรับจาก 100 เหลือ 60 ให้ Runner เหนื่อย)
    RECOVERY_RATE: 5.0      // อัตราฟื้นฟู (เฉพาะคนดูดท้าย)
};

/**
 * @param {Boolean} isGlobalLastSpurt - มีใครสักคนเข้า Last Spurt หรือยัง?
 */
export const updateHorse = (horse, track, deltaTime = 0.1, leaderDistance = 0, secondPlaceDistance = 0, isGlobalLastSpurt = false) => {
    let next = { ...horse };
    if (next.finished) return next;

    const stats = next.finalStats;
    const progress = next.currentDistance / track.distance;
    
    // เงื่อนไขเข้า Last Spurt:
    // 1. ตัวเองถึงระยะ (66%)
    // 2. หรือ (สำหรับ Chaser/Betweener) มีคนอื่นเปิด Last Spurt แล้ว! (Panic Mode)
    const selfLastSpurt = progress >= 0.66;
    const panicMode = isGlobalLastSpurt && (horse.strategy === 'CHASER' || horse.strategy === 'BETWEENER');
    const isSpurtMode = selfLastSpurt || panicMode;

    const gapToLeader = leaderDistance - next.currentDistance;
    const leadGap = next.currentDistance - secondPlaceDistance;

    // ==========================================
    // 🎯 1. TARGET SPEED & STRATEGY
    // ==========================================
    const maxSpeed = CONFIG.BASE_SPEED + (stats.speed / CONFIG.SPEED_CAP);
    let targetSpeed = maxSpeed;
    
    let isRecovering = false;   // สถานะพักฟื้น (เลือดเด้ง)
    let drainMultiplier = 1.0;  // ตัวคูณการใช้แรง

    switch (horse.strategy) {
        // -----------------------------
        // 🚩 RUNNER (วิ่งนำ - ห้ามพัก!)
        // -----------------------------
        case 'RUNNER':
            if (!isSpurtMode) {
                targetSpeed *= 1.25; // วิ่งไวจัดๆ
                drainMultiplier = 1.6; // กินแรงหนักมาก (ลมตีหน้า)

                if (leadGap > 15) {
                    // นำห่าง -> ผ่อนนิดหน่อย แต่ไม่พัก
                    targetSpeed *= 0.85; 
                    drainMultiplier = 1.0; // กลับมากินแรงปกติ (แต่ไม่รีเลือด)
                } 
                else if (leadGap < 5 && leadGap > 0) {
                    // โดนจี้ตูด -> หนีตาย
                    targetSpeed *= 1.1; 
                    drainMultiplier = 2.2; // เผาเครื่องยนต์
                }
            }
            break;

        // -----------------------------
        // ⚔️ BETWEENER (สายเกาะ)
        // -----------------------------
        case 'BETWEENER':
            if (!isSpurtMode) {
                // Drafting: เกาะตูด < 8m (ระยะดูดวิชา)
                if (gapToLeader <= 8 && gapToLeader > 0) {
                    targetSpeed *= 1.0; // รักษาความเร็วเท่าคันหน้า
                    isRecovering = true; // ✅ ดูดท้าย = ได้พัก
                } 
                // ตามห่างเกินไป > 10m -> เร่ง
                else if (gapToLeader > 10) { 
                    targetSpeed *= 1.15; // เร่งเครื่อง
                    drainMultiplier = 1.3; // กินแรงหน่อย
                } else {
                    // วิ่งลอยๆ
                    targetSpeed *= 1.0;
                    drainMultiplier = 1.0;
                }
            }
            break;

        // -----------------------------
        // 🐢 CHASER (สายออมแรง -> ระเบิด)
        // -----------------------------
        case 'CHASER':
            if (!isSpurtMode) {
                targetSpeed *= 0.8; // วิ่งช้า
                drainMultiplier = 0.5; // ประหยัดแรงสุดๆ
                isRecovering = true; // ✅ วิ่งช้า = ได้พักตลอดเวลา
            }
            break;
    }

    // ==========================================
    // 🔥 LAST SPURT (ใส่หมดแม็ก)
    // ==========================================
    if (isSpurtMode) {
        isRecovering = false; // บังคับเลิกพักทุกคน
        
        // ถ้าแรงเหลือ -> พุ่ง
        if (next.stamina > 0) {
            const gutsBonus = 1 + (stats.guts / CONFIG.GUTS_BURST);
            
            if (horse.strategy === 'CHASER') {
                // มาแล้วลูกพี่! ถ้า Panic Mode (คนอื่นเข้าเส้นแดง) เร่งเลยไม่ต้องรอ
                targetSpeed = maxSpeed * 1.45 * gutsBonus; 
                drainMultiplier = 3.0; // เผาผลาญระดับนิวเคลียร์
            } else if (horse.strategy === 'BETWEENER') {
                targetSpeed = maxSpeed * 1.30 * gutsBonus;
                drainMultiplier = 2.0;
            } else { // Runner
                // Runner ปลายแผ่ว (โดนไล่กวด)
                targetSpeed = maxSpeed * 1.05; 
                drainMultiplier = 1.5;
            }
        } else {
            // แรงหมด = ความเร็วตก
            targetSpeed *= 0.5; 
        }
    }

    // ==========================================
    // 🔋 2. STAMINA LOGIC (Runner ห้ามเด้ง)
    // ==========================================
    if (!next.finished) {
        if (isRecovering) {
            // ฟื้นฟู (เฉพาะ Betweener/Chaser)
            const recoveryBonus = 1 + (stats.wisdom / 5000);
            next.stamina = Math.min(next.maxStamina, next.stamina + (CONFIG.RECOVERY_RATE * recoveryBonus * deltaTime));
        } else {
            // ลดลง (Drain)
            // Runner จะโดนหนักที่ Speed Penalty เพราะวิ่งไว
            const speedCost = (next.currentSpeed * next.currentSpeed) / CONFIG.SPEED_PENALTY;
            let totalDrain = (CONFIG.BASE_DRAIN + speedCost) * drainMultiplier;

            // Wisdom ช่วยประหยัด
            const wisdomSave = stats.wisdom / CONFIG.WISDOM_SAVE; 
            totalDrain *= (1 - wisdomSave);

            next.stamina = Math.max(0, next.stamina - (totalDrain * deltaTime));
        }

        // 💀 หมดสภาพ (เดิน)
        if (next.stamina <= 0) {
            const gutsSurvival = 0.2 + (stats.guts / 5000); 
            targetSpeed = Math.min(targetSpeed, maxSpeed * gutsSurvival);
        }
    }

    // ==========================================
    // ⚙️ 3. PHYSICS MOVE
    // ==========================================
    // เนิน (Uphill) 1000-1200m
    const isUphill = (next.currentDistance > 1000 && next.currentDistance < 1200);
    if (isUphill) {
        const hillResistance = Math.max(0, 0.5 - (stats.power / CONFIG.HILL_RESIST));
        targetSpeed *= (1 - hillResistance);
    }

    // Acceleration
    const accel = 5 + (stats.power / 100); 
    if (next.currentSpeed < targetSpeed) {
        next.currentSpeed += accel * deltaTime;
    } else {
        next.currentSpeed -= 2 * deltaTime; 
    }

    next.currentDistance += next.currentSpeed * deltaTime;

    if (next.currentDistance >= track.distance) {
        next.currentDistance = track.distance;
        next.finished = true;
        next.finishTime = Date.now();
    }

    return next;
};

export const sortPositions = (horses) => {
    return [...horses].sort((a, b) => b.currentDistance - a.currentDistance);
};