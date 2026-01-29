import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { TRACKS } from '../data/track';
import { TRAINING_CARDS } from '../data/trainingCards';
import BattleRace from './BattleRace';

// Config & Constants
const PHASES = { LOAD: 0, SETUP: 1, DRAFT: 2, ALLOCATE: 3, RACE: 4, RESULT: 5 };

// ==========================================
// 🧩 SUB-COMPONENT: BATTLE SETUP (Phase 1)
// ==========================================
function BattleSetup({ onConfirmTeam, trackInfo, triggerPoints, inventoryHorses, inventoryActions }) {
    const [myTeam, setMyTeam] = useState([]);

    const STRATEGIES = {
        RUNNER: { label: 'นำ (Runner)', color: '#ff9800' },
        BETWEENER: { label: 'กลาง (Betweener)', color: '#2196f3' },
        CHASER: { label: 'เสียบ (Chaser)', color: '#9c27b0' }
    };

    const toggleSelectHorse = (horse) => {
        const exists = myTeam.find(h => h._id === horse._id);
        if (exists) {
            setMyTeam(myTeam.filter(h => h._id !== horse._id));
        } else {
            if (myTeam.length < 3) {
                setMyTeam([...myTeam, { ...horse, strategy: 'BETWEENER' }]);
            }
        }
    };

    const changeStrategy = (horseId, newStrat) => {
        setMyTeam(prev => prev.map(h => h._id === horseId ? { ...h, strategy: newStrat } : h));
    };

    if (!trackInfo) return <div style={{color:'white', textAlign:'center'}}>กำลังโหลดข้อมูลสนาม...</div>;

    return (
        <div style={setupStyles.container}>
            {/* ฝั่งซ้าย: สนาม */}
            <div style={setupStyles.leftPanel}>
                <div style={setupStyles.trackCard}>
                    <img src={trackInfo.image} alt={trackInfo.name} style={setupStyles.trackImg} onError={(e) => e.target.src = 'https://placehold.co/600x400?text=No+Track+Image'} />
                    <div style={setupStyles.trackOverlay}>
                        <h2 style={{margin:0, textShadow:'2px 2px 4px black'}}>{trackInfo.name}</h2>
                        <div style={{color:'#ffeb3b', fontWeight:'bold', marginTop:'5px'}}>🚩 {trackInfo.distance}m | 🌦️ {trackInfo.weather}</div>
                        <p style={{fontStyle:'italic', fontSize:'0.9rem', opacity:0.9}}>"{trackInfo.description}"</p>
                    </div>
                </div>
                <div style={setupStyles.trackInfoBox}>
                     <div style={{color:'#d32f2f', fontWeight:'bold', border:'1px dashed red', padding:'10px', borderRadius:'8px', background:'rgba(255, 235, 238, 0.9)'}}>
                        ⚡ จุดใช้สกิล (Trigger Points)<br/><span style={{fontSize:'1.1rem'}}>{triggerPoints.join('m ➜ ')}m</span>
                    </div>
                    <div style={{marginTop:'15px', color:'#eee', fontSize:'0.9rem'}}>🎒 การ์ด Action ใน Deck: <b>{inventoryActions.length}</b> ใบ</div>
                </div>
            </div>

            {/* ฝั่งขวา: จัดทีม */}
            <div style={setupStyles.rightPanel}>
                <div style={setupStyles.teamSlotsContainer}>
                    <h3 style={{color:'white', margin:'0 0 10px 0'}}>ทีมของคุณ ({myTeam.length}/3)</h3>
                    <div style={setupStyles.slotsFlex}>
                        {[0, 1, 2].map(index => {
                            const horse = myTeam[index];
                            return (
                                <div key={index} style={setupStyles.slotBox}>
                                    {horse ? (
                                        <div style={{width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center'}}>
                                            <img src={horse.image} style={setupStyles.slotImg} />
                                            <button onClick={()=>toggleSelectHorse(horse)} style={setupStyles.removeBtn}>✕</button>
                                            <div style={setupStyles.slotNameBox}>{horse.name}</div>
                                            <select 
                                                value={horse.strategy} 
                                                onChange={(e) => changeStrategy(horse._id, e.target.value)}
                                                style={{...setupStyles.strategySelect, border: `2px solid ${STRATEGIES[horse.strategy].color}`}}
                                            >
                                                {Object.keys(STRATEGIES).map(key => (<option key={key} value={key}>{STRATEGIES[key].label}</option>))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div style={{color:'#555', fontSize:'2rem'}}>+</div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    <button 
                        style={{...setupStyles.confirmBtn, opacity: myTeam.length===3 ? 1 : 0.5, cursor: myTeam.length===3 ? 'pointer' : 'not-allowed'}} 
                        onClick={() => onConfirmTeam(myTeam)} disabled={myTeam.length!==3}
                    >
                        CONFIRM TEAM 🚀
                    </button>
                </div>

                <div style={setupStyles.inventoryContainer}>
                    <h4 style={{color:'#ccc', margin:'10px 0'}}>เลือกม้าเข้าคอก</h4>
                    <div style={setupStyles.grid}>
                        {inventoryHorses.map(h => {
                            const isSelected = myTeam.find(t=>t._id===h._id);
                            return (
                                <div key={h._id} onClick={()=>toggleSelectHorse(h)} style={{...setupStyles.card, border: isSelected ? '3px solid #4caf50' : '1px solid #444', opacity: isSelected ? 0.6 : 1}}>
                                    <img src={h.image} style={setupStyles.cardImg} onError={(e)=>e.target.src='https://placehold.co/100'} />
                                    <div style={{fontSize:'0.8rem', color:'white', marginTop:'5px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{h.name}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 🃏 SUB-COMPONENT: BATTLE DRAFT (Phase 2)
// ==========================================
function BattleDraft({ onDraftComplete }) {
    const [draftedCards, setDraftedCards] = useState([]);
    const [currentOptions, setCurrentOptions] = useState([]);

    useEffect(() => {
        rollOptions();
    }, []);

    const rollOptions = () => {
        const pool = [...TRAINING_CARDS];
        const options = [];
        while(options.length < 3) {
            const rand = pool[Math.floor(Math.random() * pool.length)];
            if (!options.find(o => o.id === rand.id)) options.push(rand);
        }
        setCurrentOptions(options);
    };

    const handleSelectCard = (card) => {
        const newDeck = [...draftedCards, card];
        setDraftedCards(newDeck);
        if (newDeck.length >= 4) {
            setTimeout(() => onDraftComplete(newDeck), 500);
        } else {
            rollOptions();
        }
    };

    return (
        <div style={{textAlign:'center', maxWidth:'900px', margin:'0 auto', color:'white'}}>
            <h2 style={{fontSize:'2rem', textShadow:'0 0 10px #e91e63'}}>🎴 Phase 2: Roguelike Draft</h2>
            <p style={{color:'#aaa'}}>เลือกการ์ดฝึกซ้อมเพื่ออัปเกรด Stat ม้าของคุณ</p>
            <div style={{margin:'20px auto', width:'300px', height:'10px', background:'#333', borderRadius:'5px', overflow:'hidden'}}>
                <div style={{width:`${(draftedCards.length/4)*100}%`, height:'100%', background:'#00e676', transition:'width 0.3s'}}></div>
            </div>
            <div style={{marginBottom:'30px'}}>เลือกไปแล้ว: {draftedCards.length} / 4 ใบ</div>

            <div style={{display:'flex', justifyContent:'center', gap:'20px', flexWrap:'wrap'}}>
                {currentOptions.map((card, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => handleSelectCard(card)}
                        style={{
                            width:'200px', height:'280px', 
                            background:'#2a2a2a', border:'2px solid #555', borderRadius:'15px', 
                            cursor:'pointer', padding:'15px', transition:'transform 0.2s',
                            display:'flex', flexDirection:'column', alignItems:'center', position:'relative',
                            boxShadow:'0 4px 15px rgba(0,0,0,0.5)'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.borderColor = '#e91e63'; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#555'; }}
                    >
                        <div style={{alignSelf:'flex-start', padding:'2px 8px', background:'#e91e63', borderRadius:'4px', fontSize:'0.7rem', color:'white', fontWeight:'bold'}}>{card.type}</div>
                        <div style={{fontWeight:'bold', fontSize:'1.1rem', margin:'10px 0', height:'40px', display:'flex', alignItems:'center'}}>{card.name}</div>
                        <div style={{fontSize:'0.9rem', color:'#aaa', fontStyle:'italic', marginBottom:'10px', minHeight:'40px'}}>{card.desc}</div>
                        
                        <div style={{width:'100%', background:'#111', padding:'10px', borderRadius:'8px', marginTop:'auto'}}>
                            {Object.keys(card.stats).map(key => (
                                <div key={key} style={{display:'flex', justifyContent:'space-between', fontSize:'0.9rem'}}>
                                    <span style={{textTransform:'capitalize', color:'#ccc'}}>{key}</span>
                                    <span style={{color: card.stats[key] > 0 ? '#00e676' : 'red'}}>
                                        {card.stats[key] > 0 ? '+' : ''}{card.stats[key]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ==========================================
// 🛠️ SUB-COMPONENT: BATTLE ALLOCATE (Phase 3)
// ==========================================
function BattleAllocate({ team, draftedCards, onAllocateComplete }) {
    const [allocations, setAllocations] = useState({});
    const [selectedCard, setSelectedCard] = useState(null);

    useEffect(() => {
        const init = {};
        team.forEach(h => init[h._id] = []);
        setAllocations(init);
    }, [team]);

    const calculateTotalStats = (horse, equippedCards) => {
        const base = horse.stats || { speed:0, stamina:0, power:0, guts:0, wisdom:0 };
        const bonus = { speed:0, stamina:0, power:0, guts:0, wisdom:0 };

        equippedCards.forEach(c => {
            if(c.stats) {
                Object.keys(c.stats).forEach(k => {
                    if(bonus[k] !== undefined) bonus[k] += c.stats[k];
                });
            }
        });
        return { base, bonus };
    };

    const handleCardClick = (card) => {
        const ownerId = Object.keys(allocations).find(hid => allocations[hid].find(c => c.id === card.id));
        if (ownerId) {
            setAllocations(prev => ({
                ...prev,
                [ownerId]: prev[ownerId].filter(c => c.id !== card.id)
            }));
        } else {
            setSelectedCard(card.id === selectedCard?.id ? null : card);
        }
    };

    const handleHorseClick = (horse) => {
        if (!selectedCard) return;
        setAllocations(prev => ({
            ...prev,
            [horse._id]: [...(prev[horse._id] || []), selectedCard]
        }));
        setSelectedCard(null);
    };

    return (
        <div style={{textAlign:'center', maxWidth:'1200px', margin:'0 auto', color:'white'}}>
            <h2 style={{fontSize:'2rem', marginBottom:'10px'}}>🛠️ Phase 3: Training Allocation</h2>
            <p style={{color:'#aaa', marginBottom:'30px'}}>เลือกการ์ดฝึกซ้อม ใส่ให้ม้าเพื่อเพิ่ม Stat (ซ้ายรูป - ขวาพลัง)</p>

            <div style={{display:'flex', gap:'20px', justifyContent:'center', marginBottom:'40px', flexWrap:'wrap'}}>
                {team.map(horse => {
                    const equipped = allocations[horse._id] || [];
                    const { base, bonus } = calculateTotalStats(horse, equipped);
                    const isTargetable = selectedCard !== null;

                    return (
                        <div 
                            key={horse._id}
                            onClick={() => handleHorseClick(horse)}
                            style={{
                                width: '450px', // ✅ กว้างขึ้นเพื่อให้วางซ้ายขวาได้
                                height: '220px', 
                                background: isTargetable ? '#1e3a2a' : '#2a2a2a',
                                border: isTargetable ? '2px dashed #00e676' : '2px solid #444',
                                borderRadius: '15px', 
                                overflow: 'hidden',
                                cursor: isTargetable ? 'pointer' : 'default',
                                transition: 'all 0.2s',
                                display: 'flex', // ✅ Flex Row (แนวนอน)
                                flexDirection: 'row'
                            }}
                        >
                            {/* 🖼️ BOX 1: ฝั่งซ้าย (รูปม้า) */}
                            <div style={{width: '160px', position: 'relative', borderRight: '1px solid #444'}}>
                                <img src={horse.image} style={{width:'100%', height:'100%', objectFit:'cover', objectPosition:'top center'}} />
                                <div style={{
                                    position:'absolute', bottom:0, width:'100%', 
                                    background:'rgba(0,0,0,0.85)', color:'white', 
                                    fontWeight:'bold', fontSize:'0.9rem', padding:'5px 0',
                                    textAlign: 'center'
                                }}>
                                    {horse.name}
                                </div>
                            </div>

                            {/* 📊 BOX 2: ฝั่งขวา (Stats & Cards) */}
                            <div style={{flex: 1, display: 'flex', flexDirection: 'column', padding: '10px'}}>
                                
                                {/* ตาราง Stats */}
                                <div style={{flex: 1, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2px 15px', alignContent: 'center'}}>
                                    {['speed','stamina','power','guts','wisdom'].map(stat => (
                                        <div key={stat} style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #333', paddingBottom:'2px', fontSize:'0.85rem'}}>
                                            <span style={{textTransform:'capitalize', color:'#aaa'}}>{stat.slice(0,3)}</span>
                                            <span>
                                                {base[stat]}
                                                {bonus[stat] !== 0 && (
                                                    <span style={{color: bonus[stat]>0 ? '#00e676':'red', marginLeft:'5px', fontWeight:'bold'}}>
                                                        ({bonus[stat]>0?'+':''}{bonus[stat]})
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* ช่องใส่การ์ด (ด้านล่างขวา) */}
                                <div style={{marginTop:'auto', paddingTop:'8px', borderTop:'1px solid #444'}}>
                                    <div style={{fontSize:'0.7rem', color:'#777', marginBottom:'4px', textAlign:'left'}}>Cards:</div>
                                    <div style={{display:'flex', gap:'5px', overflowX: 'auto'}}>
                                        {equipped.length === 0 && <span style={{fontSize:'0.7rem', color:'#444'}}>Empty..</span>}
                                        {equipped.map((c, i) => (
                                            <div key={i} style={{
                                                fontSize:'0.6rem', padding:'2px 6px', 
                                                background:'#333', borderRadius:'4px', 
                                                border: '1px solid #00e676', color: '#00e676',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {c.name.slice(0,8)}..
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* การ์ดในมือ */}
            <div style={{background:'#222', padding:'20px', borderRadius:'15px', border:'1px solid #444'}}>
                <h4 style={{marginTop:0, color:'#ddd'}}>การ์ดที่ดราฟมา ({draftedCards.length})</h4>
                <div style={{display:'flex', justifyContent:'center', gap:'15px', flexWrap:'wrap'}}>
                    {draftedCards.map(card => {
                        const ownerId = Object.keys(allocations).find(hid => allocations[hid].find(c => c.id === card.id));
                        const isSelected = selectedCard?.id === card.id;
                        
                        return (
                            <div 
                                key={card.id}
                                onClick={() => handleCardClick(card)}
                                style={{
                                    width:'120px', height:'160px', 
                                    background: isSelected ? '#1e3a2a' : '#333',
                                    border: isSelected ? '2px solid #00e676' : '1px solid #555',
                                    borderRadius:'8px', cursor:'pointer', padding:'10px',
                                    opacity: ownerId ? 0.3 : 1, 
                                    display:'flex', flexDirection:'column', justifyContent:'space-between'
                                }}
                            >
                                <div style={{fontSize:'0.8rem', fontWeight:'bold', color: isSelected?'#00e676':'white'}}>{card.name}</div>
                                <div style={{fontSize:'0.7rem', color:'#aaa'}}>{card.desc}</div>
                                <div style={{fontSize:'0.75rem', color:'#00e676', fontWeight:'bold'}}>
                                    {Object.keys(card.stats).filter(k=>k!=='text').map(k => `${k.toUpperCase().slice(0,3)} ${card.stats[k]>0?'+':''}${card.stats[k]}`).join(' ')}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <button 
                onClick={() => onAllocateComplete(allocations)}
                style={{
                    marginTop:'30px', padding:'15px 50px', fontSize:'1.2rem', 
                    background:'linear-gradient(45deg, #e91e63, #ff4081)', border:'none', 
                    borderRadius:'50px', color:'white', fontWeight:'bold', cursor:'pointer'
                }}
            >
                START RACE 🏁
            </button>
        </div>
    );
}

// ==========================================
// 🎮 MAIN COMPONENT: BATTLE
// ==========================================
function Battle() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  const [phase, setPhase] = useState(PHASES.LOAD);
  const [trackInfo, setTrackInfo] = useState(null);
  const [triggerPoints, setTriggerPoints] = useState([]);
  const [myInventoryHorses, setMyInventoryHorses] = useState([]);
  const [myInventoryActions, setMyInventoryActions] = useState([]); 
  const [myTeam, setMyTeam] = useState([]);
  const [draftedDeck, setDraftedDeck] = useState([]); 

  useEffect(() => {
    fetchUserData();
    randomizeTrack();
  }, []);

  const fetchUserData = async () => {
    try {
        if (!token) {
            setMyInventoryHorses([
                { _id: 'm1', name: "Mock Week", rarity: "N", image: "https://placehold.co/100", stats: { speed: 600 } },
                { _id: 'm2', name: "Mock Suzuka", rarity: "SSR", image: "https://placehold.co/100", stats: { speed: 1000 } }
            ]);
            setMyInventoryActions([]);
            setPhase(PHASES.SETUP);
            return;
        }
        const res = await axios.get('http://localhost:5000/api/user/inventory', { headers: { Authorization: `Bearer ${token}` } });
        setMyInventoryHorses(res.data.filter(i => i.cardId?.type === 'HORSE').map(i => i.cardId));
        setMyInventoryActions(res.data.filter(i => i.cardId?.type === 'ACTION').map(i => i.cardId));
        setPhase(PHASES.SETUP);
    } catch (err) { console.error("Load Error:", err); }
  };

  const randomizeTrack = () => {
      const randomIndex = Math.floor(Math.random() * TRACKS.length);
      const selectedTrack = TRACKS[randomIndex];
      const weather = selectedTrack.weatherOptions ? selectedTrack.weatherOptions[Math.floor(Math.random() * selectedTrack.weatherOptions.length)] : "Sunny";
      const finalTrackInfo = { ...selectedTrack, weather };
      setTrackInfo(finalTrackInfo);
      
      let availablePoints = finalTrackInfo.landmarks ? [...finalTrackInfo.landmarks] : [];
      if (availablePoints.length > 0) {
          const minPoints = 3; const maxPoints = availablePoints.length;
          const countToPick = Math.floor(Math.random() * (maxPoints - minPoints + 1)) + minPoints;
          let pickedPoints = availablePoints.sort(() => 0.5 - Math.random()).slice(0, countToPick).map(l => l.distance).sort((a, b) => a - b);
          setTriggerPoints(pickedPoints.map(dist => Math.max(0, Math.min(dist + (Math.floor(Math.random() * 101) - 50), finalTrackInfo.distance))));
      } else { setTriggerPoints([500, 1000, 1500]); }
  };

  const handleSetupConfirm = (team) => {
      setMyTeam(team);
      setPhase(PHASES.DRAFT);
  };

  const handleDraftComplete = (cards) => {
      setDraftedDeck(cards);
      setPhase(PHASES.ALLOCATE);
  };

  const handleAllocateComplete = (allocations) => {
      const readyTeam = myTeam.map(horse => {
          const equipped = allocations[horse._id] || [];
          const base = horse.stats || { speed:0, stamina:0, power:0, guts:0, wisdom:0 };
          const finalStats = { ...base };

          equipped.forEach(c => {
              if(c.stats) {
                  Object.keys(c.stats).forEach(k => {
                      if(typeof c.stats[k] === 'number') {
                          finalStats[k] = (finalStats[k] || 0) + c.stats[k];
                      }
                  });
              }
          });

          return { ...horse, equippedCards: equipped, finalStats };
      });

      console.log("🚀 ส่งไม้ต่อให้สนามแข่ง:", readyTeam);
      setMyTeam(readyTeam); // อัปเดตทีมล่าสุด
      setPhase(PHASES.RACE);
      // setMyTeam(readyTeam); 
      // setPhase(PHASES.RACE); 
  };

  return (
    <div style={{minHeight:'100vh', background:'#111', padding:'20px', fontFamily:'Arial'}}>
        {phase === PHASES.SETUP && (
            <BattleSetup onConfirmTeam={handleSetupConfirm} trackInfo={trackInfo} triggerPoints={triggerPoints} inventoryHorses={myInventoryHorses} inventoryActions={myInventoryActions} />
        )}
        {phase === PHASES.DRAFT && (
            <BattleDraft onDraftComplete={handleDraftComplete} />
        )}
        {phase === PHASES.ALLOCATE && (
            <BattleAllocate team={myTeam} draftedCards={draftedDeck} onAllocateComplete={handleAllocateComplete} />
        )}
        {phase === PHASES.RACE && (
            <BattleRace 
                team={myTeam}          // ส่งม้าที่แต่งตัวเสร็จแล้วไป
                trackInfo={trackInfo}  // ส่งข้อมูลสนามไป
            />
        )}
        {phase === PHASES.LOAD && <div style={{color:'white', textAlign:'center', marginTop:'50px'}}>กำลังเตรียมสนามแข่ง... 🏇</div>}
    </div>
  );
}

const setupStyles = {
    container: { display: 'flex', gap: '20px', height: '85vh', maxWidth: '1200px', margin: '0 auto', padding: '20px', boxSizing: 'border-box', alignItems: 'stretch' },
    leftPanel: { flex: 1.2, display: 'flex', flexDirection: 'column', gap: '15px', background: '#1a1a1a', borderRadius: '15px', padding: '10px', border: '1px solid #333' },
    trackCard: { flex: 2, position: 'relative', borderRadius: '10px', overflow: 'hidden', background: '#000', border: '1px solid #444', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    trackImg: { width: '100%', height: '100%', objectFit: 'contain' },
    trackOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.85)', padding: '15px', color: 'white', borderTop: '1px solid #555' },
    trackInfoBox: { flex: 0.5, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    rightPanel: { flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' },
    teamSlotsContainer: { background: '#2a2a2a', padding: '10px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', textAlign: 'center', border: '1px solid #333' },
    slotsFlex: { display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' },
    
    // 🔥 Phase 1 Styles
    slotBox: { width: '32%', height: '200px', background: '#333', borderRadius: '8px', border: '2px dashed #555', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', position: 'relative', overflow: 'hidden' },
    slotImg: { width: '100%', flex: 1, minHeight: 0, objectFit: 'cover', objectPosition: 'top center', borderBottom: '1px solid #444' },
    slotNameBox: { width: '100%', background: 'rgba(0,0,0,0.8)', padding: '4px 0', fontSize: '0.75rem', fontWeight: 'bold', color: 'white', zIndex: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    strategySelect: { width: '100%', padding: '4px', borderRadius: '0', fontSize: '0.75rem', background: '#222', color: '#fff', cursor: 'pointer', textAlign: 'center', border: 'none', borderTop: '1px solid #555' },
    removeBtn: { position: 'absolute', top: 0, right: 0, background: 'rgba(211, 47, 47, 0.9)', color: 'white', border: 'none', cursor: 'pointer', width: '24px', height: '24px', fontSize: '1rem', borderBottomLeftRadius: '5px', zIndex: 10 },
    confirmBtn: { width: '100%', padding: '10px', background: 'linear-gradient(45deg, #e91e63, #ff4081)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(233, 30, 99, 0.4)' },
    inventoryContainer: { flex: 1, overflowY: 'auto', background: '#1a1a1a', padding: '10px', borderRadius: '15px', border: '1px solid #333' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' },
    card: { borderRadius: '6px', padding: '5px', cursor: 'pointer', textAlign: 'center', transition: 'transform 0.1s', background: '#252525' },
    cardImg: { width: '100%', height: '80px', objectFit: 'cover', objectPosition: 'top center', borderRadius: '4px' }
};

export default Battle;