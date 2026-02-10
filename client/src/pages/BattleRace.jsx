import React, { useState, useEffect, useRef } from 'react';
import { updateHorse, sortPositions } from '../game/RaceEngine'; // ✅ นำ sortPositions กลับมา
import axios from 'axios';

function BattleRace({ team, trackInfo, triggerPoints, enemyTeam = [] }) {
    const [gameState, setGameState] = useState('READY'); 
    const [raceHorses, setRaceHorses] = useState([]);
    const [logs, setLogs] = useState([]); 
    const loopRef = useRef(null);

    // 🛠️ SETUP HORSES (รวมทีมเรา + ทีมศัตรู)
    useEffect(() => {
        if (!team || team.length === 0) return;

        // 1. ทีมเรา (My Team) -> สีทอง
        const myHorses = team.map((h, i) => ({
            ...h,
            isPlayer: true,
            lane: i % 3, // Lane 0, 1, 2
            currentDistance: 0, currentSpeed: 0, 
            stamina: h.finalStats.stamina, maxStamina: h.finalStats.stamina,
            finished: false, finishTime: 0, effects: [], 
            visualEffect: null,
            activeSkills: h.equippedCards ? h.equippedCards.map(c => ({...c, isUsed:false})) : []
        }));

        // 2. ทีมศัตรู (Enemy Team) -> สีแดง
        // ถ้า enemyTeam ว่าง (เล่นปกติ) ก็จะไม่มีส่วนนี้
        const enemyHorses = enemyTeam.map((h, i) => ({
            ...h,
            _id: h._id + "_enemy_" + i, // กัน ID ซ้ำ
            name: `[Enemy] ${h.name}`,
            isPlayer: false,
            lane: (i % 3) + 0.5, // แทรกเลน (0.5, 1.5, 2.5)
            
            finalStats: h.stats, 
            stamina: h.stats.stamina, maxStamina: h.stats.stamina,
            currentDistance: 0, currentSpeed: 0, 
            finished: false, finishTime: 0, effects: [], visualEffect: null,
            activeSkills: [] // ศัตรูไม่มีสกิล (หรือจะสุ่มใส่ให้ก็ได้)
        }));

        // รวมกันแล้วเริ่ม
        setRaceHorses([...myHorses, ...enemyHorses]);

    }, [team, enemyTeam]);

    const addLog = (text, type = 'NORMAL') => {
        const id = Date.now() + Math.random();
        setLogs(prev => [...prev, { id, text, type }]);
        setTimeout(() => setLogs(prev => prev.filter(l => l.id !== id)), 3000);
    };

    const isInsideTriggerZone = (currentDist) => {
        if (!triggerPoints || triggerPoints.length === 0) return true;
        const ZONE_RADIUS = 50; 
        return triggerPoints.some(pt => Math.abs(currentDist - pt) <= ZONE_RADIUS);
    };

    const startRace = () => {
        setGameState('RUNNING');
        addLog(`🏁 START!`, 'SYSTEM');
        
        loopRef.current = setInterval(() => {
            setRaceHorses(prev => {
                const isAnyLastSpurt = prev.some(h => h.currentDistance >= trackInfo.distance * 0.66);
                
                // คำนวณตำแหน่งใหม่
                let nextPositions = prev.map(horse => updateHorse(horse, trackInfo, 0.1, prev, isAnyLastSpurt));
                
                // ✅ ใช้ sortPositions จัดอันดับ
                if (sortPositions) {
                    nextPositions = sortPositions(nextPositions);
                } else {
                    // Fallback ถ้า import ไม่มา
                    nextPositions.sort((a, b) => b.currentDistance - a.currentDistance);
                }

                if (nextPositions.every(h => h.finished)) {
                    clearInterval(loopRef.current);
                    setGameState('FINISHED');
                    const sorted = [...nextPositions].sort((a,b) => a.finishTime - b.finishTime);
                    handleRaceFinish(sorted);
                }
                return nextPositions;
            });
        }, 100);
    };

    useEffect(() => { return () => clearInterval(loopRef.current); }, []);

    const handleRaceFinish = async (sorted) => {
        const myHorse = team[0]; // ตัวแทนทีมเรา
        const rank = sorted.findIndex(h => h._id === myHorse._id) + 1;
        
        try {
            const token = localStorage.getItem('token');
            if (token) {
                // ส่งผลการแข่ง
                const res = await axios.post('http://localhost:5000/api/user/race-result', { placement: rank }, { headers: { Authorization: `Bearer ${token}` } });
                addLog(`💰 Prize: ${res.data.newCoins - res.data.coins} G`, 'GOLD');
            }
        } catch(e) { console.error(e); }
    };

    // --- Actions ---
    const manualSwitchLane = (hIdx, dir) => {
        if (gameState !== 'RUNNING') return;
        setRaceHorses(prev => {
            const newHorses = [...prev];
            const h = newHorses[hIdx];
            // หา Index จริงใน array รวม (เฉพาะตัวที่เป็น Player)
            if (!h || !h.isPlayer) return prev;

            if (h.laneSwitchCooldown > 0 || h.finished || h.stamina < 50) return prev;
            
            const curLane = Math.round(h.lane);
            if ((curLane <= 0 && dir === -1) || (curLane >= 2 && dir === 1)) return prev;

            h.stamina -= 50;
            h.laneSwitchCooldown = 5.0;
            h.effects.push({ type: 'LANE_CHANGE', direction: dir, duration: 1.0 });
            h.visualEffect = 'dust'; // Dust Effect
            addLog(`🎮 ${h.name} สับเลน!`, 'BUFF');
            return newHorses;
        });
    };

    const activateSkill = (horseId, sIdx) => {
        if (gameState !== 'RUNNING') return;
        setRaceHorses(prev => {
            const newHorses = [...prev];
            const horseIndex = newHorses.findIndex(h => h._id === horseId);
            if (horseIndex === -1) return prev;
            
            const horse = newHorses[horseIndex];
            const skill = horse.activeSkills[sIdx];
            if (skill.isUsed) return prev;

            const isAlwaysActive = (skill.name||"").toLowerCase().includes("spurt") || skill.condition === 'ANYTIME';
            if (!isAlwaysActive && !isInsideTriggerZone(horse.currentDistance)) {
                addLog(`⛔ รอจุด Trigger!`, 'DEBUFF');
                return prev;
            }

            // Simple Condition Check
            const currentSeg = horse.currentSegment || 'STRAIGHT';
            const cond = skill.condition || 'ANY';
            let isMet = true;
            if (cond === 'START' && horse.currentDistance > 600) isMet = false;
            if (cond === 'CURVE' && currentSeg !== 'CURVE') isMet = false;
            if (cond === 'STRAIGHT' && currentSeg !== 'STRAIGHT') isMet = false;

            if (!isMet) {
                addLog(`❌ เงื่อนไข ${cond} ไม่ตรง!`, 'DEBUFF');
                return prev;
            }

            skill.isUsed = true;
            horse.visualEffect = skill.effectType === 'HEAL' ? 'aura-green' : 'aura-blue'; // Effect
            addLog(`✨ ${horse.name}: ${skill.name}!`, 'BUFF');

            if (skill.effectType === 'HEAL') horse.stamina += 200;
            else if (skill.effectType === 'LANE_CHANGE') horse.effects.push({ type: 'LANE_CHANGE', direction: Math.random()>0.5?1:-1, duration: 1.0 });
            else horse.effects.push({ type: 'SPEED_UP', value: 0.4, duration: 3.0 });
            
            return newHorses;
        });
    };

    return (
        <div style={{color:'white', padding:'20px', maxWidth:'1200px', margin:'0 auto', position:'relative'}}>
            
            {/* CSS Animations */}
            <style>{`
                @keyframes gallop { 0% { transform: translateY(0); } 50% { transform: translateY(-3px); } 100% { transform: translateY(0); } }
                @keyframes auraPulse { 0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); } }
            `}</style>

            {/* Logs Overlay */}
            <div style={{position:'fixed', top:100, left:20, width:300, zIndex:100, pointerEvents:'none'}}>
                {logs.map(l => <div key={l.id} style={{background:'rgba(0,0,0,0.8)', color: l.type==='DEBUFF'?'#ff5252':l.type==='BUFF'?'#69f0ae':'white', padding:'5px 10px', marginBottom:'5px', borderRadius:'5px', borderLeft: `4px solid ${l.type==='GOLD'?'gold':'white'}`, animation:'fadeIn 0.2s'}}>{l.text}</div>)}
            </div>

            <h1 style={{textAlign:'center', textShadow:'0 0 10px #e91e63'}}>🏁 {trackInfo?.name || "Race Track"}</h1>

            {/* 🛣️ MINIMAP */}
            <div style={{position:'relative', width:'100%', height:'40px', background:'#333', borderRadius:'5px', overflow:'hidden', marginBottom:'20px', border:'2px solid #555'}}>
                {trackInfo?.segments?.map((seg, i, arr) => {
                    const prevLength = arr.slice(0, i).reduce((sum, s) => sum + s.length, 0);
                    const totalDist = trackInfo.distance || 2000;
                    const left = (prevLength / totalDist) * 100;
                    const width = (seg.length / totalDist) * 100;
                    const color = seg.type === 'CURVE' ? '#e91e63' : seg.type === 'SLOPE' ? '#ff9800' : '#2ecc71';
                    return <div key={i} style={{position:'absolute', left:`${left}%`, width:`${width}%`, height:'100%', background:color, opacity:0.6, fontSize:'0.6rem', display:'flex', justifyContent:'center', alignItems:'center'}}>{seg.type}</div>
                })}
                {triggerPoints.map((tp, i) => (
                    <div key={i} style={{position:'absolute', left:`${(tp/(trackInfo?.distance||2000))*100}%`, top:0, height:'100%', width:'4px', background:'yellow', zIndex:5}}/>
                ))}
                {/* Dots */}
                {raceHorses.map(h => (
                    <div key={h._id} style={{position:'absolute', left:`${Math.min((h.currentDistance/(trackInfo?.distance||2000))*100, 100)}%`, top: h.lane*10, width:'6px', height:'6px', borderRadius:'50%', background: h.isPlayer ? 'gold':'red', zIndex:10, boxShadow:'0 0 5px white'}} />
                ))}
            </div>

            {/* 🏟️ STADIUM VIEW */}
            <div style={{
                position:'relative', width:'100%', height:'450px', background:'#222', borderRadius:'10px', overflow:'hidden', marginBottom:'20px',
                transform: raceHorses[0]?.currentSegment === 'CURVE' ? 'perspective(1000px) rotateX(10deg) skewX(-5deg)' : 'none',
                transition: 'transform 1s ease-in-out', border:'4px solid #444'
            }}>
                {[0,1,2].map(l => <div key={l} style={{position:'absolute', top:l*150, width:'100%', height:'150px', borderBottom:'2px dashed rgba(255,255,255,0.1)'}}><span style={{position:'absolute', left:10, top:'50%', fontSize:'3rem', opacity:0.1, fontWeight:'bold', color:'white'}}>LANE {l+1}</span></div>)}
                
                {/* Finish Line */}
                <div style={{
                    position:'absolute', 
                    left: `${((trackInfo?.distance||2000) / (trackInfo?.distance||2000)) * 100}%`,
                    right: raceHorses[0]?.currentDistance > (trackInfo?.distance || 2000) - 100 ? '5%' : '-100px',
                    top:0, bottom:0, width:'20px', background:'repeating-linear-gradient(45deg, white 0, white 10px, black 10px, black 20px)',
                    zIndex: 5, transition: 'right 0.5s'
                }} />

                {/* 🐎 HORSES RENDER (แก้ขนาดรูปแล้ว!) */}
                {raceHorses.map(h => (
                    <div key={h._id} style={{
                        position:'absolute', 
                        left:`${Math.min((h.currentDistance/(trackInfo?.distance||2000))*90, 90)}%`, 
                        top:`${(h.lane*150)+45}px`, 
                        transition:'left 0.1s linear, top 0.5s', zIndex:10, width:'60px'
                    }}>
                        <div style={{position:'absolute', top:-25, left:'50%', transform:'translateX(-50%)', fontSize:'0.6rem', background:'black', padding:'2px 4px', borderRadius:'4px', color: h.currentSegment==='CURVE'?'#e91e63':'#2ecc71', whiteSpace:'nowrap'}}>
                            {h.currentSegment}
                        </div>
                        <div style={{width:'100%', height:'5px', background:'red', marginBottom:'2px'}}><div style={{width:`${(h.stamina/h.maxStamina)*100}%`, height:'100%', background:'#00e676'}}/></div>
                        
                        {/* ✅ Style รูปม้าที่ถูกต้อง */}
                        <img src={h.image} style={{
                            width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', // 👈 ใส่กลับมาให้แล้วครับ
                            border: h.isPlayer ? '3px solid gold' : '3px solid red', 
                            filter: h.isPlayer ? 'none' : 'grayscale(30%)',
                            boxShadow: h.visualEffect === 'aura-blue' ? '0 0 15px cyan' : h.visualEffect === 'aura-green' ? '0 0 15px lime' : '0 5px 15px rgba(0,0,0,0.5)',
                            animation: !h.finished && h.stamina > 0 ? 'gallop 0.4s infinite alternate' : 'none'
                        }} onError={(e)=>e.target.src='https://placehold.co/100'}/>
                        
                        {/* Name Tag */}
                        <div style={{fontSize:'0.6rem', textAlign:'center', marginTop:'2px', textShadow:'1px 1px 2px black', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'80px'}}>
                            {h.name}
                        </div>
                    </div>
                ))}
            </div>

            {/* 🎮 CONTROLS (เฉพาะทีมเรา) */}
            {gameState === 'RUNNING' && (
                <div style={{display:'flex', justifyContent:'center', gap:'20px', padding:'15px', background:'#1a1a1a', borderRadius:'15px', border:'1px solid #333'}}>
                    {raceHorses.filter(h => h.isPlayer).map((h, i) => (
                        <div key={h._id} style={{textAlign:'center', width:'180px', background:'#2a2a2a', padding:'10px', borderRadius:'10px', border:'1px solid #444'}}>
                            <div style={{fontWeight:'bold', marginBottom:'5px', color:'white'}}>{h.name}</div>
                            
                            <div style={{display:'flex', gap:'5px', marginBottom:'10px'}}>
                                <button onClick={()=>manualSwitchLane(i,-1)} disabled={Math.round(h.lane)<=0 || h.laneSwitchCooldown>0} style={{flex:1, background:'#2196f3', border:'none', borderRadius:'4px', cursor:'pointer', padding:'5px', opacity:(Math.round(h.lane)<=0 || h.laneSwitchCooldown>0)?0.3:1}}>⬆ บน</button>
                                <button onClick={()=>manualSwitchLane(i,1)} disabled={Math.round(h.lane)>=2 || h.laneSwitchCooldown>0} style={{flex:1, background:'#2196f3', border:'none', borderRadius:'4px', cursor:'pointer', padding:'5px', opacity:(Math.round(h.lane)>=2 || h.laneSwitchCooldown>0)?0.3:1}}>⬇ ล่าง</button>
                            </div>

                            <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                                {h.activeSkills.map((s, si) => {
                                    const inZone = isInsideTriggerZone(h.currentDistance);
                                    const canPress = inZone && !s.isUsed;
                                    return (
                                        <button key={si} onClick={()=>activateSkill(h._id, si)} 
                                            disabled={!canPress} 
                                            style={{
                                                padding:'8px', fontSize:'0.75rem', border:'none', borderRadius:'4px', cursor:'pointer',
                                                opacity: canPress ? 1 : 0.3, 
                                                background: s.isUsed ? '#555' : canPress ? '#e91e63' : '#333',
                                                color: 'white'
                                            }}>
                                            {s.isUsed ? 'USED' : s.name}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {gameState === 'READY' && <button onClick={startRace} style={{width:'100%', padding:'20px', fontSize:'2rem', background:'#00e676', border:'none', fontWeight:'bold', cursor:'pointer', borderRadius:'10px', boxShadow:'0 0 20px rgba(0,230,118,0.4)'}}>🚀 START RACE</button>}
            
            {gameState === 'FINISHED' && (
                <div style={{textAlign:'center', marginTop:'20px', animation:'fadeIn 0.5s'}}>
                    <h2 style={{color:'gold', fontSize:'3rem', textShadow:'0 0 20px gold'}}>🏆 RACE FINISHED!</h2>
                    <button onClick={()=>window.location.reload()} style={{padding:'10px 30px', fontSize:'1.2rem', cursor:'pointer', background:'transparent', border:'2px solid white', color:'white', borderRadius:'50px'}}>PLAY AGAIN</button>
                </div>
            )}
        </div>
    );
}

export default BattleRace;