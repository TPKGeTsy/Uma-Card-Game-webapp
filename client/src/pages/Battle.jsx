import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function Battle() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // --- Game Phases ---
  const [phase, setPhase] = useState(0);
  // 0: LOAD, 1: DRAFT, 2: SETUP, 3: RACE, 4: RESULT

  // --- Data ---
  const [trackInfo, setTrackInfo] = useState({ name: 'Loading...', distance: 2400, weather: 'Sunny', conditionMultiplier: 1.0 });
  const [draftPool, setDraftPool] = useState([]);      
  const [myInventoryHorses, setMyInventoryHorses] = useState([]); 
  
  // --- Player Selection ---
  const [myDraftedCards, setMyDraftedCards] = useState([]); 
  const [myTeam, setMyTeam] = useState([]); 

  // --- Action Cards ---
  const [actionDeck, setActionDeck] = useState([]);
  const [actionHand, setActionHand] = useState([]);
  const [selectedActionCard, setSelectedActionCard] = useState(null);

  // --- Race Logic ---
  const [raceHorses, setRaceHorses] = useState([]);
  const [avgDistance, setAvgDistance] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  
  // Event Config
  const BASE_EVENTS = [
    { distance: 600, name: "⚡ โค้งแรกวัดใจ (First Corner)" },
    { distance: 1200, name: "🌲 เนินมรณะ (Stamina Check)" },
    { distance: 1800, name: "🔥 โค้งสุดท้าย (Last Corner)" }
  ];
  const [activeEvents, setActiveEvents] = useState([]);
  const raceInterval = useRef(null);

  // ==========================================
  // 1. Initial Load
  // ==========================================
  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    initGame();
  }, []);

  const initGame = async () => {
    try {
      // 1. ดึง Inventory
      const userRes = await axios.get('http://localhost:5000/api/user/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // กรองม้า
      const horses = userRes.data
        .filter(item => item.cardId && item.cardId.type === 'HORSE')
        .map(item => item.cardId);
        
      setMyInventoryHorses(horses);

      // 2. ดึง Draft Pool
      const poolRes = await axios.get('http://localhost:5000/api/game/draft-pool', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDraftPool(poolRes.data.pool);
      
      setTrackInfo({ name: poolRes.data.trackName || "Tokyo 2400m", distance: 2400, weather: "Sunny ☀", conditionMultiplier: 1.0 });
      
      // Mock Action Cards (ถ้าอยากดึงจาก DB จริงต้องแก้ตรงนี้)
      setActionDeck([
          { id: 'ac1', name: 'Whip', effect: 'SPEED', value: 50, desc: 'เร่งความเร็ว', image: 'https://placehold.co/100x140/333/white?text=Whip' },
          { id: 'ac2', name: 'Carrot', effect: 'HEAL', value: 200, desc: 'ฮีล Stamina', image: 'https://placehold.co/100x140/orange/white?text=Carrot' },
          { id: 'ac3', name: 'Shout', effect: 'BUFF_ALL', value: 30, desc: 'บัฟทีม', image: 'https://placehold.co/100x140/blue/white?text=Shout' },
          { id: 'ac4', name: 'Focus', effect: 'HEAL', value: 100, desc: 'ตั้งสมาธิ', image: 'https://placehold.co/100x140/green/white?text=Focus' },
          { id: 'ac5', name: 'Spurt', effect: 'SPEED', value: 100, desc: 'พุ่งชน', image: 'https://placehold.co/100x140/red/white?text=Spurt' },
      ]);

      setPhase(0);
    } catch (error) {
      console.error(error);
    }
  };

  // ==========================================
  // Phase 1 & 2 Logic
  // ==========================================
  const handleDraftCard = (card) => {
    if (myDraftedCards.find(c => c._id === card._id)) return;
    if (myDraftedCards.length < 4) setMyDraftedCards([...myDraftedCards, card]);
  };

  const handleSelectHorse = (horse) => {
    if (myTeam.find(h => h._id === horse._id)) {
        setMyTeam(myTeam.filter(h => h._id !== horse._id));
    } else {
        if (myTeam.length < 3) {
            setMyTeam([...myTeam, { ...horse, strategy: 'BETWEENER' }]); 
        }
    }
  };

  const handleSetStrategy = (horseId, strategy) => {
    setMyTeam(myTeam.map(h => h._id === horseId ? { ...h, strategy } : h));
  };

  const STRATEGIES = {
    RUNNER: { label: 'นำ (Runner)', desc: 'ไวต้น แผ่วปลาย', color: '#ff5722' },
    BETWEENER: { label: 'กลาง (Betweener)', desc: 'สมดุล', color: '#2196f3' },
    CHASER: { label: 'เสียบ (Chaser)', desc: 'ออมแรง ระเบิดปลาย', color: '#9c27b0' }
  };

  // ==========================================
  // Phase 3: Race Logic (แก้บั๊ก Speed ตรงนี้)
  // ==========================================
  const startRace = () => {
    const shuffled = [...actionDeck].sort(() => 0.5 - Math.random());
    setActionHand(shuffled.slice(0, 3));

    const runners = myTeam.map((horse, index) => {
        const baseSpeed = (horse.stats?.speed || 600);
        const baseStamina = (horse.stats?.stamina || 600) * 10;
        
        return {
            ...horse,
            instanceId: index,
            currentSpeed: baseSpeed,
            currentStamina: baseStamina,
            maxStamina: baseStamina,
            distanceRun: 0,
            rank: index + 1,
            chibiImage: horse.chibiImage || horse.image
        };
    });

    setActiveEvents(BASE_EVENTS.map(ev => ({ ...ev, triggered: false, isActive: Math.random() < 0.7 })));
    setRaceHorses(runners);
    setPhase(3);
  };

  useEffect(() => {
    if (phase === 3 && !isPaused) {
      raceInterval.current = setInterval(() => {
        setRaceHorses(prevHorses => {
          let allFinished = true;
          let totalDist = 0;

          const updatedHorses = prevHorses.map(horse => {
            if (horse.distanceRun >= trackInfo.distance) {
                totalDist += trackInfo.distance;
                return horse; 
            }
            allFinished = false;

            // --- ⚠️ แก้ไข Logic ความเร็วตรงนี้ ⚠️ ---
            const progress = (horse.distanceRun / trackInfo.distance) * 100;
            let strategyMult = 1.0;

            if (horse.strategy === 'RUNNER') {
                if (progress < 30) strategyMult = 1.3;
                else if (progress > 80) strategyMult = 0.8;
            } 
            else if (horse.strategy === 'CHASER') {
                if (progress < 50) strategyMult = 0.8;
                else if (progress > 80) strategyMult = 1.5;
            }

            // 1. ประกาศตัวแปร speed ให้ถูกต้องใน scope นี้
            let speed = horse.currentSpeed * strategyMult;
            
            // 2. ถ้าหมดแรง ลดความเร็ว (แต่ไม่ให้หยุดเดิน)
            if (horse.currentStamina <= 0) speed *= 0.2;
            
            // 3. ปรับสูตรการเคลื่อนที่ (แก้จาก /30 เป็น * 0.05 ให้ไวขึ้น)
            const move = (speed * 0.05); 
            const newDist = horse.distanceRun + move;
            totalDist += newDist;

            // 4. ลดการกินแรง
            let drain = 0.8 * trackInfo.conditionMultiplier;
            if (horse.strategy === 'RUNNER' && progress < 30) drain *= 1.2;
            if (horse.strategy === 'CHASER' && progress < 50) drain *= 0.6;

            return {
                ...horse,
                distanceRun: newDist,
                currentStamina: Math.max(0, horse.currentStamina - drain)
            };
          });

          // Sort Rank
          const sorted = [...updatedHorses].sort((a, b) => b.distanceRun - a.distanceRun);
          const ranked = updatedHorses.map(h => ({
              ...h, rank: sorted.findIndex(x => x.instanceId === h.instanceId) + 1
          }));

          const avg = totalDist / 3;
          setAvgDistance(avg);
          checkEventTrigger(avg);

          if (allFinished) { clearInterval(raceInterval.current); setPhase(4); }
          return ranked;
        });
      }, 100);
    }
    return () => clearInterval(raceInterval.current);
  }, [phase, isPaused, activeEvents]);

  // (Helper Functions)
  const checkEventTrigger = (avgDist) => {
    const idx = activeEvents.findIndex(e => !e.triggered && avgDist >= e.distance);
    if (idx !== -1) {
        if (activeEvents[idx].isActive) { setIsPaused(true); setCurrentEvent(activeEvents[idx]); }
        const newEvs = [...activeEvents]; newEvs[idx].triggered = true; setActiveEvents(newEvs);
    }
  };
  const resumeRace = () => { setIsPaused(false); setCurrentEvent(null); setSelectedActionCard(null); };
  const handleCardClick = (c) => isPaused && setSelectedActionCard(selectedActionCard?.id === c.id ? null : c);
  const handleTargetHorse = (idx) => {
      if (!selectedActionCard || !isPaused) return;
      setRaceHorses(prev => {
          const newH = [...prev]; const t = newH[idx];
          if (selectedActionCard.effect === 'HEAL') t.currentStamina = Math.min(t.maxStamina, t.currentStamina + selectedActionCard.value);
          else if (selectedActionCard.effect === 'SPEED') t.currentSpeed += selectedActionCard.value;
          else if (selectedActionCard.effect === 'BUFF_ALL') newH.forEach(h => h.currentSpeed += selectedActionCard.value);
          return newH;
      });
      setActionHand(actionHand.filter(c => c.id !== selectedActionCard.id)); setSelectedActionCard(null);
  };

  // --- RENDER ---
  if (phase === 0) return (
      <div style={styles.container}>
          <h1>🏟️ {trackInfo.name}</h1>
          <button style={styles.bigBtn} onClick={() => setPhase(1)}>Start Game 🚀</button>
      </div>
  );

  if (phase === 1) return (
      <div style={styles.container}>
          <h2>Phase 1: Draft Training Card ({myDraftedCards.length}/4)</h2>
          <div style={styles.grid}>
              {draftPool.map(c => (
                  <div key={c._id} onClick={() => handleDraftCard(c)} style={{...styles.card, opacity: myDraftedCards.find(x=>x._id===c._id)?0.3:1}}>
                      <img src={c.image} style={styles.img} />
                      <div>{c.name}</div>
                  </div>
              ))}
          </div>
          {myDraftedCards.length === 4 && <button style={styles.floatBtn} onClick={() => setPhase(2)}>Next ➡</button>}
      </div>
  );

  if (phase === 2) return (
      <div style={styles.container}>
          <h2>Phase 2: จัดทีมลงสนาม ({myTeam.length}/3)</h2>
          <div style={styles.teamZone}>
              {myTeam.map(horse => (
                  <div key={horse._id} style={styles.teamCard}>
                      <img src={horse.image} style={styles.teamImg} />
                      <div style={{fontWeight:'bold'}}>{horse.name}</div>
                      <select style={{marginTop:'5px'}} value={horse.strategy} onChange={(e) => handleSetStrategy(horse._id, e.target.value)}>
                          {Object.keys(STRATEGIES).map(k => <option key={k} value={k}>{STRATEGIES[k].label}</option>)}
                      </select>
                  </div>
              ))}
              {[...Array(3 - myTeam.length)].map((_, i) => <div key={i} style={styles.emptySlot}>เลือกม้า</div>)}
          </div>
          {myTeam.length === 3 && <button style={styles.bigBtn} onClick={startRace}>🏁 START RACE</button>}
          <div style={styles.grid}>
              {myInventoryHorses.map(horse => {
                  const isSelected = myTeam.find(h => h._id === horse._id);
                  return (
                    <div key={horse._id} onClick={() => handleSelectHorse(horse)} style={{...styles.card, border: isSelected?'3px solid green':'1px solid #ccc'}}>
                        <img src={horse.image} style={styles.img} />
                        <div>{horse.name}</div>
                    </div>
                  )
              })}
          </div>
      </div>
  );

  if (phase === 3) return (
      <div style={styles.container}>
          {isPaused && <div style={styles.dimOverlay}></div>}
          <div style={styles.liveHud}>
              <h4 style={{margin:'0 0 5px 0', borderBottom:'1px solid #555', color:'#ddd'}}>📊 LIVE MONITOR</h4>
              {raceHorses.map((horse) => (
                  <div key={horse.instanceId} style={styles.hudRow}>
                      <img src={horse.image} style={styles.hudAvatar} />
                      <div style={{flex:1}}>
                          <div style={{fontSize:'0.7rem', display:'flex', justifyContent:'space-between', color:'white'}}>
                              <span>#{horse.rank} {horse.name}</span>
                              <span>{Math.floor(horse.currentSpeed/10)} km/h</span>
                          </div>
                          <div style={styles.miniBarBg}>
                              <div style={{...styles.miniBarFill, width: `${(horse.currentStamina/horse.maxStamina)*100}%`, backgroundColor: horse.currentStamina < 200 ? 'red' : '#00e676'}}></div>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
          <div style={{...styles.hudHeader, border: isPaused ? '3px solid #e91e63' : '1px solid #ccc'}}>
              {isPaused ? <div style={styles.eventBanner}><h1>⚠ EVENT: {currentEvent?.name} ⚠</h1></div> : <div><h2>🏟️ {trackInfo.name}</h2><div>AVG DIST: {Math.floor(avgDistance)} / {trackInfo.distance} m</div></div>}
              {isPaused && <button style={styles.resumeBtn} onClick={resumeRace}>RESUME ▶</button>}
          </div>
          <div style={{...styles.raceField, zIndex: isPaused ? 20 : 1}}>
              {raceHorses.map((horse, index) => {
                  const progress = (horse.distanceRun / trackInfo.distance) * 100;
                  const isTargetable = isPaused && selectedActionCard !== null;
                  return (
                      <div key={index} onClick={() => handleTargetHorse(index)} style={{...styles.lane, cursor: isTargetable ? 'pointer' : 'default', backgroundColor: isTargetable ? 'rgba(255,235,59,0.1)' : '#333', border: isTargetable ? '2px dashed gold' : 'none'}}>
                          <div style={{...styles.chibiBox, left: `${Math.min(progress, 94)}%`}}>
                              <div style={styles.rankBadge}>{horse.rank}</div>
                              <img src={horse.chibiImage} style={styles.chibiImg} alt="runner"/>
                              <div style={styles.nameTag}>{horse.name}</div>
                          </div>
                          <div style={{position:'absolute', right:'5px', top:'5px', fontSize:'0.7rem', color:'#aaa'}}>{STRATEGIES[horse.strategy].label}</div>
                      </div>
                  )
              })}
              <div style={{position:'absolute', top:0, bottom:0, left:`${(avgDistance/trackInfo.distance)*100}%`, borderLeft:'2px dashed #fff', opacity:0.5}} />
          </div>
          <div style={{...styles.handZone, zIndex: isPaused ? 20 : 1}}>
              <div style={styles.cardRow}>
                  {actionHand.map(c => (
                      <div key={c.id} onClick={() => handleCardClick(c)} style={{...styles.actionCard, border: selectedActionCard?.id===c.id?'3px solid gold':'1px solid #ccc', opacity: isPaused?1:0.5, pointerEvents:isPaused?'auto':'none'}}>
                          <img src={c.image} style={{width:'100%', height:'80px', objectFit:'cover', borderRadius:'5px'}} />
                          <div style={{fontWeight:'bold', fontSize:'0.9rem'}}>{c.name}</div>
                          <div style={{fontSize:'0.8rem', color:'blue'}}>{c.effect}</div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  if (phase === 4) return <div style={styles.container}><h1>🏁 FINISH!</h1><Link to="/home"><button style={styles.bigBtn}>Back Home</button></Link></div>
}

// Styles
const styles = {
    container: { maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'Arial', position: 'relative' },
    bigBtn: { padding: '15px 40px', fontSize: '1.5rem', backgroundColor: '#e91e63', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', display:'block', margin:'20px auto' },
    floatBtn: { position:'fixed', bottom:'20px', right:'20px', padding:'15px 30px', backgroundColor:'#2196f3', color:'white', borderRadius:'30px', border:'none', cursor:'pointer', boxShadow:'0 4px 10px rgba(0,0,0,0.3)' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', marginTop:'20px' },
    card: { border: '1px solid #ddd', borderRadius: '10px', padding: '10px', textAlign: 'center', cursor: 'pointer', backgroundColor:'white' },
    img: { width: '100%', height: '120px', objectFit: 'cover', borderRadius: '5px' },
    teamZone: { display:'flex', justifyContent:'center', gap:'20px', margin:'20px 0' },
    teamCard: { width:'150px', padding:'10px', border:'2px solid #2196f3', borderRadius:'10px', textAlign:'center', backgroundColor:'#e3f2fd' },
    teamImg: { width:'100%', height:'150px', objectFit:'cover', borderRadius:'5px' },
    emptySlot: { width:'150px', height:'200px', border:'2px dashed #ccc', display:'flex', alignItems:'center', justifyContent:'center', color:'#999' },
    dimOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10 },
    liveHud: { position: 'absolute', top: '10px', left: '-180px', width: '170px', backgroundColor: 'rgba(0,0,0,0.9)', padding: '10px', borderRadius: '10px', zIndex: 5 },
    hudRow: { display: 'flex', alignItems: 'center', marginBottom: '10px' },
    hudAvatar: { width:'40px', height:'40px', borderRadius:'50%', marginRight:'10px', border:'2px solid white', objectFit:'cover' },
    miniBarBg: { width: '100%', height: '5px', backgroundColor: '#555', marginTop: '3px', borderRadius: '3px' },
    miniBarFill: { height: '100%', borderRadius: '3px', transition: 'width 0.2s' },
    hudHeader: { position: 'relative', zIndex: 20, backgroundColor: 'white', padding: '15px', borderRadius: '10px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' },
    eventBanner: { color: '#e91e63', animation: 'pulse 1s infinite', textAlign:'center', width:'100%' },
    resumeBtn: { padding: '10px 20px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight:'bold' },
    raceField: { position: 'relative', backgroundColor: '#222', padding: '20px', borderRadius: '10px', marginBottom: '20px' },
    lane: { position: 'relative', height: '80px', marginBottom: '10px', borderRadius: '5px', backgroundColor:'#333', borderBottom:'1px dashed #555' },
    chibiBox: { position: 'absolute', top: '5px', transition: 'left 0.1s linear', zIndex: 2, textAlign:'center', width:'60px' },
    chibiImg: { width:'60px', height:'60px', objectFit:'contain' },
    nameTag: { backgroundColor:'rgba(0,0,0,0.7)', color:'white', fontSize:'0.6rem', padding:'2px', borderRadius:'3px', marginTop:'-5px' },
    rankBadge: { position:'absolute', top:0, left:0, backgroundColor:'gold', color:'black', width:'20px', height:'20px', borderRadius:'50%', fontSize:'0.8rem', fontWeight:'bold', lineHeight:'20px', boxShadow:'0 2px 5px rgba(0,0,0,0.5)' },
    handZone: { position: 'relative', backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '10px', textAlign: 'center' },
    cardRow: { display: 'flex', justifyContent: 'center', gap: '15px' },
    actionCard: { width: '100px', padding: '10px', backgroundColor: 'white', borderRadius: '8px', cursor: 'pointer', boxShadow:'0 2px 5px rgba(0,0,0,0.1)' }
};

export default Battle;