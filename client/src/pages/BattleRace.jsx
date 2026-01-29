import React, { useState, useEffect, useRef } from 'react';
import { updateHorse, sortPositions } from '../game/RaceEngine'; // ✅ Import สมอง

function BattleRace({ team, trackInfo }) {
    const [gameState, setGameState] = useState('READY'); // READY, RUNNING, FINISHED
    const [raceHorses, setRaceHorses] = useState([]);
    const [winner, setWinner] = useState(null);
    
    // ใช้ Ref เก็บ Loop ID เพื่อสั่งหยุด
    const loopRef = useRef(null);

    // 1. Setup ตอนเริ่มหน้า
    useEffect(() => {
        // แปลงข้อมูล Team ให้เป็นข้อมูลที่ Engine เข้าใจ
        const initialHorses = team.map((h, i) => ({
            ...h, // ข้อมูลเดิม (ชื่อ, รูป, stats)
            currentDistance: 0,
            currentSpeed: 0,
            stamina: h.finalStats.stamina, // เริ่มต้น Stamina เต็ม
            maxStamina: h.finalStats.stamina, // เก็บค่า Max ไว้เทียบ %
            lane: i, // ลู่วิ่ง (0, 1, 2)
            finished: false,
            finishTime: 0
        }));
        setRaceHorses(initialHorses);
    }, [team]);

    // 2. ฟังก์ชันเริ่มเกม
    const startRace = () => {
        setGameState('RUNNING');
        
        // Game Loop (รันทุกๆ 100ms หรือ 10 FPS)
        loopRef.current = setInterval(() => {
            setRaceHorses(prev => {
                // ส่งม้าทุกตัวไปคำนวณใน Engine
                const nextPositions = prev.map(horse => updateHorse(horse, trackInfo, 0.1));
                
                // เช็คว่าจบเกมรึยัง (ทุกคนเข้าเส้นชัยหมด)
                const allFinished = nextPositions.every(h => h.finished);
                if (allFinished) {
                    clearInterval(loopRef.current);
                    setGameState('FINISHED');
                    // หาผู้ชนะ (คนที่ finishTime น้อยสุด)
                    const sorted = [...nextPositions].sort((a,b) => a.finishTime - b.finishTime);
                    setWinner(sorted[0]);
                }

                return nextPositions;
            });
        }, 100);
    };

    // 3. Cleanup ตอนออกจากหน้า
    useEffect(() => {
        return () => clearInterval(loopRef.current);
    }, []);

    // Helper: คำนวณ % ระยะทางเพื่อวาดบนจอ
    const getLeftPos = (dist) => {
        const pct = (dist / trackInfo.distance) * 100;
        return Math.min(pct, 95); // ไม่ให้ทะลุจอขวา (Lock ไว้ที่ 95%)
    };

    return (
        <div style={{color:'white', padding:'20px', maxWidth:'1200px', margin:'0 auto'}}>
            {/* Header */}
            <div style={{textAlign:'center', marginBottom:'20px'}}>
                <h1 style={{margin:0}}>🏁 {trackInfo.name} ({trackInfo.distance}m)</h1>
                <div style={{color: gameState==='RUNNING'?'#00e676':'#aaa'}}>
                    STATUS: {gameState}
                </div>
            </div>

            {/* 🏟️ สนามจำลอง (Track View) */}
            <div style={{
                position:'relative', width:'100%', height:'400px', 
                background:'#333', border:'4px solid #555', borderRadius:'10px',
                overflow:'hidden', marginBottom:'20px'
            }}>
                {/* เส้นชัย */}
                <div style={{position:'absolute', right:'5%', top:0, bottom:0, width:'5px', background:'repeating-linear-gradient(to bottom, white 0, white 10px, black 10px, black 20px)', zIndex:0}}></div>
                <div style={{position:'absolute', right:'5%', top:'10px', color:'white', fontWeight:'bold'}}>FINISH</div>

                {/* ระยะทางบอกระยะ */}
                <div style={{position:'absolute', bottom:'10px', left:'10px', color:'#aaa'}}>0m</div>
                <div style={{position:'absolute', bottom:'10px', right:'6%', color:'#aaa'}}>{trackInfo.distance}m</div>

                {/* 🐎 ม้าวิ่ง */}
                {raceHorses.map((horse, i) => (
                    <div key={horse._id} style={{
                        position: 'absolute',
                        left: `${getLeftPos(horse.currentDistance)}%`,
                        top: `${50 + (i * 100)}px`, // ระยะห่างแต่ละเลน
                        transition: 'left 0.1s linear', // Animation ลื่นๆ
                        zIndex: 10
                    }}>
                        {/* หลอด Stamina บนหัว */}
                        <div style={{width:'60px', height:'6px', background:'red', borderRadius:'3px', marginBottom:'5px', overflow:'hidden'}}>
                            <div style={{
                                width: `${(horse.stamina / horse.maxStamina) * 100}%`,
                                height:'100%', background:'#00e676', transition:'width 0.2s'
                            }}></div>
                        </div>

                        {/* ตัวม้า (รูป + กรอบ) */}
                        <div style={{position:'relative'}}>
                            <img 
                                src={horse.image} 
                                style={{
                                    width:'60px', height:'60px', borderRadius:'50%', 
                                    border: horse.finished ? '3px solid gold' : '3px solid white',
                                    objectFit:'cover'
                                }} 
                            />
                            {/* ความเร็ว Real-time */}
                            <div style={{
                                position:'absolute', bottom:'-20px', left:'50%', transform:'translateX(-50%)',
                                background:'rgba(0,0,0,0.7)', padding:'2px 5px', borderRadius:'4px',
                                fontSize:'0.7rem', whiteSpace:'nowrap'
                            }}>
                                {horse.currentSpeed.toFixed(1)} m/s
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* แผงควบคุม */}
            <div style={{textAlign:'center'}}>
                {gameState === 'READY' && (
                    <button onClick={startRace} style={{
                        padding:'15px 50px', fontSize:'1.5rem', fontWeight:'bold',
                        background:'linear-gradient(45deg, #00e676, #00c853)', border:'none', 
                        borderRadius:'50px', color:'white', cursor:'pointer',
                        boxShadow:'0 0 20px rgba(0, 230, 118, 0.5)'
                    }}>
                        🔫 START RACE
                    </button>
                )}

                {gameState === 'FINISHED' && winner && (
                    <div style={{background:'rgba(255, 215, 0, 0.2)', padding:'20px', borderRadius:'15px', border:'2px solid gold', display:'inline-block'}}>
                        <h2 style={{color:'gold', margin:0}}>🏆 WINNER: {winner.name} 🏆</h2>
                        <div style={{marginTop:'10px'}}>เวลา: {(winner.finishTime/1000).toFixed(2)} วินาที</div>
                        <button style={{marginTop:'15px', padding:'10px 30px', cursor:'pointer'}} onClick={()=>window.location.reload()}>
                            Play Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default BattleRace;