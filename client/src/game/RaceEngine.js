// client/src/game/RaceEngine.js

const CONFIG = {
    BASE_SPEED: 18.0,
    MIN_SPEED: 3.0,
    
    // Lane Config
    LANE_WIDTH: 1,
    BLOCK_DISTANCE: 4.0,    // ปรับระยะ Block ให้ไกลขึ้น (จะได้เห็นชัดๆ ว่าติด)
    LANE_CHANGE_SPEED: 2.0,
    AUTO_LANE_CHANGE_DELAY: 1.0,
    
    // 🔋 Stamina Config (ปรับให้ใจดีขึ้น)
    BASE_DRAIN: 1.5,        // ลดจาก 5.0 -> 1.5 (ยืนเฉยๆ ไม่ค่อยลด)
    SPEED_PENALTY: 150.0,   // เพิ่มตัวหาร (จาก 60 -> 150) ยิ่งเยอะยิ่งลดน้อย
    RECOVERY_RATE: 10.0,    // เพิ่มอัตราฟื้นฟู (จาก 5 -> 10)
    
    // Stats Factors
    SPEED_CAP: 60, POWER_ACCEL: 1500, HILL_RESIST: 500, GUTS_BURST: 2000, WISDOM_SAVE: 3000
};

/**
 * @param {Array} allHorses - ส่งม้ามาทุกตัวเพื่อเช็คการชน
 */
