import React, { useState, useEffect, useRef } from 'react';
import { updateHorse, sortPositions } from '../game/RaceEngine';
import axios from 'axios';

function BattleRace({ team, trackInfo, triggerPoints }) {
    const [gameState, setGameState] = useState('READY'); 
    const [raceHorses, setRaceHorses] = useState([]);
    const [logs, setLogs] = useState([]); 
    const loopRef = useRef(null);

    useEffect(() => {
        const initialHorses = team.map((h, i) => ({
            ...h,
            // Reset Race State
            currentDistance: 0, currentSpeed: 0,
            stamina: h.finalStats.stamina, maxStamina: h.finalStats.stamina,
            lane: i % 3, finished: false, finishTime: 0, effects: [],
            currentSegment: 'STRAIGHT', laneSwitchCooldown: 0, isBlocked: false,
            // Skills
            activeSkills: h.equippedCards.map(card => ({ ...card, isUsed: false }))
        }));
        setRaceHorses(initialHorses);
    }, [team]);

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
                const nextPositions = prev.map(horse => updateHorse(horse, trackInfo, 0.1, prev, isAnyLastSpurt));
                
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
        const myHorse = team[0]; // สมมติเราเชียร์ตัวแรกในทีม (หรือจะเช็คจาก Owner ID)
        const rank = sorted.findIndex(h => h._id === myHorse._id) + 1;
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const res = await axios.post('http://localhost:5000/api/user/race-result', { placement: rank }, { headers: { Authorization: `Bearer ${token}` } });
                addLog(`💰 Prize: ${res.data.newCoins - res.data.coins} G`, 'GOLD');
            }
        } catch(e) { console.error(e); }
        // alert(`🏁 Race Finished! Rank: ${rank}`);
    };

    // --- Actions ---
    const manualSwitchLane = (hIdx, dir) => {
        if (gameState !== 'RUNNING') return;
        setRaceHorses(prev => {
            const newHorses = [...prev];
            const h = newHorses[hIdx];
            if (h.laneSwitchCooldown > 0 || h.finished || h.stamina < 50) return prev;
            
            // Logic เช็คขอบ
            const curLane = Math.round(h.lane);
            if ((curLane <= 0 && dir === -1) || (curLane >= 2 && dir === 1)) return prev;

            h.stamina -= 50;
            h.laneSwitchCooldown = 5.0;
            h.effects.push({ type: 'LANE_CHANGE', direction: dir, duration: 1.0 }); // ส่ง effect เข้า engine
            addLog(`🎮 ${h.name} สับเลน!`, 'BUFF');
            return newHorses;
        });
    };

    const activateSkill = (hIdx, sIdx) => {
        if (gameState !== 'RUNNING') return;
        setRaceHorses(prev => {
            const newHorses = [...prev];
            const horse = newHorses[hIdx];
            const skill = horse.activeSkills[sIdx];
            if (skill.isUsed) return prev;

            // 1. Check Trigger Point
            const isAlwaysActive = (skill.name||"").toLowerCase().includes("spurt") || skill.condition === 'ANYTIME';
            if (!isAlwaysActive && !isInsideTriggerZone(horse.currentDistance)) {
                addLog(`⛔ รอจุด Trigger!`, 'DEBUFF');
                return prev;
            }

            // 2. Check Specific Condition
            const currentSeg = horse.currentSegment || 'STRAIGHT';
            const cond = skill.condition || 'ANY';
            let isMet = true;
            if (cond === 'START' && horse.currentDistance > 600) isMet = false;
            if (cond === 'CURVE' && currentSeg !== 'CURVE') isMet = false;
            if (cond === 'STRAIGHT' && currentSeg !== 'STRAIGHT') isMet = false;
            if (cond === 'SLOPE' && currentSeg !== 'SLOPE') isMet = false;

            if (!isMet) {
                addLog(`❌ เงื่อนไข ${cond} ไม่ตรง!`, 'DEBUFF');
                return prev;
            }

            skill.isUsed = true;
            // Apply logic (simplified)
            if (skill.effectType === 'HEAL') { horse.stamina += 200; addLog(`💚 Healed!`, 'BUFF'); }
            else if (skill.effectType === 'LANE_CHANGE') { horse.effects.push({ type: 'LANE_CHANGE', direction: Math.random()>0.5?1:-1, duration: 1.0 }); addLog(`↔️ Auto Switch!`, 'BUFF'); }
            else { horse.effects.push({ type: 'SPEED_UP', value: 0.4, duration: 3.0 }); addLog(`⚡ Boost!`, 'BUFF'); }
            
            return newHorses;
        });
    };

    return (
        <div style={{color:'white', padding:'20px', maxWidth:'1200px', margin:'0 auto', position:'relative'}}>
            {/* Logs Overlay */}
            <div style={{position:'fixed', top:100, left:20, width:300, zIndex:100, pointerEvents:'none'}}>
                {logs.map(l => <div key={l.id} style={{background:'rgba(0,0,0,0.8)', color: l.type==='DEBUFF'?'#ff5252':l.type==='BUFF'?'#69f0ae':'white', padding:'5px 10px', marginBottom:'5px', borderRadius:'5px', borderLeft: `4px solid ${l.type==='GOLD'?'gold':'white'}`, animation:'fadeIn 0.2s'}}>{l.text}</div>)}
            </div>

            <h1 style={{textAlign:'center', textShadow:'0 0 10px #e91e63'}}>🏁 {trackInfo.name}</h1>

            {/* 🛣️ MINIMAP & TRIGGER MARKERS */}
            <div style={{position:'relative', width:'100%', height:'40px', background:'#333', borderRadius:'5px', overflow:'hidden', marginBottom:'20px', border:'2px solid #555'}}>
                {trackInfo.segments?.map((seg, i, arr) => {
                    const prevLength = arr.slice(0, i).reduce((sum, s) => sum + s.length, 0);
                    const left = (prevLength / trackInfo.distance) * 100;
                    const width = (seg.length / trackInfo.distance) * 100;
                    const color = seg.type === 'CURVE' ? '#e91e63' : seg.type === 'SLOPE' ? '#ff9800' : '#2ecc71';
                    return <div key={i} style={{position:'absolute', left:`${left}%`, width:`${width}%`, height:'100%', background:color, opacity:0.6, fontSize:'0.6rem', display:'flex', justifyContent:'center', alignItems:'center'}}>{seg.type}</div>
                })}
                {/* Trigger Points */}
                {triggerPoints.map((tp, i) => (
                    <div key={i} style={{position:'absolute', left:`${(tp/trackInfo.distance)*100}%`, top:0, height:'100%', width:'4px', background:'yellow', boxShadow:'0 0 10px yellow', zIndex:5}} title={`Trigger: ${tp}m`}/>
                ))}
                {/* 🏁 Finish Line on Minimap */}
                <div style={{position:'absolute', right:0, top:0, bottom:0, width:'10px', background:'repeating-linear-gradient(to bottom, white 0, white 5px, black 5px, black 10px)', zIndex:6}} title="Finish Line" />

                {/* Markers */}
                {raceHorses.map(h => (
                    <div key={h._id} style={{position:'absolute', left:`${Math.min((h.currentDistance/trackInfo.distance)*100, 100)}%`, top: h.lane*10, width:'6px', height:'6px', borderRadius:'50%', background: h.finished?'gold':'white', zIndex:10, boxShadow:'0 0 5px white'}} />
                ))}
            </div>

            {/* 🏟️ STADIUM VIEW (3D) */}
            <div style={{
                position:'relative', width:'100%', height:'450px', background:'#222', borderRadius:'10px', overflow:'hidden', marginBottom:'20px',
                transform: raceHorses[0]?.currentSegment === 'CURVE' ? 'perspective(1000px) rotateX(10deg) skewX(-5deg)' : 'none',
                transition: 'transform 1s ease-in-out', border:'4px solid #444'
            }}>
                {/* Lanes */}
                {[0,1,2].map(l => <div key={l} style={{position:'absolute', top:l*150, width:'100%', height:'150px', borderBottom:'2px dashed rgba(255,255,255,0.1)'}}><span style={{position:'absolute', left:10, top:'50%', fontSize:'3rem', opacity:0.1, fontWeight:'bold', color:'white'}}>LANE {l+1}</span></div>)}
                
                {/* 🏁 Finish Line (In Stadium) */}
                <div style={{
                    position:'absolute', 
                    left: `${(trackInfo.distance / trackInfo.distance) * 100}%`, // Logic เลื่อนตามระยะทางจริง (แต่ในนี้ Render แบบ Relative)
                    // หมายเหตุ: ในมุมมองแบบ Side Scroll เส้นชัยจะอยู่นิ่งๆ หรือเลื่อนเข้ามาหา ขึ้นอยู่กับวิธี Render
                    // ในที่นี้เรา Render ม้าเลื่อนไปขวา ดังนั้นเส้นชัยจะอยู่ที่ 100% ของกล่องไม่ได้ (เพราะม้าจะตกขอบ)
                    // ขอใช้วิธี: ถ้าม้าใกล้จบ ให้แสดงเส้นชัย
                    right: raceHorses[0]?.currentDistance > trackInfo.distance - 100 ? '5%' : '-100px', // โผล่มาตอนใกล้จบ
                    top:0, bottom:0, width:'20px', 
                    background:'repeating-linear-gradient(45deg, white 0, white 10px, black 10px, black 20px)',
                    zIndex: 5, transition: 'right 0.5s'
                }} />

                {/* Horses */}
                {raceHorses.map(h => (
                    <div key={h._id} style={{
                        position:'absolute', 
                        left:`${Math.min((h.currentDistance/trackInfo.distance)*90, 90)}%`, // วิ่งไปเกือบสุดจอ
                        top:`${(h.lane*150)+45}px`, 
                        transition:'left 0.1s linear, top 0.5s', zIndex:10, width:'60px'
                    }}>
                        <div style={{position:'absolute', top:-25, left:'50%', transform:'translateX(-50%)', fontSize:'0.6rem', background:'black', padding:'2px 4px', borderRadius:'4px', color: h.currentSegment==='CURVE'?'#e91e63':'#2ecc71', whiteSpace:'nowrap'}}>
                            {h.currentSegment}
                        </div>
                        <div style={{width:'100%', height:'5px', background:'red', marginBottom:'2px'}}><div style={{width:`${(h.stamina/h.maxStamina)*100}%`, height:'100%', background:'#00e676'}}/></div>
                        <img src={h.image} style={{width:'60px', height:'60px', borderRadius:'50%', border:`3px solid ${h.finished?'gold':'white'}`, filter: h.stamina<=0?'grayscale(100%)':'none', boxShadow:'0 5px 15px rgba(0,0,0,0.5)'}} />
                    </div>
                ))}
            </div>

            {/* 🎮 CONTROLS AREA */}
            {gameState === 'RUNNING' && (
                <div style={{display:'flex', justifyContent:'center', gap:'20px', padding:'15px', background:'#1a1a1a', borderRadius:'15px', border:'1px solid #333'}}>
                    {raceHorses.map((h, i) => (
                        <div key={h._id} style={{textAlign:'center', width:'180px', background:'#2a2a2a', padding:'10px', borderRadius:'10px', border:'1px solid #444'}}>
                            <div style={{fontWeight:'bold', marginBottom:'5px', color:'white'}}>{h.name}</div>
                            
                            {/* ✅ Lane Controls (กลับมาแล้ว!) */}
                            <div style={{display:'flex', gap:'5px', marginBottom:'10px'}}>
                                <button onClick={()=>manualSwitchLane(i,-1)} disabled={Math.round(h.lane)<=0 || h.laneSwitchCooldown>0} 
                                    style={{flex:1, background:'#2196f3', border:'none', borderRadius:'4px', cursor:'pointer', padding:'5px', opacity:(Math.round(h.lane)<=0 || h.laneSwitchCooldown>0)?0.3:1}}>
                                    ⬆ บน
                                </button>
                                <button onClick={()=>manualSwitchLane(i,1)} disabled={Math.round(h.lane)>=2 || h.laneSwitchCooldown>0} 
                                    style={{flex:1, background:'#2196f3', border:'none', borderRadius:'4px', cursor:'pointer', padding:'5px', opacity:(Math.round(h.lane)>=2 || h.laneSwitchCooldown>0)?0.3:1}}>
                                    ⬇ ล่าง
                                </button>
                            </div>

                            {/* Skills */}
                            <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                                {h.activeSkills.map((s, si) => {
                                    const inZone = isInsideTriggerZone(h.currentDistance);
                                    const isAlways = (s.name||"").toLowerCase().includes("spurt") || s.condition === 'ANYTIME';
                                    const canPress = (inZone || isAlways) && !s.isUsed;
                                    
                                    return (
                                        <button key={si} onClick={()=>activateSkill(i,si)} 
                                            disabled={!canPress} 
                                            style={{
                                                padding:'8px', fontSize:'0.75rem', border:'none', borderRadius:'4px', cursor:'pointer',
                                                opacity: canPress ? 1 : 0.3, 
                                                background: s.isUsed ? '#555' : canPress ? '#e91e63' : '#333',
                                                color: 'white', transition: 'all 0.2s', fontWeight: canPress?'bold':'normal'
                                            }}>
                                            {s.isUsed ? 'USED' : s.name}
                                            {!canPress && !s.isUsed && <div style={{fontSize:'0.6rem', color:'#aaa'}}>(Wait)</div>}
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