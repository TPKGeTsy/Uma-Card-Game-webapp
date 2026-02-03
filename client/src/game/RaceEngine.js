const CONFIG = {
    BASE_SPEED: 18.0,
    MIN_SPEED: 3.0,
    
    // Lane Config
    LANE_WIDTH: 1,
    BLOCK_DISTANCE: 4.0,    // ระยะที่ถือว่าโดนบล็อก
    LANE_CHANGE_SPEED: 2.0,
    
    // 🚧 Terrain Physics (ของใหม่!)
    CURVE_SPEED_PENALTY: 0.85, // เข้าโค้งความเร็วเหลือ 85%
    SLOPE_STAMINA_DRAIN: 2.0,  // ขึ้นเนินกินแรง 2 เท่า
    
    // 🔋 Stamina Config
    BASE_DRAIN: 1.5,
    SPEED_PENALTY: 150.0,
    
    // Stats Factors
    SPEED_CAP: 60, 
    POWER_ACCEL: 1500, 
    WISDOM_CORNERING: 800, // ค่า Wisdom ที่ทำให้เข้าโค้งเนียนกริบ (ไม่ลดความเร็ว)
    GUTS_BURST: 2000, 
    WISDOM_SAVE: 3000
};

// Helper: หาว่าตอนนี้อยู่ช่วงไหนของสนาม
export const getTrackSegment = (currentDist, trackSegments) => {
    if (!trackSegments) return 'STRAIGHT';
    let covered = 0;
    for (let seg of trackSegments) {
        if (currentDist < covered + seg.length) {
            return seg.type; // 'STRAIGHT', 'CURVE', 'SLOPE'
        }
        covered += seg.length;
    }
    return 'STRAIGHT';
};

/**
 * Main Update Loop
 */