export const updateHorse = (horse, track, deltaTime = 0.1, allHorses = [], isGlobalLastSpurt = false) => {
    let next = { ...horse };
    if (next.finished) return next;

    // จัดการ Status  Effect (ลดเวลา)

    if (next.laneSwitchCooldown > 0) {
        next.laneSwitchCooldown = Math.max(0, next.laneSwitchCooldown - deltaTime);
    }

    if (next.effects && next.effects.length > 0) {
        next.effects = next.effects.map(e => ({ ...e, duration: e.duration - deltaTime })).filter(e => e.duration > 0);
    } else {
        next.effects = [];
    }

    const stats = next.finalStats;
    const progress = next.currentDistance / track.distance;
    const isLastSpurt = progress >= 0.66 || (isGlobalLastSpurt && ['CHASER','BETWEENER'].includes(horse.strategy));

    // ==========================================
    // 🚧 1. LANE SYSTEM & BLOCKING LOGIC (ระบบใหม่)
    // ==========================================
    
    // หา "ตัวขวาง" (Blocker) ที่อยู่เลนเดียวกัน และอยู่ข้างหน้าไม่ไกล
    let blocker = null;
    let gapToBlocker = 9999;

    allHorses.forEach(other => {
        if (other._id !== next._id && !other.finished) {
            // เช็คว่าอยู่เลนเดียวกันไหม (ปัดเศษให้เป็นเลนเต็มๆ เช่น 1.0, 2.0)
            const myLane = Math.round(next.lane);
            const otherLane = Math.round(other.lane);

            if (myLane === otherLane) {
                const distDiff = other.currentDistance - next.currentDistance;
                // ถ้าอยู่ข้างหน้า และระยะห่างน้อยกว่า Block Distance
                if (distDiff > 0 && distDiff < CONFIG.BLOCK_DISTANCE) {
                    // เจอคนบัง!
                    if (distDiff < gapToBlocker) {
                        gapToBlocker = distDiff;
                        blocker = other;
                    }
                }
            }
        }
    });

    // ==========================================
    // 🎯 2. TARGET SPEED CALCULATE
    // ==========================================
    const maxSpeed = CONFIG.BASE_SPEED + (stats.speed / CONFIG.SPEED_CAP);
    let targetSpeed = maxSpeed;
    let drainMultiplier = 1.0;

    // ... (Strategy Logic เดิม) ...
    switch (horse.strategy) {
        case 'RUNNER':
            targetSpeed *= isLastSpurt ? 1.05 : 1.25;
            drainMultiplier = isLastSpurt ? 1.5 : 1.6;
            break;
        case 'BETWEENER':
            targetSpeed *= isLastSpurt ? 1.30 : 1.0;
            drainMultiplier = isLastSpurt ? 2.0 : 1.0;
            break;
        case 'CHASER':
            targetSpeed *= isLastSpurt ? 1.45 : 0.8;
            drainMultiplier = isLastSpurt ? 3.0 : 0.5;
            break;
    }

    // Guts Bonus ช่วงท้าย
    if (isLastSpurt && next.stamina > 0) {
        targetSpeed *= (1 + (stats.guts / CONFIG.GUTS_BURST));
    }

    // Apply Effects
    let speedModifier = 1.0;
    next.effects.forEach(eff => {
        if (eff.type === 'SPEED_UP') speedModifier += eff.value;
        if (eff.type === 'SPEED_DOWN') speedModifier -= eff.value;
        
        // 🛣️ FIX: Lane Change Logic (เปลี่ยนทีละเลน)
        if (eff.type === 'LANE_CHANGE') {
            // 1. ล็อคเป้าหมาย (ทำครั้งเดียวตอนเริ่ม Effect)
            if (eff.targetLane === undefined) {
                // คำนวณเลนเป้าหมายจากตำแหน่งปัจจุบัน (Round) + ทิศทาง
                // เช่น อยู่ 0 (ซ้าย) + 1 (ขวา) = ไป 1 (กลาง) จบ. ไม่ไปต่อ.
                eff.targetLane = Math.max(0, Math.min(2, Math.round(next.lane) + eff.direction));
            }

            // 2. ขยับหาเป้าหมาย
            if (Math.abs(next.lane - eff.targetLane) > 0.05) {
                const moveDir = eff.targetLane > next.lane ? 1 : -1;
                next.lane += moveDir * CONFIG.LANE_CHANGE_SPEED * deltaTime;
            } else {
                // 3. ถึงแล้ว -> ล็อคตำแหน่ง + ลบ Effect ทิ้งทันที
                next.lane = eff.targetLane;
                eff.duration = 0; // 🛑 สั่งจบงานทันที (กันมันคำนวณต่อแล้วไหลไปเลนอื่น)
            }
        }
    });
    targetSpeed = Math.max(0, targetSpeed * speedModifier);

    // 🚨 BLOCKING EFFECT: ถ้าโดนบล็อก ความเร็วต้องไม่เกินคนหน้า
    if (blocker) {
        // วิ่งเท่าคนหน้า (หรือช้ากว่าถ้าเราอยากผ่อน)
        // แต่ถ้าเรากดสกิลพุ่งชน (Overpower) อาจจะยอมให้เบียดได้ (อนาคต)
        targetSpeed = Math.min(targetSpeed, blocker.currentSpeed);
        
        // ถ้าโดนบล็อกนานๆ อาจจะเสีย Stamina เพิ่ม (Frustration)
        drainMultiplier *= 1.2; 
    }

    // ==========================================
    // 🔋 3. STAMINA
    // ==========================================
    if (!next.finished) {
        const speedCost = (next.currentSpeed * next.currentSpeed) / CONFIG.SPEED_PENALTY;
        let totalDrain = (CONFIG.BASE_DRAIN + speedCost) * drainMultiplier;
        const wisdomSave = stats.wisdom / CONFIG.WISDOM_SAVE; 
        totalDrain *= (1 - wisdomSave);

        // ถ้า Drafting (อยู่หลังคนอื่น < 4m)
        if (gapToBlocker < 4) {
            totalDrain *= 0.5; // ประหยัดแรงจากการดูดวิชา
        }

        next.stamina = Math.max(0, next.stamina - (totalDrain * deltaTime));

        if (next.stamina <= 0) {
            targetSpeed = Math.min(targetSpeed, maxSpeed * 0.2); // หมดแรงเดิน
        }
    }

    // ==========================================
    // ⚙️ 4. PHYSICS
    // ==========================================
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
    export const sortPositions = (horses) => [...horses].sort((a, b) => b.currentDistance - a.currentDistance);