import React, { useState, useEffect, useRef } from 'react';
import { updateHorse, sortPositions } from '../game/RaceEngine';

function BattleRace({ team, trackInfo }) {
    const [gameState, setGameState] = useState('READY'); 
    const [raceHorses, setRaceHorses] = useState([]);
    const [winner, setWinner] = useState(null);
    const [logs, setLogs] = useState([]); 
    const loopRef = useRef(null);

    // ==========================================
    // 1. INITIAL SETUP
    // ==========================================
    useEffect(() => {
        const initialHorses = team.map((h, i) => ({
            ...h,
            currentDistance: 0, 
            currentSpeed: 0,
            stamina: h.finalStats.stamina, 
            maxStamina: h.finalStats.stamina,
            lane: i % 3, // ✅ กระจายเลนเริ่มต้น (0, 1, 2)
            finished: false, 
            finishTime: 0,
            effects: [], 
            
            // System Variables
            blockedTime: 0, 
            isBlocked: false,
            laneSwitchCooldown: 0, // ✅ Cooldown สับเลน
            
            activeSkills: h.equippedCards.map(card => ({
                ...card,
                isUsed: false,
                cooldown: 0
            }))
        }));
        setRaceHorses(initialHorses);
    }, [team]);

    // Helper: เพิ่ม Log มุมซ้ายบน
    const addLog = (text, type = 'NORMAL') => {
        const id = Date.now() + Math.random();
        setLogs(prev => [...prev, { id, text, type }]);
        setTimeout(() => setLogs(prev => prev.filter(l => l.id !== id)), 3000);
    };

    // ==========================================
    // 2. GAME LOOP
    // ==========================================
    const startRace = () => {
        setGameState('RUNNING');
        addLog(`🏁 เริ่มการแข่งขัน!`, 'SYSTEM');

        loopRef.current = setInterval(() => {
            setRaceHorses(prev => {
                const isAnyLastSpurt = prev.some(h => h.currentDistance >= trackInfo.distance * 0.66);

                if (isAnyLastSpurt && !window.lastSpurtAnnounced) {
                    addLog("🔥 LAST SPURT! เข้าสู่ช่วงสุดท้าย!", 'CRITICAL');
                    window.lastSpurtAnnounced = true;
                }

                // Update Physics
                const nextPositions = prev.map(horse => {
                    return updateHorse(horse, trackInfo, 0.1, prev, isAnyLastSpurt);
                });
                
                // Check Finish
                const allFinished = nextPositions.every(h => h.finished);
                if (allFinished) {
                    clearInterval(loopRef.current);
                    setGameState('FINISHED');
                    const sorted = [...nextPositions].sort((a,b) => a.finishTime - b.finishTime);
                    setWinner(sorted[0]);
                    addLog(`🏆 ${sorted[0].name} เข้าเส้นชัยเป็นอันดับ 1!`, 'GOLD');

                    handleRaceFinish(sorted);
                }
                return nextPositions;
            });
        }, 100);
    };

    useEffect(() => { 
        return () => {
            clearInterval(loopRef.current);
            window.lastSpurtAnnounced = false; 
        };
    }, []);

    const handleRaceFinish = async (sortedHorses) => {
    // หาอันดับของม้าเรา (สมมติม้าเราคือตัวแรก หรือเช็คจาก ID)
    // ใน Demo นี้สมมติว่าถ้าม้าตัวแรกในทีมเข้าที่ 1 คือเราชนะ
    const myHorse = team[0]; 
    const myRank = sortedHorses.findIndex(h => h._id === myHorse._id) + 1;

    try {
        const token = localStorage.getItem('token');
        const res = await axios.post('http://localhost:5000/api/user/race-result', 
            { placement: myRank },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        addLog(`💰 ได้รับรางวัล: ${res.data.newCoins - res.data.coins} G`, 'GOLD'); // คำนวณส่วนต่างเอาเอง หรือใช้ค่าที่ส่งกลับมา
        alert(`จบการแข่งขัน! คุณได้ที่ ${myRank} \nได้รับเงินรางวัล!`);
    } catch (err) {
        console.error("Reward Error", err);
    }
};

    // ==========================================
    // 3. PLAYER ACTIONS (MANUAL & SKILL)
    // ==========================================
    
    // 🔥 ฟังก์ชันผู้เล่นกดสับเลนเอง (Manual Switch)
    const manualSwitchLane = (horseIndex, direction) => {
        if (gameState !== 'RUNNING') return;

        setRaceHorses(prev => {
            const newHorses = [...prev];
            const horse = newHorses[horseIndex];

            // เช็คเงื่อนไข: ห้ามกดถ้าติด CD หรือ Stamina ไม่พอ หรือจบแล้ว
            if (horse.laneSwitchCooldown > 0 || horse.finished || horse.stamina < 50) return prev;

            // เช็คขอบสนาม (อยู่เลน 0 ห้ามขึ้น, เลน 2 ห้ามลง)
            const currentLane = Math.round(horse.lane);
            if ((currentLane <= 0 && direction === -1) || (currentLane >= 2 && direction === 1)) return prev;

            // Apply Action
            horse.stamina -= 50; // เสีย 50 Stamina
            horse.laneSwitchCooldown = 5.0; // ติด CD 5 วินาที
            horse.effects.push({ type: 'LANE_CHANGE', direction: direction, duration: 1.0 });
            
            addLog(`🎮 ${horse.name} โยกหลบ ${direction === -1 ? '⬆️' : '⬇️'}`, 'BUFF');

            return newHorses;
        });
    };

    // 🔥 ฟังก์ชันกดใช้สกิลการ์ด
    const activateSkill = (horseIndex, skillIndex) => {
        if (gameState !== 'RUNNING') return;

        setRaceHorses(prev => {
            const newHorses = [...prev];
            const caster = newHorses[horseIndex];
            const skill = caster.activeSkills[skillIndex];

            if (skill.isUsed) return prev;
            skill.isUsed = true;

            // --- 🛣️ LANE CHANGE ---
            if (skill.effectType === 'LANE_CHANGE' || skill.name.includes('Step') || skill.name.includes('Overtake')) {
                const currentLane = Math.round(caster.lane);
                let direction = 0;
                // AI ช่วยเลือก: ไปเลนว่าง
                if (currentLane === 0) direction = 1; 
                else if (currentLane === 2) direction = -1;
                else direction = Math.random() > 0.5 ? 1 : -1;

                caster.effects.push({ type: 'LANE_CHANGE', direction: direction, duration: 1.0 });
                addLog(`↔️ ${caster.name} ใช้สกิลเปลี่ยนเลน!`, 'BUFF');
            }
            // --- ⚡ SPEED ---
            else if (skill.effectType === 'SPEED' || skill.name.includes('Speed') || skill.effectType === 'SPEED_BURST') {
                caster.effects.push({ type: 'SPEED_UP', value: 0.4, duration: 4.0 });
                addLog(`⚡ ${caster.name} เร่งความเร็ว!`, 'BUFF');
            }
            // --- 💚 HEAL ---
            else if (skill.effectType === 'HEAL' || skill.name.includes('Heal') || skill.name.includes('Carrot')) {
                caster.stamina = Math.min(caster.maxStamina, caster.stamina + 200);
                addLog(`💚 ${caster.name} เติมพลัง!`, 'BUFF');
            }
            // --- 🔴 DEBUFF ---
            else if (skill.type === 'DEBUFF' || skill.effectType?.includes('DEBUFF')) {
                const sorted = [...newHorses].sort((a, b) => b.currentDistance - a.currentDistance);
                let target = sorted[0]; 
                if (target._id === caster._id) target = sorted[1]; 

                if (target) {
                    const targetIndex = newHorses.findIndex(h => h._id === target._id);
                    if (targetIndex !== -1) {
                        newHorses[targetIndex].effects.push({ type: 'SPEED_DOWN', value: 0.4, duration: 4.0 });
                        addLog(`😈 ${caster.name} ยิง ${skill.name} ใส่ ${target.name}!`, 'DEBUFF');
                    }
                }
            } else {
                caster.effects.push({ type: 'SPEED_UP', value: 0.2, duration: 3.0 });
                addLog(`✨ ${caster.name} ใช้สกิล!`, 'BUFF');
            }

            return newHorses;
        });
    };

    const getLeftPos = (dist) => Math.min((dist / trackInfo.distance) * 100, 95);

    return (
        <div style={{color:'white', padding:'20px', maxWidth:'1200px', margin:'0 auto', position:'relative'}}>
            
            {/* 🔥 Event Log Panel */}
            <div style={{position: 'fixed', top: '80px', left: '20px', width: '300px', zIndex: 100, pointerEvents: 'none'}}>
                {logs.map(log => (
                    <div key={log.id} style={{
                        background: log.type === 'DEBUFF' ? 'rgba(220, 20, 60, 0.8)' : 
                                    log.type === 'BUFF' ? 'rgba(0, 200, 83, 0.8)' : 
                                    log.type === 'GOLD' ? 'rgba(255, 215, 0, 0.9)' :
                                    log.type === 'CRITICAL' ? 'rgba(255, 69, 0, 0.9)' : 
                                    'rgba(0, 0, 0, 0.7)',
                        color: log.type === 'GOLD' ? 'black' : 'white',
                        padding: '8px 12px', marginBottom: '5px', borderRadius: '5px',
                        fontSize: '0.9rem', fontWeight: 'bold',
                        animation: 'fadeIn 0.3s ease-out',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
                        borderLeft: '5px solid rgba(255,255,255,0.5)'
                    }}>
                        {log.text}
                    </div>
                ))}
            </div>

            <h1 style={{textAlign:'center', margin:'0 0 20px'}}>🏁 {trackInfo.name}</h1>

            {/* ==========================================
                🏟️ สนามแข่ง (VISUALS)
               ========================================== */}
            <div style={{
                position:'relative', width:'100%', height:'450px', // ✅ ความสูง 450px สำหรับ 3 เลน
                background:'#2c2c2c', border:'4px solid #555', borderRadius:'10px', 
                overflow:'hidden', marginBottom:'20px'
            }}>
                {/* 🛣️ วาดพื้นหลังเลน (3 เลน x 150px) */}
                {[0, 1, 2].map(lane => (
                    <div key={lane} style={{
                        position:'absolute', 
                        top: `${lane * 150}px`, 
                        width:'100%', height:'150px', 
                        borderBottom: lane < 2 ? '2px dashed rgba(255,255,255,0.2)' : 'none',
                        boxSizing: 'border-box'
                    }}>
                        <span style={{position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.05)', fontSize:'3rem', fontWeight:'bold', pointerEvents:'none'}}>
                            LANE {lane+1}
                        </span>
                    </div>
                ))}

                {/* เส้นชัย */}
                <div style={{position:'absolute', right:'5%', top:0, bottom:0, width:'8px', background:'repeating-linear-gradient(to bottom, white 0, white 20px, black 20px, black 40px)', zIndex:1}}></div>
                
                {/* 🐎 ม้าแข่ง */}
                {raceHorses.map((horse, i) => (
                    <div key={horse._id} style={{
                        position: 'absolute',
                        left: `${getLeftPos(horse.currentDistance)}%`,
                        
                        // 🔥 คำนวณ Y: (เลน * 150) + 45 (กึ่งกลางเลน)
                        top: `${(horse.lane * 150) + 45}px`, 
                        
                        transition: 'left 0.1s linear, top 0.5s ease-in-out', // Animation เนียนๆ
                        zIndex: 10, width: '60px'
                    }}>
                        {/* Status Icons */}
                        <div style={{display:'flex', gap:'2px', position:'absolute', top:'-25px', left:0}}>
                            {horse.isBlocked && <span style={{background:'red', fontSize:'0.6rem', padding:'2px', borderRadius:'2px'}}>🚫</span>}
                            {horse.effects.map((eff, idx) => (
                                <div key={idx} style={{fontSize:'0.6rem', padding:'2px', borderRadius:'3px', background: eff.type.includes('DOWN')?'red':'green'}}>
                                    {eff.type.includes('DOWN') ? '🔻' : '⚡'}
                                </div>
                            ))}
                        </div>

                        {/* Stamina Bar */}
                        <div style={{width:'60px', height:'6px', background:'red', borderRadius:'3px', marginBottom:'5px', overflow:'hidden'}}>
                            <div style={{width: `${(horse.stamina / horse.maxStamina) * 100}%`, height:'100%', background: horse.stamina < 100 ? 'red' : '#00e676', transition:'width 0.2s'}}></div>
                        </div>
                        
                        {/* Avatar */}
                        <img src={horse.image} style={{width:'60px', height:'60px', borderRadius:'50%', border: horse.finished ? '3px solid gold' : '3px solid white', objectFit:'cover', filter: horse.stamina<=0 ? 'grayscale(100%)' : 'none'}} />
                        
                        {/* Speed Text */}
                        <div style={{position:'absolute', bottom:'-20px', left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.7)', padding:'2px 5px', borderRadius:'4px', fontSize:'0.7rem', whiteSpace:'nowrap', color: horse.effects.length>0 ? 'yellow':'white'}}>
                            {horse.currentSpeed.toFixed(1)} m/s
                        </div>
                    </div>
                ))}
            </div>
            

            {/* ==========================================
                🎮 CONTROLS (Manual & Skills)
               ========================================== */}
            {gameState === 'RUNNING' && (
                <div style={{display:'flex', justifyContent:'center', gap:'20px', padding:'10px', background:'#222', borderRadius:'15px', border:'2px solid #444'}}>
                    {raceHorses.map((horse, hIdx) => (
                        <div key={horse._id} style={{textAlign:'center', width:'150px'}}>
                            <div style={{fontSize:'0.9rem', marginBottom:'5px', fontWeight:'bold', color:'white'}}>{horse.name}</div>
                            
                            {/* 🔥 ปุ่ม Manual Lane Switch (ของใหม่!) */}
                            <div style={{display:'flex', gap:'5px', marginBottom:'10px'}}>
                                <button 
                                    onClick={() => manualSwitchLane(hIdx, -1)} // ขึ้น (Lane - 1)
                                    disabled={Math.round(horse.lane) <= 0 || horse.laneSwitchCooldown > 0 || horse.finished || horse.stamina < 50}
                                    style={{
                                        flex:1, padding:'5px', cursor:'pointer', borderRadius:'4px', border:'none',
                                        background: (Math.round(horse.lane) <= 0 || horse.laneSwitchCooldown > 0) ? '#444' : '#2196f3',
                                        color: 'white', fontWeight:'bold', opacity: (Math.round(horse.lane) <= 0 || horse.laneSwitchCooldown > 0) ? 0.5 : 1
                                    }}
                                >
                                    ⬆️ {horse.laneSwitchCooldown > 0 ? horse.laneSwitchCooldown.toFixed(0) : ''}
                                </button>
                                <button 
                                    onClick={() => manualSwitchLane(hIdx, 1)} // ลง (Lane + 1)
                                    disabled={Math.round(horse.lane) >= 2 || horse.laneSwitchCooldown > 0 || horse.finished || horse.stamina < 50}
                                    style={{
                                        flex:1, padding:'5px', cursor:'pointer', borderRadius:'4px', border:'none',
                                        background: (Math.round(horse.lane) >= 2 || horse.laneSwitchCooldown > 0) ? '#444' : '#2196f3',
                                        color: 'white', fontWeight:'bold', opacity: (Math.round(horse.lane) >= 2 || horse.laneSwitchCooldown > 0) ? 0.5 : 1
                                    }}
                                >
                                    ⬇️ {horse.laneSwitchCooldown > 0 ? horse.laneSwitchCooldown.toFixed(0) : ''}
                                </button>
                            </div>

                            {/* การ์ดสกิล (Skill Buttons) */}
                            <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                                {horse.activeSkills.map((skill, sIdx) => (
                                    <button 
                                        key={sIdx}
                                        onClick={() => activateSkill(hIdx, sIdx)}
                                        disabled={skill.isUsed || horse.finished}
                                        style={{
                                            padding:'5px', fontSize:'0.7rem', cursor: skill.isUsed ? 'default' : 'pointer',
                                            background: skill.isUsed ? '#444' : (skill.type === 'DEBUFF' ? '#e91e63' : '#00e676'),
                                            color: 'white', border:'none', borderRadius:'4px',
                                            opacity: skill.isUsed ? 0.5 : 1,
                                            boxShadow: skill.isUsed ? 'none' : '0 2px 5px rgba(0,0,0,0.5)'
                                        }}
                                    >
                                        {skill.isUsed ? 'USED' : `${skill.type === 'DEBUFF' ? '💀' : '⚡'} ${skill.name}`}
                                    </button>
                                ))}
                                {horse.activeSkills.length === 0 && <div style={{fontSize:'0.7rem', color:'#555'}}>- No Skills -</div>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Start / Restart Buttons */}
            <div style={{textAlign:'center', marginTop:'20px'}}>
                {gameState === 'READY' && (
                    <button onClick={startRace} style={{padding:'15px 50px', fontSize:'1.5rem', background:'linear-gradient(45deg, #00e676, #00c853)', border:'none', borderRadius:'50px', color:'white', cursor:'pointer'}}>
                        🔫 START RACE
                    </button>
                )}
                {gameState === 'FINISHED' && (
                    <button style={{padding:'10px 30px', cursor:'pointer'}} onClick={()=>window.location.reload()}>
                        Play Again
                    </button>
                )}
            </div>

            {/* Inline CSS Animation for Logs */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}

export default BattleRace;