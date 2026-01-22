import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function Inventory() {
  const [view, setView] = useState('MENU'); // MENU, HORSES, DECK
  const [inventory, setInventory] = useState([]);
  const [myDeck, setMyDeck] = useState([]);
  const [deckName, setDeckName] = useState("New Deck");
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if(!token) navigate('/login');
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        // 1. ดึง Inventory
        const resInv = await axios.get('http://localhost:5000/api/user/inventory', { headers: { Authorization: `Bearer ${token}` } });
        setInventory(resInv.data);

        // 2. ดึง Deck เก่า (ถ้ามี)
        const resProfile = await axios.get('http://localhost:5000/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
        if (resProfile.data.savedDecks && resProfile.data.savedDecks.length > 0) {
            const saved = resProfile.data.savedDecks[0];
            setDeckName(saved.name);
            // Map ID กลับมาเป็นการ์ดจริง (ต้องใช้ Logic หน่อย แต่ใน Demo นี้ผมสมมติว่า Inventory มีข้อมูลครบ)
            // *ของจริงต้อง map ให้ตรงกับ inventory item
        }
    } catch(e) { console.error(e); }
  };

  // --- Logic จัด Deck ---
  const addToDeck = (item) => {
    if (myDeck.length >= 20) { alert("Deck เต็มแล้ว (20 ใบ)!"); return; }
    // เช็คว่ามีการ์ดนี้ใน Deck กี่ใบแล้ว (สมมติใส่ซ้ำได้ 3 ใบ)
    setMyDeck([...myDeck, item]);
  };

  const removeFromDeck = (index) => {
    const newDeck = [...myDeck];
    newDeck.splice(index, 1);
    setMyDeck(newDeck);
  };

  const saveDeck = async () => {
    if(myDeck.length < 10) { alert("Deck ต้องมีอย่างน้อย 10 ใบ!"); return; }
    try {
        const cardIds = myDeck.map(item => item.cardId._id);
        await axios.post('http://localhost:5000/api/user/save-deck', 
            { deckName, cardIds }, 
            { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("บันทึก Deck เรียบร้อย!");
    } catch(e) { alert("Save Error"); }
  };

  // --- RENDER ---

  // 1. หน้า MENU หลัก
  if (view === 'MENU') {
      return (
          <div style={styles.container}>
              <Link to="/home" style={styles.backBtn}>⬅ Home</Link>
              <h1 style={{textAlign:'center'}}>🎒 Inventory Hub</h1>
              <div style={{display:'flex', gap:'20px', justifyContent:'center', marginTop:'50px'}}>
                  <button onClick={() => setView('HORSES')} style={styles.menuBtn}>
                      🐴<br/>My Horses
                  </button>
                  <button onClick={() => setView('DECK')} style={styles.menuBtn}>
                      🃏<br/>Edit Deck
                  </button>
              </div>
          </div>
      )
  }

  // 2. หน้าดูม้า (Horse Gallery)
  if (view === 'HORSES') {
      const horses = inventory.filter(i => i.cardId && i.cardId.type === 'HORSE');
      return (
          <div style={styles.container}>
              <button onClick={() => setView('MENU')} style={styles.backBtn}>⬅ Back</button>
              <h2>🐴 ม้าในคอก ({horses.length})</h2>
              <div style={styles.grid}>
                  {horses.map((h, i) => (
                      <div key={i} style={styles.cardItem}>
                          <img src={h.cardId.image} style={styles.img}/>
                          <div>{h.cardId.name}</div>
                      </div>
                  ))}
              </div>
          </div>
      )
  }

  // 3. หน้าจัด Deck (Deck Builder)
  if (view === 'DECK') {
      // กรองเอาเฉพาะ Action Card
      const actionCards = inventory.filter(i => i.cardId && i.cardId.type === 'ACTION');

      return (
          <div style={{...styles.container, maxWidth:'1200px'}}>
               <button onClick={() => setView('MENU')} style={styles.backBtn}>⬅ Back</button>
               <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h2>🛠️ Deck Editor</h2>
                    <div>
                        <input 
                            value={deckName} 
                            onChange={(e)=>setDeckName(e.target.value)} 
                            style={{padding:'5px', fontSize:'1.2rem', marginRight:'10px'}}
                        />
                        <button onClick={saveDeck} style={styles.saveBtn}>💾 SAVE DECK</button>
                    </div>
               </div>

               <div style={{display:'flex', gap:'20px', height:'70vh'}}>
                   {/* Left: Inventory (Source) */}
                   <div style={styles.panel}>
                       <h3>📚 Action Cards ({actionCards.length})</h3>
                       <div style={{...styles.grid, gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))'}}>
                           {actionCards.map((item, i) => (
                               <div key={i} onClick={() => addToDeck(item)} style={styles.cardSelectable}>
                                   <img src={item.cardId.image} style={{width:'100%', height:'100px', objectFit:'cover'}}/>
                                   <div style={{fontSize:'0.8rem'}}>{item.cardId.name}</div>
                               </div>
                           ))}
                       </div>
                   </div>

                   {/* Right: Current Deck (Target) */}
                   <div style={{...styles.panel, border:'2px solid #2196f3'}}>
                       <h3>🃏 My Deck ({myDeck.length}/20)</h3>
                       <div style={{...styles.grid, gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))'}}>
                           {myDeck.map((item, i) => (
                               <div key={i} onClick={() => removeFromDeck(i)} style={styles.cardInDeck}>
                                   <img src={item.cardId.image} style={{width:'100%', height:'100px', objectFit:'cover'}}/>
                                   <div style={{fontSize:'0.8rem'}}>{item.cardId.name}</div>
                                   <div style={styles.removeIcon}>❌</div>
                               </div>
                           ))}
                       </div>
                       {myDeck.length === 0 && <div style={{textAlign:'center', marginTop:'50px', color:'#999'}}>จิ้มการ์ดฝั่งซ้ายเพื่อใส่ Deck</div>}
                   </div>
               </div>
          </div>
      )
  }
}

const styles = {
    container: { maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' },
    backBtn: { cursor:'pointer', padding:'5px 10px', background:'#eee', border:'none', borderRadius:'5px', marginBottom:'10px' },
    menuBtn: { width:'150px', height:'150px', fontSize:'1.5rem', cursor:'pointer', borderRadius:'10px', border:'none', background:'#f0f0f0', boxShadow:'0 4px 5px rgba(0,0,0,0.1)' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', overflowY:'auto', maxHeight:'60vh' },
    cardItem: { textAlign:'center', border:'1px solid #ddd', borderRadius:'5px', padding:'5px' },
    img: { width:'100%', height:'120px', objectFit:'cover', borderRadius:'5px' },
    
    // Builder Styles
    panel: { flex:1, border:'1px solid #ccc', borderRadius:'10px', padding:'10px', display:'flex', flexDirection:'column' },
    saveBtn: { padding:'10px 20px', background:'#28a745', color:'white', border:'none', borderRadius:'5px', cursor:'pointer' },
    cardSelectable: { cursor:'pointer', border:'1px solid #eee', padding:'5px', textAlign:'center', borderRadius:'5px', '&:hover': {borderColor:'blue'} },
    cardInDeck: { cursor:'pointer', border:'1px solid blue', padding:'5px', textAlign:'center', borderRadius:'5px', position:'relative', background:'#e3f2fd' },
    removeIcon: { position:'absolute', top:0, right:0, fontSize:'0.8rem' }
};

export default Inventory;