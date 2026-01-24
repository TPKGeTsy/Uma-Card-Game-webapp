import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Config
const TRACK_DISTANCE = 2500; // กลับมาใช้ระยะ 2500m
const SCORE_TABLE = [10, 8, 6, 4, 2, 0];
const PHASES = { LOAD: 0, SETUP: 1, DRAFT: 2, ALLOCATE: 3, RACE: 4, RESULT: 5 };

// จุดเกิด Event (ปรับให้จบก่อน 2500m)
const RACE_TRIGGER_POINTS = [500, 1200, 2000];

const calculateDraftSlots = (rarity) => {
    switch(rarity) {
        case 'SSR': return 1;
        case 'SR': return 2;
        case 'R': return 3;
        default: return 4;
    }
};

function Battle() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // --- State ---
  const [phase, setPhase] = useState(PHASES.LOAD);
  
  // Data
  const [myInventoryHorses, setMyInventoryHorses] = useState([]);
  const [myInventoryActions, setMyInventoryActions] = useState([]); // Deck ตั้งต้นจากกระเป๋า
  
  // Team & Draft
  const [myTeam, setMyTeam] = useState([]);
  const [cpuTeam, setCpuTeam] = useState([]); 
  const [draftPool, setDraftPool] = useState([]);
  const [myDraftedCards, setMyDraftedCards] = useState([]);
  const [draftTurn, setDraftTurn] = useState(0); 
  const [myDraftQuota, setMyDraftQuota] = useState(0);
  const [cpuDraftQuota, setCpuDraftQuota] = useState(0);

  const [selectedCardId, setSelectedCardId] = useState(null);

  // Race State
  const [raceHorses, setRaceHorses] = useState([]);
  const [raceTime, setRaceTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false); 
  const [gameSpeed, setGameSpeed] = useState(1);
  const raceInterval = useRef(null);
  
  // In-Game Deck Logic
  const [activeDeck, setActiveDeck] = useState([]); // Deck จริงที่ใช้จั่ว (Inventory + Drafted)
  const [handOptions, setHandOptions] = useState([]); // การ์ด 3 ใบที่สุ่มขึ้นมา
  const [triggerPoints, setTriggerPoints] = useState([...RACE_TRIGGER_POINTS]); 
  const [skillChance, setSkillChance] = useState(null); 
  
  const [skillTargetMode, setSkillTargetMode] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);

  // ==========================================
  // 1. Initial Load (ดึง Deck จริง)
  // ==========================================
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
        if (!token) {
            // Mock Fallback
            setMyInventoryHorses([{ _id: 'm1', name: "Mock Horse", rarity: "N", image: "https://placehold.co/100", stats: { speed: 600, stamina: 600, power: 600, guts: 600, wisdom: 600 } }]);
            setMyInventoryActions([{ id: 'a1', name: "Sprint", effectType: "SPEED", value: 30, image: "https://placehold.co/100?text=Sprint" }]);
            setPhase(PHASES.SETUP);
            return;
        }

        const res = await axios.get('http://localhost:5000/api/user/inventory', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // แยกม้า กับ การ์ด Action (Deck)
        const horses = res.data.filter(item => item.cardId && item.cardId.type === 'HORSE').map(item => item.cardId);
        const actions = res.data.filter(item => item.cardId && item.cardId.type === 'ACTION').map(item => item.cardId);

        setMyInventoryHorses(horses);
        setMyInventoryActions(actions); 
        setPhase(PHASES.SETUP);

    } catch (err) {
        console.error("Load Error:", err);
    }
  };

  // ==========================================
  // 2. Setup (Show Trigger Info)
  // ==========================================
  const toggleSelectHorse = (horse) => {
    if (myTeam.find(h => h._id === horse._id)) {
      setMyTeam(myTeam.filter(h => h._id !== horse._id));
    } else {
      if (myTeam.length < 3) setMyTeam([...myTeam, horse]);
    }
  };

  const confirmTeam = () => {
    const mySlots = myTeam.reduce((sum, h) => sum + calculateDraftSlots(h.rarity), 0);
    setMyDraftQuota(mySlots);

    // Mock CPU
    const cpuMock = [
        { _id: 'c1', name: "El Condor Pasa (CPU)", rarity: "SR", image: "/images/uma/el_condor_pasa.png", stats: { speed: 800, stamina: 700, power: 800, guts: 600, wisdom: 600 } },
        { _id: 'c2', name: "Grass Wonder (CPU)", rarity: "SR", image: "/images/uma/grass_wonder.png", stats: { speed: 750, stamina: 800, power: 750, guts: 600, wisdom: 600 } },
        { _id: 'c3', name: "Vodka (CPU)", rarity: "R", image: "/images/uma/vodka.png", stats: { speed: 700, stamina: 600, power: 900, guts: 500, wisdom: 500 } },
    ];
    setCpuTeam(cpuMock);
    setCpuDraftQuota(5);

    // Gen Pool
    const pool = [];
    for(let i=0; i<15; i++) {
        const rnd = Math.random();
        let cardType, styleColor, bonusSkill, statMult;
        
        if (rnd < 0.4) {
            cardType = "TYPE A (BODY)"; styleColor = "#ffebee"; bonusSkill = null; statMult = 1.5; 
        } else if (rnd < 0.7) {
            cardType = "TYPE B (AGGRO)"; styleColor = "#f3e5f5"; statMult = 1.0;
            bonusSkill = { name: "Glare", effectType: "DEBUFF", value: 30, image: "/images/ActionCard/glare.jpg" };
        } else {
            cardType = "TYPE C (TECH)"; styleColor = "#e3f2fd"; statMult = 0.7;
            // 🔥 Rocket Start: กำหนด effectType พิเศษ
            bonusSkill = { name: "Rocket Start", effectType: "PASSIVE_START", value: 80, image: "/images/ActionCard/rocket_start.jpg" };
        }

        pool.push({
            id: `pool-${i}`, name: cardType, type: cardType, styleColor,
            statBonus: { 
                speed: Math.floor((Math.random()*50+20) * statMult), 
                stamina: Math.floor((Math.random()*50+20) * statMult),
                power: Math.floor((Math.random()*30) * statMult),
            },
            bonusAction: bonusSkill ? { ...bonusSkill, id: `skill-${i}` } : null
        });
    }
    setDraftPool(pool);
    setPhase(PHASES.DRAFT);
  };

  const handleDraftPick = (card) => {
    if (draftTurn !== 0 || myDraftQuota <= 0) return;
    setMyDraftedCards([...myDraftedCards, card]);
    setDraftPool(prev => prev.filter(c => c.id !== card.id));
    setMyDraftQuota(prev => prev - 1);
    setDraftTurn(1);
    setTimeout(() => {
        setDraftPool(curr => {
            if (curr.length === 0) return curr;
            const rnd = Math.floor(Math.random() * curr.length);
            setDraftTurn(0);
            return curr.filter((_, i) => i !== rnd);
        });
        setCpuDraftQuota(prev => Math.max(0, prev - 1));
    }, 200);
  };

  // ==========================================
  // 3. Allocate Logic (Rocket Start = Passive)
  // ==========================================
  const handleApplyToHorse = (horseIndex) => {
    if (!selectedCardId) return;
    const card = myDraftedCards.find(c => c.id === selectedCardId);
    
    const updatedTeam = [...myTeam];
    const horse = updatedTeam[horseIndex];

    // Apply Stats
    horse.stats.speed = (horse.stats.speed || 0) + (card.statBonus.speed || 0);
    horse.stats.stamina = (horse.stats.stamina || 0) + (card.statBonus.stamina || 0);
    horse.stats.power = (horse.stats.power || 0) + (card.statBonus.power || 0);

    // 🔥 Check Passive: Rocket Start
    if (card.bonusAction?.effectType === "PASSIVE_START") {
        if (!horse.passives) horse.passives = [];
        horse.passives.push(card.bonusAction); // ฝังลงตัวม้า
    } else if (card.bonusAction) {
        // การ์ดอื่นๆ เพิ่มเข้า Deck กลาง
        setMyInventoryActions(prev => [...prev, card.bonusAction]);
    }

    setMyTeam(updatedTeam);
    setMyDraftedCards(prev => prev.filter(c => c.id !== selectedCardId));
    setSelectedCardId(null);
  };

  const startRace = () => {
    // 🔥 สร้าง Deck สำหรับแข่ง (Inventory + Drafted Non-Passive)
    setActiveDeck([...myInventoryActions]); 
    setTriggerPoints([...RACE_TRIGGER_POINTS]);

    const allRunners = [...myTeam, ...cpuTeam].map((h, i) => {
        // 🔥 Rocket Start Logic (40% Chance)
        let startSpeed = 0;
        let startBuff = false;
        
        if (h.isPlayer && h.passives?.find(p => p.effectType === "PASSIVE_START")) {
            if (Math.random() < 0.4) { // 40% Chance
                startSpeed = 30; // พุ่งปานกลาง (Nerfed)
                startBuff = true;
            }
        }

        return {
            ...h,
            instanceId: i,
            isPlayer: i < 3,
            currentSpeed: startSpeed,
            distance: 0,
            currentStamina: (h.stats.stamina || 600) * 12,
            maxStamina: (h.stats.stamina || 600) * 12,
            lane: i,
            rank: 1,
            hasRocketStart: startBuff, // เก็บ state ไว้โชว์ effect
            finishedTime: null
        };
    });

    setRaceHorses(allRunners);
    setPhase(PHASES.RACE);
    setIsPaused(false);
    setGameSpeed(1);
  };

  // ==========================================
  // 4. Race Loop
  // ==========================================
  useEffect(() => {
    if (phase === PHASES.RACE && !isPaused && !skillChance) {
        raceInterval.current = setInterval(() => {
            setRaceTime(t => t + (0.1 * gameSpeed));

            setRaceHorses(prev => {
                let allFinished = true;
                const updated = prev.map(h => {
                    if (h.distance >= TRACK_DISTANCE) {
                        if (!h.finishedTime) h.finishedTime = raceTime.toFixed(2);
                        return h;
                    }
                    allFinished = false;

                    // Physics
                    let baseSpeed = (h.stats.speed || 500) / 65; 
                    const randomFlux = (Math.random() * 0.1) + 0.95; 
                    let targetSpeed = baseSpeed * randomFlux;
                    
                    // Rocket Start Decay (ลดลงเรื่อยๆ)
                    if (h.hasRocketStart && h.distance < 400) {
                        targetSpeed += 5; // Boost ช่วงต้น
                    }

                    if (h.distance < 400) targetSpeed += (h.stats.power||0)/4000;
                    if (h.currentStamina <= 0) targetSpeed *= 0.2; 

                    if (h.currentSpeed < targetSpeed) h.currentSpeed += 0.05 * gameSpeed;
                    else h.currentSpeed -= 0.02 * gameSpeed;

                    h.currentSpeed = Math.max(0, h.currentSpeed);

                    const moveStep = h.currentSpeed * 0.5 * gameSpeed;
                    const newDist = h.distance + moveStep;
                    
                    return { ...h, distance: newDist, currentStamina: Math.max(0, h.currentStamina - (0.2 * gameSpeed)) };
                });

                // Check Trigger Points
                const leadHorse = updated.reduce((prev, curr) => (prev.distance > curr.distance) ? prev : curr);
                
                // Trigger Logic: ถ้าม้าตัวนำผ่านจุด และยังมีจุดเหลืออยู่
                if (triggerPoints.length > 0 && leadHorse.distance >= triggerPoints[0]) {
                    const playerAlive = updated.some(h => h.isPlayer && !h.finishedTime);
                    // ถ้าผู้เล่นยังแข่งอยู่ ถึงจะ Trigger
                    if (playerAlive) {
                        triggerSkillEvent();
                        setTriggerPoints(prev => prev.slice(1)); 
                        return prev; 
                    }
                }

                updated.sort((a,b) => b.distance - a.distance);
                updated.forEach((h,i) => h.rank = i+1);

                if (allFinished) {
                    clearInterval(raceInterval.current);
                    setPhase(PHASES.RESULT);
                }
                return updated;
            });
        }, 50);
    }
    return () => clearInterval(raceInterval.current);
  }, [phase, isPaused, gameSpeed, skillChance, triggerPoints]);

  const triggerSkillEvent = () => {
    setIsPaused(true);
    const owner = Math.random() < 0.6 ? 'PLAYER' : 'CPU'; 
    setSkillChance({ owner });
    setSkillTargetMode(false);

    if (owner === 'PLAYER') {
        // 🔥 จั่วจาก activeDeck
        if (activeDeck.length === 0) {
             // ถ้า Deck หมดจริงๆ ให้การ์ด Rest แก้ขัด
             setHandOptions([{id:'rest', name:"Rest", effectType:"HEAL", value:20, image:"https://placehold.co/100?text=Rest"}]);
        } else {
             // สุ่ม 3 ใบ
             const shuffled = [...activeDeck].sort(() => 0.5 - Math.random());
             setHandOptions(shuffled.slice(0, 3));
        }
    } else {
        setTimeout(() => {
            console.log("CPU used skill");
            resumeGame();
        }, 1500);
    }
  };

  const resumeGame = () => {
    setSkillChance(null);
    setIsPaused(false);
    setSkillTargetMode(false);
    setSelectedSkill(null);
  };

  const handleSelectSkill = (skill) => {
      setSelectedSkill(skill);
      setSkillTargetMode(true);
  };

  const handleCastSkill = (targetId) => {
    if (!selectedSkill) return;
    
    // Check Skill Validity
    setRaceHorses(prev => prev.map(h => {
        if (h.instanceId === targetId) {
            if (selectedSkill.effectType === 'SPEED' || selectedSkill.effectType === 'SPEED_BURST') {
                h.currentSpeed += 25; 
                h.currentStamina -= 30;
            } else if (selectedSkill.effectType === 'HEAL') {
                h.currentStamina += 200;
            } else if (selectedSkill.effectType === 'DEBUFF') {
                // Debuff ใส่ศัตรู
                h.currentSpeed = Math.max(0, h.currentSpeed - 20); 
                h.currentStamina -= 100;
            }
        }
        return h;
    }));

    resumeGame();
  };

  // ==========================================
  // RENDER
  // ==========================================
  const calculateTeamScore = (isPlayerTeam) => {
      let score = 0;
      raceHorses.forEach(h => {
          if (h.isPlayer === isPlayerTeam) {
              const pts = SCORE_TABLE[h.rank - 1] || 0;
              score += pts;
          }
      });
      return score;
  };

  const renderStatChange = (base, added) => {
      if (!added) return <span style={{color:'#555'}}>{base}</span>;
      return <span><span style={{color:'#555'}}>{base}</span> <span style={{color:'green', fontWeight:'bold'}}>➜ {base+added}</span></span>;
  };

  return (
    <div style={styles.container}>
        <div style={styles.statusBar}>
            <div>Phase: {Object.keys(PHASES)[phase]}</div>
            {phase === PHASES.RACE && <div>🏁 Dist: {Math.floor(raceHorses[0]?.distance || 0)} / {TRACK_DISTANCE}m</div>}
        </div>

        {/* 1. SETUP (Show Events Info) */}
        {phase === PHASES.SETUP && (
             <div>
                <h2>1. เลือกม้า 3 ตัว</h2>
                <div style={{marginBottom:'15px', padding:'10px', background:'#e3f2fd', borderRadius:'5px', color:'#0d47a1'}}>
                    <b>ℹ ข้อมูลสนามแข่ง (Tokyo 2500m)</b><br/>
                    ⚡ จุดใช้สกิล: {RACE_TRIGGER_POINTS.join('m, ')}m
                </div>
                <div style={styles.grid}>
                    {myInventoryHorses.map(h => {
                        const isSelected = myTeam.find(t=>t._id===h._id);
                        return (
                            <div key={h._id} onClick={()=>toggleSelectHorse(h)} 
                                 style={{...styles.card, border: isSelected?'3px solid lime':'1px solid #ccc'}}>
                                <img src={h.image} style={styles.img} onError={(e)=>e.target.src='https://placehold.co/100'}/>
                                <div><b>{h.name}</b></div>
                                <div style={{fontSize:'0.7rem', color:'#555'}}>Slots: {calculateDraftSlots(h.rarity)}</div>
                            </div>
                        )
                    })}
                </div>
                <button style={styles.btn} onClick={confirmTeam} disabled={myTeam.length!==3}>CONFIRM TEAM ➡</button>
             </div>
        )}

        {/* 2. DRAFT */}
        {phase === PHASES.DRAFT && (
            <div>
                <h2>2. เลือกการ์ดฝึก (Quota: {myDraftQuota})</h2>
                <div style={styles.grid}>
                    {draftPool.map(c => (
                        <div key={c.id} onClick={()=>handleDraftPick(c)}
                             style={{...styles.card, backgroundColor: c.styleColor, opacity: draftTurn===0?1:0.5}}>
                            <div style={{fontWeight:'bold', fontSize:'0.8rem'}}>{c.type}</div>
                            <div style={{color:'green', fontSize:'0.7rem'}}>
                                {Object.entries(c.statBonus).filter(([k,v])=>v>0).map(([k,v])=>`${k.substr(0,3)}+${v} `)}
                            </div>
                            {c.bonusAction ? <div style={{fontSize:'0.7rem'}}>🎁 {c.bonusAction.name}</div> : <div style={{fontSize:'0.7rem', color:'#999'}}>(No Item)</div>}
                        </div>
                    ))}
                </div>
                {myDraftQuota === 0 && <button style={styles.btn} onClick={()=>setPhase(PHASES.ALLOCATE)}>NEXT ➡</button>}
            </div>
        )}

        {/* 3. ALLOCATE */}
        {phase === PHASES.ALLOCATE && (
            <div style={{display:'flex', flexDirection:'column', height:'80vh', position:'relative'}}>
                <div style={{flex:1, display:'flex', justifyContent:'center', gap:'20px', alignItems:'center'}}>
                    {myTeam.map((h, i) => {
                        const selectedCard = myDraftedCards.find(c => c.id === selectedCardId);
                        const bonus = selectedCard ? selectedCard.statBonus : {};
                        return (
                            <div key={i} onClick={()=>handleApplyToHorse(i)}
                                 style={{
                                    border: selectedCardId ? '3px solid #4caf50' : '1px solid #ddd', 
                                    padding:'15px', borderRadius:'10px', width:'200px', 
                                    cursor: selectedCardId ? 'pointer' : 'default',
                                    backgroundColor: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                 }}>
                                <img src={h.image} style={styles.img} style={{width:'80px', height:'80px', borderRadius:'50%', marginBottom:'10px'}}/>
                                <h3>{h.name}</h3>
                                <div style={{textAlign:'left', fontSize:'0.9rem', lineHeight:'1.5'}}>
                                    <div>⚡ Speed: {renderStatChange(h.stats.speed, bonus.speed)}</div>
                                    <div>💖 Stamina: {renderStatChange(h.stats.stamina, bonus.stamina)}</div>
                                    <div>💪 Power: {renderStatChange(h.stats.power, bonus.power)}</div>
                                </div>
                                {h.passives?.length > 0 && <div style={{fontSize:'0.7rem', color:'purple', marginTop:'5px'}}>★ Passive: {h.passives[0].name}</div>}
                            </div>
                        )
                    })}
                </div>
                <div style={{margin:'20px 0', fontWeight:'bold', color:'#555'}}>
                   {selectedCardId ? "👇 เลือกม้าด้านบนเพื่อฝึก!" : "👇 เลือกการ์ดด้านล่างก่อน"}
                </div>
                <div style={{height:'150px', background:'#eee', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', overflowX:'auto', padding:'10px', borderRadius:'10px'}}>
                    {myDraftedCards.map(c => (
                         <div key={c.id} onClick={()=>setSelectedCardId(c.id)}
                              style={{
                                  minWidth:'100px', height:'120px', background: c.styleColor, 
                                  border: selectedCardId===c.id?'3px solid gold':'1px solid #ccc',
                                  borderRadius:'8px', padding:'5px', cursor:'pointer',
                                  display:'flex', flexDirection:'column', justifyContent:'space-between'
                              }}>
                             <div style={{fontSize:'0.8rem', fontWeight:'bold'}}>{c.name}</div>
                             <div style={{fontSize:'0.7rem', color:'green'}}>
                                {Object.entries(c.statBonus).filter(([k,v])=>v>0).map(([k,v])=>`${k.substr(0,3)}+${v}`).join(' ')}
                             </div>
                             {c.bonusAction && <div style={{fontSize:'0.6rem', background:'white', borderRadius:'4px'}}>🎁 {c.bonusAction.name}</div>}
                         </div>
                    ))}
                    {myDraftedCards.length===0 && (
                        <button style={styles.floatingBtn} onClick={startRace}>START RACE 🏁</button>
                    )}
                </div>
            </div>
        )}

        {/* 4. RACE */}
        {phase === PHASES.RACE && (
            <div style={styles.raceContainer}>
                {/* Event Markers Overlay */}
                <div style={{position:'absolute', top:0, left:0, right:0, zIndex:10, color:'white', fontSize:'0.7rem', display:'flex', justifyContent:'space-around'}}>
                    {/* แสดง Trigger Points ที่เหลืออยู่ */}
                    {RACE_TRIGGER_POINTS.map(p => (
                        <div key={p} style={{opacity: triggerPoints.includes(p) ? 1 : 0.3}}>⚡ {p}m</div>
                    ))}
                </div>

                <div style={styles.trackArea}>
                    <div style={{position:'absolute', right:'5%', height:'100%', borderRight:'3px dashed white'}}></div>
                    {raceHorses.map(h => (
                        <div key={h.instanceId} style={{
                            position:'absolute', left: `${(h.distance/TRACK_DISTANCE)*90}%`, top: `${h.lane * 40 + 30}px`,
                            transition: 'left 0.1s linear'
                        }}>
                            <img src={h.image} style={{width:'35px', height:'35px', borderRadius:'50%', border: h.isPlayer?'3px solid gold':'2px solid white'}}/>
                            {h.hasRocketStart && <span style={{position:'absolute', top:'-15px', color:'gold', fontSize:'10px'}}>🚀</span>}
                        </div>
                    ))}
                </div>

                {/* Dashboard & Modal (ย้ายมาล่างสุด) */}
                <div style={styles.bottomPanel}>
                    {!skillChance ? (
                        <div style={{color:'white'}}>Running... Lead Dist: {Math.floor(raceHorses[0]?.distance || 0)}m</div>
                    ) : (
                        <div style={styles.skillModal}>
                            {skillTargetMode ? (
                                <div>
                                    <h2>🎯 เลือกเป้าหมาย! (แตะม้า)</h2>
                                    <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
                                        {raceHorses.filter(h => !h.finishedTime).map(h => (
                                            <div key={h.instanceId} onClick={()=>handleCastSkill(h.instanceId)}
                                                 style={{cursor:'pointer', textAlign:'center', opacity: h.finishedTime ? 0.5 : 1}}>
                                                <img src={h.image} style={{width:'60px', height:'60px', borderRadius:'50%', border: h.isPlayer ? '3px solid lime' : '3px solid red'}}/>
                                                <div style={{color:'white', fontSize:'0.7rem'}}>{h.isPlayer ? "YOU" : "CPU"}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={()=>setSkillTargetMode(false)} style={{marginTop:'10px'}}>Back</button>
                                </div>
                            ) : (
                                <div>
                                    <h1>⚡ {skillChance.owner} TURN ⚡</h1>
                                    {skillChance.owner === 'PLAYER' ? (
                                        <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
                                            {handOptions.map((s, i) => (
                                                <button key={i} onClick={()=>handleSelectSkill(s)} style={styles.skillBtn}>
                                                    {s.image && <img src={s.image} style={{width:'30px', height:'30px', marginBottom:'5px'}}/>}
                                                    <div style={{fontSize:'0.8rem'}}>{s.name}</div>
                                                    <div style={{fontSize:'0.6rem'}}>({s.effectType})</div>
                                                </button>
                                            ))}
                                            <button onClick={resumeGame} style={{background:'#555', color:'white', border:'none', borderRadius:'5px'}}>Skip</button>
                                        </div>
                                    ) : <p>CPU กำลังคิด...</p>}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* 5. RESULT */}
        {phase === PHASES.RESULT && (
            <div style={styles.modalOverlay}>
                <div style={styles.modalContent}>
                    <h1>🏆 RACE RESULT</h1>
                    <div style={{display:'flex', justifyContent:'space-around', margin:'10px 0', padding:'10px', background:'#eee', borderRadius:'5px'}}>
                        <div style={{color:'green'}}><h3>PLAYER</h3><h1>{calculateTeamScore(true)} pts</h1></div>
                        <div style={{color:'red'}}><h3>CPU</h3><h1>{calculateTeamScore(false)} pts</h1></div>
                    </div>
                    <table style={{width:'100%', borderCollapse:'collapse', fontSize:'0.9rem'}}>
                        <thead>
                            <tr style={{background:'#333', color:'white'}}><th>#</th><th>Name</th><th>Time</th><th>Pts</th></tr>
                        </thead>
                        <tbody>
                            {[...raceHorses]
                                .sort((a,b) => parseFloat(a.finishedTime) - parseFloat(b.finishedTime))
                                .map((h, i) => (
                                <tr key={h.instanceId} style={{background: h.isPlayer ? '#e8f5e9' : '#ffebee', borderBottom:'1px solid #ccc'}}>
                                    <td>{i+1}</td>
                                    <td>{h.name}</td>
                                    <td>{h.finishedTime}s</td>
                                    <td><b>{SCORE_TABLE[i] || 0}</b></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button style={{...styles.btn, backgroundColor:'#2196f3'}} onClick={()=>navigate('/home')}>🏠 BACK TO HOME</button>
                    <button style={{...styles.btn, marginLeft:'10px'}} onClick={()=>window.location.reload()}>RESTART</button>
                </div>
            </div>
        )}
    </div>
  );
}

const styles = {
  container: { padding: '20px', fontFamily:'Arial', textAlign:'center', maxWidth:'1000px', margin:'0 auto', height:'100vh' },
  statusBar: { background:'#eee', padding:'5px', marginBottom:'10px' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:'10px' },
  card: { border:'1px solid #ccc', borderRadius:'8px', padding:'10px', cursor:'pointer', background:'white' },
  img: { width:'100%', height:'100px', objectFit:'cover' },
  btn: { padding:'10px 20px', background:'#e91e63', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', marginTop:'10px' },
  floatingBtn: { background:'gold', border:'none', borderRadius:'50%', width:'80px', height:'80px', fontWeight:'bold', cursor:'pointer', boxShadow:'0 4px 6px rgba(0,0,0,0.3)' },
  
  raceContainer: { position:'fixed', top:0, left:0, right:0, bottom:0, background:'#222', zIndex:100 },
  trackArea: { height:'60%', background:'#4caf50', position:'relative', borderBottom:'5px solid white' },
  
  // 🔥 ย้าย UI ทั้งหมดลงมาด้านล่างสุด
  bottomPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: '#333', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  
  skillModal: { width:'100%', height:'100%', background:'rgba(0,0,0,0.9)', padding:'20px', color:'white', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center' },
  skillBtn: { padding:'10px', margin:'5px', background:'gold', border:'none', cursor:'pointer', fontWeight:'bold', borderRadius:'5px', minWidth:'80px' },
  
  modalOverlay: { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:300 },
  modalContent: { background:'white', padding:'30px', borderRadius:'10px', width:'450px' }
};

export default Battle;