export const updateHorse = (horse, track, deltaTime = 0.1, allHorses = [], isGlobalLastSpurt = false) => {
    let next = { ...horse };
    if (next.finished) return next;

    // --- 1. System Update (Cooldowns) ---
    if (next.laneSwitchCooldown > 0) next.laneSwitchCooldown = Math.max(0, next.laneSwitchCooldown - deltaTime);
    
    // Update Effects duration
    if (next.effects && next.effects.length > 0) {
        next.effects = next.effects.map(e => ({ ...e, duration: e.duration - deltaTime })).filter(e => e.duration > 0);
    } else {
        next.effects = [];
    }

    const stats = next.finalStats;
    
    // ✅ หา Segment ปัจจุบัน (เพื่อเอาไปใช้หน้า UI และคำนวณ Physics)
    const currentSegment = getTrackSegment(next.currentDistance, track.segments);
    next.currentSegment = currentSegment; 

    // --- 2. Lane Blocking Logic ---
    let blocker = null;
    let gapToBlocker = 9999;
    allHorses.forEach(other => {
        if (other._id !== next._id && !other.finished) {
            if (Math.round(next.lane) === Math.round(other.lane)) {
                const distDiff = other.currentDistance - next.currentDistance;
                if (distDiff > 0 && distDiff < CONFIG.BLOCK_DISTANCE) {
                    if (distDiff < gapToBlocker) { gapToBlocker = distDiff; blocker = other; }
                }
            }
        }
    });
    next.isBlocked = !!blocker; // ส่งสถานะไปโชว์หน้า UI

    // --- 3. Target Speed Calculation ---
    const maxSpeed = CONFIG.BASE_SPEED + (stats.speed / CONFIG.SPEED_CAP);
    let targetSpeed = maxSpeed;
    let drainMultiplier = 1.0;

    // Strategy Modifiers
    const progress = next.currentDistance / track.distance;
    const isLastSpurt = progress >= 0.66 || (isGlobalLastSpurt && ['CHASER','BETWEENER'].includes(horse.strategy));

    if (isLastSpurt) {
        targetSpeed *= 1.1 + (stats.guts / CONFIG.GUTS_BURST); // Guts ช่วยเร่งปลาย
    } else {
        if (horse.strategy === 'RUNNER') targetSpeed *= 1.15;
        if (horse.strategy === 'CHASER' && progress < 0.6) targetSpeed *= 0.9; // ออมแรง
    }

    // 🔥 PHYSICS: Cornering (ทางโค้ง)
    if (currentSegment === 'CURVE') {
        // สูตร: Wisdom เยอะ ช่วยลดแรงเหวี่ยง
        // Wisdom 0 -> โดนหักความเร็วเต็มๆ (เหลือ 0.85)
        // Wisdom 800+ -> เข้าโค้งเทพ (เหลือ 1.0)
        const corneringSkill = Math.min(1, stats.wisdom / CONFIG.WISDOM_CORNERING);
        const penalty = CONFIG.CURVE_SPEED_PENALTY + ((1 - CONFIG.CURVE_SPEED_PENALTY) * corneringSkill);
        targetSpeed *= penalty;
    }

    // Apply Active Effects
    let speedModifier = 1.0;
    next.effects.forEach(eff => {
        if (eff.type === 'SPEED_UP') speedModifier += eff.value;
        if (eff.type === 'SPEED_DOWN') speedModifier -= eff.value;
        
        // Lane Change Movement
        if (eff.type === 'LANE_CHANGE') {
            if (eff.targetLane === undefined) eff.targetLane = Math.max(0, Math.min(2, Math.round(next.lane) + eff.direction));
            if (Math.abs(next.lane - eff.targetLane) > 0.05) {
                const moveDir = eff.targetLane > next.lane ? 1 : -1;
                next.lane += moveDir * CONFIG.LANE_CHANGE_SPEED * deltaTime;
            } else {
                next.lane = eff.targetLane;
                eff.duration = 0; 
            }
        }
    });
    targetSpeed = Math.max(0, targetSpeed * speedModifier);

    // Blocking Penalty
    if (blocker) {
        targetSpeed = Math.min(targetSpeed, blocker.currentSpeed); // วิ่งติดตูด
        drainMultiplier *= 1.2; // หงุดหงิดเสียแรงฟรี
    }

    // --- 4. Stamina & Movement ---
    if (!next.finished) {
        // 🔥 PHYSICS: Slope (ทางลาด)
        if (currentSegment === 'SLOPE') {
            drainMultiplier *= CONFIG.SLOPE_STAMINA_DRAIN;
        }

        const speedCost = (next.currentSpeed * next.currentSpeed) / CONFIG.SPEED_PENALTY;
        let totalDrain = (CONFIG.BASE_DRAIN + speedCost) * drainMultiplier;
        
        // Wisdom Save (ฉลาดใช้แรง)
        totalDrain *= (1 - (stats.wisdom / CONFIG.WISDOM_SAVE));
        // Drafting (ดูดวิชา)
        if (gapToBlocker < 4) totalDrain *= 0.6;

        next.stamina = Math.max(0, next.stamina - (totalDrain * deltaTime));

        if (next.stamina <= 0) {
            targetSpeed = Math.min(targetSpeed, maxSpeed * 0.2); // หมดแรงเดิน
        }
    }

    // Acceleration
    const accel = 5 + (stats.power / CONFIG.POWER_ACCEL); 
    if (next.currentSpeed < targetSpeed) next.currentSpeed += accel * deltaTime;
    else next.currentSpeed -= 2 * deltaTime; // ชะลอเมื่อเกิน Target (เช่น เข้าโค้ง)

    next.currentDistance += next.currentSpeed * deltaTime;

    // Finish Line
    if (next.currentDistance >= track.distance) {
        next.currentDistance = track.distance;
        next.finished = true;
        next.finishTime = Date.now();
    }

    return next;
};

export const sortPositions = (horses) => [...horses].sort((a, b) => b.currentDistance - a.currentDistance);