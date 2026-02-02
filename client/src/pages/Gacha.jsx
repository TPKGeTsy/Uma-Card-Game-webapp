import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function Gacha() {
  const [user, setUser] = useState(null);
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
    if(user.coins < 100) { alert("เงินไม่พอ! (ต้องการ 100G)"); return; }
    setLoading(true); 
    setResult(null);

    try {
        // 🚀 ส่ง poolType: 'ALL' ไปบอกหลังบ้านว่า "ขอสุ่มรวมทุกอย่าง!"
        const res = await axios.post('http://localhost:5000/api/gacha/pull', 
            { cost: 100, poolType: 'ALL' }, 
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Simulate Animation Delay
        setTimeout(() => {
            setResult(res.data.card);
            setUser({...user, coins: res.data.newCoins});
            setLoading(false);
        }, 2000); // ลุ้น 2 วิ
    } catch(e) {
        setLoading(false); 
        alert("Gacha Error: " + (e.response?.data?.message || "Server Error"));
    }
  };

  if(!user) return <div style={{color:'white', textAlign:'center', marginTop:50}}>Loading...</div>;

  return (
    <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
            <Link to="/home" style={styles.backBtn}>⬅ HOME</Link>
            <div style={styles.coinPill}>
                <span style={{fontSize:'1.2rem'}}>💰</span> {user.coins.toLocaleString()} G
            </div>
        </header>

        <h1 style={styles.title}>GACHA SHOP</h1>
        <p style={styles.subtitle}>สุ่มหาม้าสาวคู่ใจ และการ์ดสนับสนุนสุดแกร่ง!</p>

        {/* Gacha Box */}
        <div style={styles.gachaBox}>
            {loading ? (
                <div style={styles.loadingBox}>
                    <div style={styles.spinner}>💎</div>
                    <p style={{marginTop:'20px', fontWeight:'bold'}}>SUMMONING...</p>
                </div>
            ) : result ? (
                <div style={styles.resultBox}>
                    <div style={styles.flash}></div>
                    <div style={{fontSize:'1.5rem', marginBottom:'10px'}}>🎉 CONGRATULATIONS!</div>
                    
                    {/* Card Display */}
                    <div style={{...styles.cardResult, border: getBorderColor(result.rarity)}}>
                        <div style={styles.badge}>{result.type}</div>
                        <img src={result.image} style={styles.resultImg} onError={(e)=>e.target.src='https://placehold.co/200'}/>
                        <div style={styles.resultName}>{result.name}</div>
                        <div style={{color: getRarityColor(result.rarity), fontWeight:'bold'}}>{result.rarity}</div>
                    </div>

                    <button onClick={() => setResult(null)} style={styles.okBtn}>CONTINUE</button>
                </div>
            ) : (
                <div style={styles.bannerContainer}>
                    {/* Banner Image */}
                    <div style={styles.banner}>
                        <div style={styles.bannerText}>STANDARD POOL</div>
                        <div style={styles.bannerSub}>Horses • Actions • Training</div>
                        <img src="https://placehold.co/600x300/1a1a1a/white?text=All+Stars+Banner" style={styles.bannerImg} />
                    </div>

                    <div style={styles.controls}>
                        <div style={{color:'#aaa', marginBottom:'10px'}}>Cost: <span style={{color:'gold', fontWeight:'bold'}}>100 G</span> / Pull</div>
                        <button onClick={pullGacha} style={styles.pullBtn}>
                            SUMMON x1 ✨
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}

// Helper Colors
const getRarityColor = (r) => {
    if(r==='SSR') return '#ffeb3b'; // Gold
    if(r==='SR') return '#e91e63'; // Pink
    if(r==='R') return '#2196f3'; // Blue
    return '#fff';
};

const getBorderColor = (r) => `3px solid ${getRarityColor(r)}`;

// Styles (Dark Theme)
const styles = {
    container: { background:'#111', minHeight:'100vh', padding:'40px 20px', fontFamily:"'Inter', sans-serif", color:'white' },
    header: { display:'flex', justifyContent:'space-between', alignItems:'center', maxWidth:'600px', margin:'0 auto 40px' },
    backBtn: { textDecoration:'none', color:'#aaa', fontWeight:'bold', transition:'0.2s' },
    coinPill: { background:'#222', padding:'8px 20px', borderRadius:'30px', fontWeight:'bold', border:'1px solid #333', display:'flex', alignItems:'center', gap:'10px' },
    title: { textAlign:'center', fontSize:'3rem', fontWeight:'900', margin:'0', background: 'linear-gradient(to right, #e91e63, #9c27b0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    subtitle: { textAlign:'center', color:'#666', marginBottom:'40px' },
    
    gachaBox: { maxWidth:'500px', margin:'0 auto', background:'#1e1e1e', borderRadius:'20px', border:'1px solid #333', overflow:'hidden', boxShadow:'0 20px 50px rgba(0,0,0,0.5)', minHeight:'400px', display:'flex', flexDirection:'column', justifyContent:'center' },
    
    bannerContainer: { padding:'20px', textAlign:'center' },
    banner: { position:'relative', borderRadius:'15px', overflow:'hidden', marginBottom:'20px', border:'2px solid #333' },
    bannerImg: { width:'100%', display:'block' },
    bannerText: { position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)', fontSize:'2rem', fontWeight:'900', textShadow:'0 2px 10px rgba(0,0,0,0.8)', width:'100%' },
    bannerSub: { position:'absolute', bottom:'10px', width:'100%', textAlign:'center', fontSize:'0.8rem', color:'#ccc', textShadow:'0 1px 5px black' },
    
    controls: { textAlign:'center' },
    pullBtn: { background:'linear-gradient(45deg, #e91e63, #ff4081)', border:'none', padding:'15px 50px', borderRadius:'50px', color:'white', fontSize:'1.2rem', fontWeight:'bold', cursor:'pointer', boxShadow:'0 0 20px rgba(233, 30, 99, 0.4)', transition:'transform 0.1s', ':active':{transform:'scale(0.95)'} },
    
    loadingBox: { textAlign:'center', padding:'50px' },
    spinner: { fontSize:'3rem', animation:'spin 1s infinite linear' },
    
    resultBox: { textAlign:'center', padding:'40px', animation:'fadeIn 0.5s' },
    cardResult: { background:'#252525', borderRadius:'15px', padding:'20px', display:'inline-block', marginBottom:'20px', boxShadow:'0 10px 30px rgba(0,0,0,0.5)', position:'relative' },
    resultImg: { width:'180px', height:'240px', objectFit:'cover', borderRadius:'10px', marginBottom:'10px' },
    resultName: { fontSize:'1.2rem', fontWeight:'bold', marginBottom:'5px' },
    badge: { position:'absolute', top:10, left:10, background:'rgba(0,0,0,0.8)', padding:'2px 8px', borderRadius:'4px', fontSize:'0.7rem' },
    okBtn: { background:'transparent', border:'2px solid #555', color:'white', padding:'10px 30px', borderRadius:'30px', cursor:'pointer', fontWeight:'bold', ':hover':{background:'#333'} },
    
    flash: { position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'white', animation:'flash 0.5s forwards', pointerEvents:'none' }
};

// CSS Animation (Inject into style tag if needed, but works with standard inline styles mostly)
const styleTag = document.createElement('style');
styleTag.innerHTML = `
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
@keyframes flash { 0% { opacity: 1; } 100% { opacity: 0; } }
`;
document.head.appendChild(styleTag);

export default Gacha;