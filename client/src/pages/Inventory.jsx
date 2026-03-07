import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function Inventory() {
  const [view, setView] = useState('MENU');
  const [inventory, setInventory] = useState([]);
  const [myDeck, setMyDeck] = useState([]);
  const [deckName, setDeckName] = useState("New Deck");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if(!token) { navigate('/login'); return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        setLoading(true);
        const resInv = await axios.get('http://localhost:5000/api/user/inventory', { headers: { Authorization: `Bearer ${token}` } });
        
        // กรองข้อมูลขยะ
        const validInventory = resInv.data.filter(item => item && item.cardId);
        setInventory(validInventory);

        // ดึง Deck
        const resProfile = await axios.get('http://localhost:5000/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
        if (resProfile.data.savedDecks?.length > 0) {
            const saved = resProfile.data.savedDecks[0];
            setDeckName(saved.name || "My Deck");

            const loadedDeck = saved.cards.map(id => {
                const realId = typeof id === 'object' ? id._id : id;
                return validInventory.find(inv => inv.cardId._id === realId);
            }).filter(x => x !== undefined);

            setMyDeck(loadedDeck);
        }
        setLoading(false);
    } catch(e) { 
        console.error("Inv Error:", e);
        setLoading(false);
    }
  };

  const addToDeck = (item) => {
    if (myDeck.length >= 20) return alert("Deck เต็มแล้ว (20 ใบ)!");
    if (myDeck.find(d => d.cardId._id === item.cardId._id)) return alert("มีการ์ดใบนี้แล้ว");
    setMyDeck([...myDeck, item]);
  };

  const removeFromDeck = (index) => {
    const newDeck = [...myDeck];
    newDeck.splice(index, 1);
    setMyDeck(newDeck);
  };

  const saveDeck = async () => {
    if(myDeck.length < 1) return alert("Deck ต้องมีอย่างน้อย 1 ใบ!");
    try {
        const cardIds = myDeck.map(i => i.cardId._id);
        await axios.post('http://localhost:5000/api/user/save-deck', { deckName, cardIds }, { headers: { Authorization: `Bearer ${token}` } });
        alert("✅ บันทึก Deck เรียบร้อย!");
    } catch(e) { alert("Save Failed"); }
  };

  // --- RENDER HELPERS ---
  const renderCardImage = (card, size = '100px') => {
    if (card.image && card.image.trim() !== '' && !card.image.includes('placehold.co')) {
        return <img src={card.image} style={{width:'100%', height:size, objectFit:'cover', borderRadius:'5px'}} />;
    }

    // 🎨 Text-based Card Style
    const rarityColors = { 
        SSR: 'linear-gradient(135deg, #ffcc33, #ff6600)', 
        SR: 'linear-gradient(135deg, #9933ff, #6600cc)', 
        R: 'linear-gradient(135deg, #3399ff, #0033cc)', 
        N: 'linear-gradient(135deg, #999, #333)' 
    };
    const bg = rarityColors[card.rarity] || '#444';

    return (
        <div style={{
            width:'100%', height:size, borderRadius:'5px', 
            background: bg, display:'flex', flexDirection:'column',
            justifyContent:'center', alignItems:'center', padding:'5px',
            boxSizing:'border-box', border:'2px solid rgba(255,255,255,0.3)',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
        }}>
            <div style={{fontSize:'0.6rem', fontWeight:'bold', color:'rgba(255,255,255,0.8)', textTransform:'uppercase'}}>{card.type}</div>
            <div style={{fontSize:'0.8rem', fontWeight:'900', color:'white', textAlign:'center', marginTop:'2px', lineHeight:'1', textShadow:'1px 1px 2px black'}}>
                {card.name}
            </div>
            <div style={{fontSize:'0.7rem', color:'gold', marginTop:'5px', fontWeight:'bold'}}>{card.rarity}</div>
        </div>
    );
  };

  if (loading) return (
    <div style={styles.pageWrapper}>
        <div style={{color:'white', padding:'50px', textAlign:'center'}}>⏳ Loading Inventory...</div>
    </div>
  );

  // --- RENDER ---
  return (
    <div style={styles.pageWrapper}>
        <div style={styles.container}>
            
            {/* VIEW: MENU */}
            {view === 'MENU' && (
                <>
                    <Link to="/home" style={styles.backBtn}>⬅ Home</Link>
                    <h1 style={{textAlign:'center', color:'white', fontSize:'2.5rem', marginBottom:'10px'}}>🎒 Inventory Hub</h1>
                    <div style={{textAlign:'center', color:'#aaa', marginBottom:'40px'}}>Total Items: {inventory.length}</div>
                    
                    <div style={{display:'flex', gap:'30px', justifyContent:'center'}}>
                        <button onClick={() => setView('HORSES')} style={styles.menuBtn}>
                            <span style={{fontSize:'3rem'}}>🐴</span>
                            <span style={{fontSize:'1.2rem', fontWeight:'bold'}}>My Horses</span>
                        </button>
                        <button onClick={() => setView('DECK')} style={styles.menuBtn}>
                            <span style={{fontSize:'3rem'}}>🃏</span>
                            <span style={{fontSize:'1.2rem', fontWeight:'bold'}}>Edit Deck</span>
                        </button>
                    </div>
                </>
            )}

            {/* VIEW: HORSES */}
            {view === 'HORSES' && (
                <>
                    <button onClick={() => setView('MENU')} style={styles.backBtn}>⬅ Back</button>
                    <h2 style={{color:'white', borderBottom:'1px solid #333', paddingBottom:'10px', marginBottom:'20px'}}>
                        🐴 ม้าในคอก ({inventory.filter(i => i.cardId.type === 'HORSE').length})
                    </h2>
                    <div style={styles.grid}>
                        {inventory.filter(i => i.cardId.type === 'HORSE').map((h, i) => (
                            <div key={i} style={styles.cardItem}>
                                {renderCardImage(h.cardId, '140px')}
                                <div style={{color:'white', marginTop:'10px', fontWeight:'bold'}}>{h.cardId.name}</div>
                                <div style={{color:'#aaa', fontSize:'0.8rem'}}>{h.cardId.rarity}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* VIEW: DECK */}
            {view === 'DECK' && (
                <div style={{maxWidth:'1200px', margin:'0 auto'}}>
                    <button onClick={() => setView('MENU')} style={styles.backBtn}>⬅ Back</button>
                    
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', background:'#1e1e1e', padding:'15px', borderRadius:'10px', border:'1px solid #333'}}>
                        <h2 style={{color:'white', margin:0}}>🛠️ Deck Editor</h2>
                        <div style={{display:'flex', gap:'10px'}}>
                            <input value={deckName} onChange={(e)=>setDeckName(e.target.value)} style={{padding:'10px', borderRadius:'5px', background:'#333', color:'white', border:'1px solid #555'}} placeholder="Deck Name"/>
                            <button onClick={saveDeck} style={styles.saveBtn}>💾 SAVE DECK</button>
                        </div>
                    </div>

                    <div style={{display:'flex', gap:'20px', height:'70vh'}}>
                        {/* Left: Inventory Source */}
                        <div style={styles.panel}>
                            <h3 style={{color:'#ddd', borderBottom:'1px solid #444', paddingBottom:'10px'}}>📚 คลังการ์ด Action</h3>
                            <div style={{...styles.grid, gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))', paddingRight:'5px'}}>
                                {inventory.filter(i => i.cardId.type === 'ACTION').map((item, i) => (
                                    <div key={i} onClick={() => addToDeck(item)} style={styles.cardSelectable}>
                                        {renderCardImage(item.cardId, '100px')}
                                        <div style={{fontSize:'0.8rem', color:'white', marginTop:'5px'}}>{item.cardId.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Current Deck */}
                        <div style={{...styles.panel, border:'2px solid #2196f3', background:'#151515'}}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #333', paddingBottom:'10px', marginBottom:'10px'}}>
                                <h3 style={{color:'#2196f3', margin:0}}>🃏 My Deck</h3>
                                <span style={{color: myDeck.length===20?'red':'#aaa'}}>{myDeck.length} / 20</span>
                            </div>
                            
                            <div style={{...styles.grid, gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))', paddingRight:'5px'}}>
                                {myDeck.map((item, i) => (
                                    <div key={i} onClick={() => removeFromDeck(i)} style={styles.cardInDeck}>
                                        {renderCardImage(item.cardId, '100px')}
                                        <div style={{fontSize:'0.8rem', color:'black', fontWeight:'bold', marginTop:'5px'}}>{item.cardId.name}</div>
                                        <div style={styles.removeIcon}>✕</div>
                                    </div>
                                ))}
                            </div>
                            {myDeck.length === 0 && <div style={{textAlign:'center', marginTop:'50px', color:'#555'}}>👈 จิ้มการ์ดฝั่งซ้ายเพื่อใส่ Deck</div>}
                        </div>
                    </div>
                </div>
            )}

        </div>
    </div>
  );
}

// 🎨 STYLES
const styles = {
    // ✅ เพิ่ม Wrapper คลx`ุมหน้าจอ
    pageWrapper: {
        backgroundColor: '#111',
        minHeight: '100vh',
        width: '100%',
        fontFamily: "'Inter', sans-serif",
        boxSizing: 'border-box'
    },
    // ✅ Container ไม่ต้องใส่สีพื้นหลังแล้ว
    container: { 
        maxWidth: '1000px', 
        margin: '0 auto', 
        padding: '40px 20px',
    },
    backBtn: { cursor:'pointer', padding:'10px 20px', background:'#333', color:'white', border:'none', borderRadius:'50px', marginBottom:'20px', fontSize:'1rem', textDecoration:'none', display:'inline-block', fontWeight:'bold', transition:'0.2s', ':hover':{background:'#444'} },
    
    // Menu Buttons
    menuBtn: { width:'200px', height:'200px', cursor:'pointer', borderRadius:'20px', border:'2px solid #333', background:'#1e1e1e', color:'white', boxShadow:'0 10px 30px rgba(0,0,0,0.3)', transition:'all 0.2s', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'15px' },
    
    // Grid
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', overflowY:'auto', maxHeight:'65vh' },
    cardItem: { textAlign:'center', background:'#1e1e1e', borderRadius:'15px', padding:'15px', border:'1px solid #333', transition:'transform 0.2s' },
    img: { width:'100%', height:'140px', objectFit:'cover', borderRadius:'10px' },
    
    // Deck Builder
    panel: { flex:1, border:'1px solid #333', borderRadius:'15px', padding:'20px', display:'flex', flexDirection:'column', background:'#1e1e1e' },
    saveBtn: { padding:'10px 25px', background:'#00e676', color:'black', border:'none', borderRadius:'5px', cursor:'pointer', fontWeight:'bold' },
    cardSelectable: { cursor:'pointer', border:'1px solid #333', padding:'8px', textAlign:'center', borderRadius:'10px', background:'#252525', transition:'0.1s', ':hover': {borderColor:'#2196f3', transform:'scale(1.05)'} },
    cardInDeck: { cursor:'pointer', border:'2px solid #2196f3', padding:'8px', textAlign:'center', borderRadius:'10px', position:'relative', background:'#e3f2fd' },
    removeIcon: { position:'absolute', top:-8, right:-8, background:'#e91e63', color:'white', borderRadius:'50%', width:'24px', height:'24px', fontSize:'0.8rem', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid white' }
};

export default Inventory;