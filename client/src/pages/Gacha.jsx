import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function Gacha() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('HORSE'); // 'HORSE' หรือ 'ACTION'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if(!token) navigate('/login');
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
        const res = await axios.get('http://localhost:5000/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
        setUser(res.data);
    } catch(e) { navigate('/login'); }
  };

  const pullGacha = async () => {
    if(user.coins < 100) { alert("เงินไม่พอ!"); return; }
    setLoading(true); setResult(null);

    try {
        const res = await axios.post('http://localhost:5000/api/gacha/pull', 
            { cost: 100, poolType: activeTab }, 
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setTimeout(() => {
            setResult(res.data.card);
            setUser({...user, coins: res.data.newCoins});
            setLoading(false);
        }, 1500); // ลุ้น 1.5 วิ
    } catch(e) {
        setLoading(false); alert("Error");
    }
  };

  if(!user) return <div>Loading...</div>;

  return (
    <div style={styles.container}>
        <header style={styles.header}>
            <Link to="/home" style={styles.backBtn}>⬅ Home</Link>
            <div style={styles.coinPill}>💰 {user.coins}</div>
        </header>

        <h1 style={{textAlign:'center'}}>🎰 Gacha Shop</h1>

        {/* Tab เลือกตู้ */}
        <div style={styles.tabContainer}>
            <button onClick={() => setActiveTab('HORSE')} style={{...styles.tab, backgroundColor: activeTab==='HORSE'?'#e91e63':'#ddd', color: activeTab==='HORSE'?'white':'black'}}>
                🐴 ตู้ม้าสาว (100G)
            </button>
            <button onClick={() => setActiveTab('ACTION')} style={{...styles.tab, backgroundColor: activeTab==='ACTION'?'#2196f3':'#ddd', color: activeTab==='ACTION'?'white':'black'}}>
                🃏 ตู้การ์ด Action (100G)
            </button>
        </div>

        {/* Banner Area */}
        <div style={styles.bannerArea}>
            {loading ? <div className="spinner">✨ กำลังสุ่ม... ✨</div> : 
             result ? (
                <div style={styles.resultBox}>
                    <h2>🎉 ได้รับ: {result.name}</h2>
                    <img src={result.image} style={{width:'150px', borderRadius:'10px', border:'3px solid gold'}}/>
                    <p>{result.rarity}</p>
                    <button onClick={() => setResult(null)} style={styles.okBtn}>ตกลง</button>
                </div>
             ) : (
                <div>
                    <img 
                        src={activeTab === 'HORSE' ? "https://placehold.co/600x300/pink/white?text=Horse+Banner" : "https://placehold.co/600x300/blue/white?text=Support+Card+Banner"} 
                        style={{width:'100%', borderRadius:'10px'}} 
                    />
                    <button onClick={pullGacha} style={styles.pullBtn}>สุ่ม 1 ครั้ง (100 G)</button>
                </div>
             )
            }
        </div>
    </div>
  );
}

const styles = {
    container: { maxWidth:'600px', margin:'0 auto', padding:'20px', fontFamily:'Arial' },
    header: { display:'flex', justifyContent:'space-between', marginBottom:'20px' },
    coinPill: { background:'gold', padding:'5px 15px', borderRadius:'20px', fontWeight:'bold' },
    backBtn: { textDecoration:'none', color:'#555', fontSize:'1.2rem' },
    tabContainer: { display:'flex', justifyContent:'center', gap:'10px', marginBottom:'20px' },
    tab: { padding:'10px 20px', border:'none', borderRadius:'20px', cursor:'pointer', fontWeight:'bold', fontSize:'1rem' },
    bannerArea: { textAlign:'center', background:'#f9f9f9', padding:'20px', borderRadius:'15px', border:'1px solid #eee' },
    pullBtn: { marginTop:'20px', padding:'15px 40px', fontSize:'1.5rem', background:'#e91e63', color:'white', border:'none', borderRadius:'50px', cursor:'pointer', boxShadow:'0 4px 0 #c2185b' },
    resultBox: { animation: 'pop 0.3s' },
    okBtn: { marginTop:'10px', padding:'5px 20px', cursor:'pointer' }
};

export default Gacha;