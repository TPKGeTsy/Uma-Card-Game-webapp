import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function Inventory() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if(!token) return navigate('/login');
    axios.get('http://localhost:5000/api/user/inventory', { headers: { Authorization: `Bearer ${token}` } })
         .then(res => setItems(res.data)).catch(e => console.error(e));
  }, []);

  return (
    <div style={styles.container}>
        <div style={styles.inner}>
            <div style={styles.header}>
                <Link to="/home" style={styles.backLink}>⬅ HOME</Link>
                <h1 style={styles.title}>MY COLLECTION</h1>
                <div style={styles.counter}>ITEMS: {items.length}</div>
            </div>

            <div style={styles.grid}>
                {items.map((item, i) => (
                    <div key={i} style={styles.card}>
                        <div style={{...styles.badge, background: item.cardId?.type==='HORSE'?'#ff9800':'#2196f3'}}>
                            {item.cardId?.type}
                        </div>
                        <img src={item.cardId?.image} style={styles.img} onError={(e)=>e.target.src='https://placehold.co/150'}/>
                        <div style={styles.cardContent}>
                            <div style={styles.cardName}>{item.cardId?.name}</div>
                            <div style={styles.cardRarity}>{item.cardId?.rarity}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}

const styles = {
    container: { background:'#111', minHeight:'100vh', padding:'40px 20px', fontFamily:"'Inter', sans-serif", color:'white' },
    inner: { maxWidth:'1000px', margin:'0 auto' },
    header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'40px', borderBottom:'1px solid #333', paddingBottom:'20px' },
    backLink: { textDecoration:'none', color:'#aaa', fontWeight:'bold', fontSize:'1.2rem', transition:'0.2s' },
    title: { fontSize:'2.5rem', fontWeight:'900', letterSpacing:'1px', margin:0, background: 'linear-gradient(to right, #fff, #aaa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    counter: { background:'#222', padding:'5px 15px', borderRadius:'20px', fontSize:'0.9rem', color:'#aaa' },
    grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'20px' },
    card: { background:'#1e1e1e', borderRadius:'15px', overflow:'hidden', border:'1px solid #333', position:'relative', transition:'transform 0.2s', cursor:'default', ':hover':{transform:'translateY(-5px)', borderColor:'#555'} },
    badge: { position:'absolute', top:10, left:10, fontSize:'0.6rem', padding:'3px 8px', borderRadius:'4px', color:'white', fontWeight:'bold' },
    img: { width:'100%', height:'140px', objectFit:'cover' },
    cardContent: { padding:'15px' },
    cardName: { fontWeight:'bold', fontSize:'0.9rem', marginBottom:'5px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
    cardRarity: { fontSize:'0.8rem', color:'#666' }
};

export default Inventory;