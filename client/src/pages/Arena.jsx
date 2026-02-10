import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Arena() {
    const [opponents, setOpponents] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // ดึงรายชื่อคู่แข่ง
        axios.get('http://localhost:5000/api/user/arena/opponents')
            .then(res => setOpponents(res.data))
            .catch(err => console.error(err));
    }, []);

    const handleChallenge = (opponent) => {
        // ส่งข้อมูลทีมคู่แข่งไปหน้า Battle ผ่าน State
        navigate('/battle', { state: { enemyTeam: opponent.decks, enemyName: opponent.username } });
    };

    return (
        <div style={{minHeight:'100vh', background:'#111', padding:'40px', color:'white', fontFamily:'Arial'}}>
            <h1 style={{textAlign:'center', fontSize:'3rem', marginBottom:'40px'}}>⚔️ ARENA BATTLE</h1>
            
            <div style={{display:'grid', gap:'20px', maxWidth:'800px', margin:'0 auto'}}>
                {opponents.map(player => (
                    <div key={player._id} style={{background:'#1e1e1e', padding:'20px', borderRadius:'15px', border:'1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        
                        <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
                            {/* รูปโปรไฟล์สมมติ */}
                            <div style={{width:'60px', height:'60px', background:'#e91e63', borderRadius:'50%', display:'flex', justifyContent:'center', alignItems:'center', fontSize:'1.5rem'}}>
                                👤
                            </div>
                            <div>
                                <h2 style={{margin:0, color:'#e91e63'}}>{player.username}</h2>
                                <div style={{color:'#aaa', fontSize:'0.9rem'}}>Team Power: {player.decks.reduce((sum, h) => sum + h.stats.speed + h.stats.stamina, 0)}</div>
                            </div>
                        </div>

                        {/* โชว์ม้าตัวเก่งของเขา */}
                        <div style={{display:'flex', gap:'5px'}}>
                            {player.decks.slice(0,3).map(horse => (
                                <img key={horse._id} src={horse.image} style={{width:'40px', height:'40px', borderRadius:'50%', border:'2px solid #555'}} />
                            ))}
                        </div>

                        <button 
                            onClick={() => handleChallenge(player)}
                            style={{padding:'10px 20px', background:'linear-gradient(45deg, #ff9800, #ff5722)', border:'none', borderRadius:'30px', color:'white', fontWeight:'bold', cursor:'pointer'}}
                        >
                            VS FIGHT 🥊
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Arena;