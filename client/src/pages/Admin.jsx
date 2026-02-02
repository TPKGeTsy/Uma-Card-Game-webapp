import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Admin() {
  const [tab, setTab] = useState('ADD');
  const [refresh, setRefresh] = useState(false);

  // --- ส่วนของ ADD NEW ---
  const [addType, setAddType] = useState('HORSE');
  const [file, setFile] = useState(null); 
  
  // State พื้นฐาน
  const [formData, setFormData] = useState({
    name: '', rarity: 'R', speed: 10, stamina: 10, 
    statType: 'SPEED', value: 10, 
    condition: 'ANY', effectType: 'SPEED_BOOST', description: '',
    distance: 2000
  });

  // 🏟️ State พิเศษสำหรับจัดการ Segments ของสนาม
  const [segmentCount, setSegmentCount] = useState(1); 
  const [trackSegments, setTrackSegments] = useState([
    { type: 'STRAIGHT', distance: 1000 }
  ]);

  // ฟังก์ชันปรับจำนวน Segment
  const handleSegmentCountChange = (count) => {
    const newCount = parseInt(count) || 1;
    setSegmentCount(newCount);
    const newSegments = [...trackSegments];
    if (newCount > newSegments.length) {
        for (let i = newSegments.length; i < newCount; i++) {
            newSegments.push({ type: 'STRAIGHT', distance: 100 });
        }
    } else {
        newSegments.splice(newCount);
    }
    setTrackSegments(newSegments);
  };

  const handleSegmentChange = (index, field, value) => {
    const newSegments = [...trackSegments];
    newSegments[index][field] = value;
    setTrackSegments(newSegments);
  };

  // --- ส่วนของ MANAGE (LIST & EDIT) ---
  const [allData, setAllData] = useState({ horses: [], trainings: [], actions: [], tracks: [] });
  const [editMode, setEditMode] = useState(null);
  const [editData, setEditData] = useState({});
  const [editFile, setEditFile] = useState(null); 
  const [editSegments, setEditSegments] = useState([]);

  useEffect(() => {
    fetchAllCards();
  }, [refresh]);

  const fetchAllCards = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/all-cards');
      setAllData(res.data);
    } catch (err) { console.error(err); }
  };

  // --- Logic การเพิ่ม (CREATE) ---
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('type', addType);
    data.append('name', formData.name);
    
    if (file) {
        data.append('imageFile', file);
    } else {
        alert("⚠️ กรุณาเลือกรูปภาพด้วยครับ!"); return;
    }

    if (addType === 'HORSE') {
        data.append('rarity', formData.rarity);
        data.append('stats', JSON.stringify({ speed: formData.speed, stamina: formData.stamina }));
    } else if (addType === 'TRAINING') {
        data.append('statType', formData.statType);
        data.append('value', formData.value);
    } else if (addType === 'ACTION') {
        data.append('description', formData.description);
        data.append('condition', formData.condition);
        data.append('effectType', formData.effectType);
        data.append('value', formData.value);
        data.append('rarity', formData.rarity);
    } else if (addType === 'TRACK') { 
        data.append('description', formData.description);
        data.append('distance', formData.distance);
        data.append('segments', JSON.stringify(trackSegments));
    }

    try {
        await axios.post('http://localhost:5000/api/admin/add-card', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert("✅ เพิ่มข้อมูลสำเร็จ!");
        setRefresh(!refresh);
        setFormData({ ...formData, name: '' });
        setFile(null);
        document.getElementById('fileInput').value = ""; 
    } catch (err) {
        alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  // --- Logic การลบ (DELETE) ---
  const handleDelete = async (id, type) => {
    if (!window.confirm("แน่ใจนะว่าจะลบ?")) return;
    try {
        await axios.delete(`http://localhost:5000/api/admin/delete-card/${id}?collectionType=${type}`);
        alert("🗑️ ลบเรียบร้อย");
        setRefresh(!refresh);
    } catch (err) {
        alert("Error: " + err.message);
    }
  };

  // --- Logic การแก้ไข (UPDATE) ---
  const startEdit = (item) => {
    setEditMode(item._id);
    setEditData(item);
    setEditFile(null);
    if (item.segments) {
        setEditSegments(item.segments);
    }
  };

  const handleEditSegmentChange = (index, field, value) => {
      const newSegs = [...editSegments];
      newSegs[index][field] = value;
      setEditSegments(newSegs);
  }

  const handleUpdateSubmit = async (type) => {
    const data = new FormData();
    data.append('collectionType', type);
    data.append('name', editData.name);
    data.append('image', editData.image); 

    if (editFile) data.append('imageFile', editFile);

    if (type === 'HORSE') {
        data.append('rarity', editData.rarity);
        data.append('stats', JSON.stringify(editData.stats));
    } else if (type === 'TRAINING') {
        data.append('statType', editData.statType);
        data.append('value', editData.value);
    } else if (type === 'ACTION') {
        data.append('description', editData.description);
        data.append('condition', editData.condition);
        data.append('effectType', editData.effectType);
        data.append('value', editData.value);
        data.append('rarity', editData.rarity);
    } else if (type === 'TRACK') { 
        data.append('description', editData.description);
        data.append('distance', editData.distance);
        data.append('segments', JSON.stringify(editSegments));
    }

    try {
        await axios.put(`http://localhost:5000/api/admin/update-card/${editMode}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert("📝 แก้ไขเรียบร้อย");
        setEditMode(null);
        setEditFile(null);
        setRefresh(!refresh);
    } catch (err) {
        alert("Error: " + err.message);
    }
  };

  // --- RENDER LIST ---
  const renderCardList = (list, type) => (
    <div style={styles.grid}>
        {list.map(item => (
            <div key={item._id} style={styles.card}>
                
                {editMode === item._id ? (
                    <div style={{display:'flex', flexDirection:'column', alignItems:'center', marginRight:'10px'}}>
                        <img src={item.image} alt={item.name} style={{width:'60px', height:'60px', borderRadius:'50%', objectFit:'cover', border: '2px solid #555', opacity: 0.5}} />
                        <input type="file" onChange={e => setEditFile(e.target.files[0])} style={{width:'80px', fontSize:'0.7rem', marginTop:'5px', color:'white'}} accept="image/*" />
                    </div>
                ) : (
                    <img src={item.image} alt={item.name} style={{width:'60px', height:'60px', borderRadius:'50%', objectFit:'cover', border: '2px solid #333', marginRight:'10px'}} />
                )}
                
                {editMode === item._id ? (
                    // 🔴 โหมดแก้ไข
                    <div style={{flex:1, display:'flex', flexDirection:'column', gap:'5px'}}>
                        <input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} style={styles.miniInput} placeholder="ชื่อ"/>

                        {type === 'HORSE' && ( <div style={{display:'flex', gap:'5px'}}><input type="number" value={editData.stats?.speed} onChange={e => setEditData({...editData, stats: { ...editData.stats, speed: e.target.value } })} style={styles.miniInput} placeholder="Spd"/><input type="number" value={editData.stats?.stamina} onChange={e => setEditData({...editData, stats: { ...editData.stats, stamina: e.target.value } })} style={styles.miniInput} placeholder="Sta"/></div> )}
                        {type === 'TRAINING' && ( <div style={{display:'flex', gap:'5px'}}><input type="number" value={editData.value} onChange={e => setEditData({...editData, value: e.target.value})} style={styles.miniInput} placeholder="Value"/><span style={{fontSize:'0.8rem', alignSelf:'center', color:'#aaa'}}>{item.statType}</span></div> )}
                        
                        {/* 🏟️ Edit TRACK Segments */}
                        {type === 'TRACK' && (
                            <div style={{display:'flex', gap:'5px', flexDirection: 'column'}}>
                                <input type="number" value={editData.distance} onChange={e => setEditData({...editData, distance: e.target.value})} style={styles.miniInput} placeholder="Total Distance"/>
                                <div style={{maxHeight:'150px', overflowY:'auto', border:'1px solid #444', padding:'5px', background:'#222'}}>
                                    <small style={{color:'#aaa'}}>แก้จุดสำคัญ ({editSegments.length} จุด):</small>
                                    {editSegments.map((seg, idx) => (
                                        <div key={idx} style={{display:'flex', gap:'3px', marginBottom:'3px'}}>
                                            <select value={seg.type} onChange={e => handleEditSegmentChange(idx, 'type', e.target.value)} style={{fontSize:'0.7rem', width:'60px', background:'#333', color:'white', border:'1px solid #555'}}>
                                                <option value="STRAIGHT">Str</option><option value="CURVE">Cur</option><option value="SLOPE">Slp</option>
                                            </select>
                                            <input type="number" value={seg.distance} onChange={e => handleEditSegmentChange(idx, 'distance', e.target.value)} style={{fontSize:'0.7rem', width:'50px', background:'#333', color:'white', border:'1px solid #555'}} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{marginTop:'5px'}}>
                            <button onClick={() => handleUpdateSubmit(type)} style={styles.saveBtn}>💾 Save</button>
                            <button onClick={() => setEditMode(null)} style={styles.cancelBtn}>❌</button>
                        </div>
                    </div>
                ) : (
                    // 🟢 โหมดปกติ (แสดงผล)
                    <div style={{flex:1}}>
                        <div style={{fontWeight:'bold', color:'white', fontSize:'1rem'}}>{item.name}</div>
                        {type === 'HORSE' && <div style={{fontSize:'0.8rem', color:'#aaa'}}>Spd: {item.stats?.speed} | Sta: {item.stats?.stamina}</div>}
                        {type === 'TRAINING' && <div style={{fontSize:'0.8rem', color:'#e91e63'}}>+{item.value} {item.statType}</div>}
                        {type === 'ACTION' && <div style={{fontSize:'0.8rem', color:'#00e676'}}>{item.effectType} ({item.value})</div>}
                        
                        {/* 🏟️ แสดงผลสนาม */}
                        {type === 'TRACK' && (
                            <div style={{fontSize:'0.8rem', color:'#2196f3'}}>
                                <div>ระยะรวม: {item.distance}m</div>
                                <div style={{fontSize:'0.7rem', color:'#aaa'}}>
                                    (มี {item.segments?.length || 0} จุดสำคัญ)
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {editMode !== item._id && (
                    <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                        <button onClick={() => startEdit(item)} style={styles.editBtn}>✏️</button>
                        <button onClick={() => handleDelete(item._id, type)} style={styles.deleteBtn}>🗑️</button>
                    </div>
                )}
            </div>
        ))}
    </div>
  );

  return (
    // ✅ Wrapper สำหรับพื้นหลังสีดำเต็มจอ
    <div style={styles.pageWrapper}>
        <div style={styles.container}>
            <header style={styles.header}>
                <Link to="/home" style={styles.backLink}>⬅ DASHBOARD</Link>
                <h1 style={styles.title}>GAME MASTER</h1>
            </header>
            
            <div style={styles.tabs}>
                <button onClick={() => setTab('ADD')} style={tab === 'ADD' ? styles.activeTab : styles.tab}>➕ ADD NEW</button>
                <button onClick={() => setTab('MANAGE')} style={tab === 'MANAGE' ? styles.activeTab : styles.tab}>📋 MANAGE DATA</button>
            </div>

            <div style={styles.contentBox}>
                {tab === 'ADD' && (
                    <div>
                        <h2 style={{color:'white', marginBottom:'20px'}}>Add New Asset</h2>
                        <div style={{marginBottom:'20px'}}>
                            <label style={{color:'#aaa'}}>Type: </label>
                            <select value={addType} onChange={(e) => setAddType(e.target.value)} style={styles.input}>
                                <option value="HORSE">🐎 Horse</option><option value="TRAINING">🏋️ Training</option><option value="ACTION">⚡ Action</option><option value="TRACK">🏟️ Track</option> 
                            </select>
                        </div>
                        <form onSubmit={handleAddSubmit}>
                            <div style={styles.field}>
                                <label style={{color:'#aaa'}}>Name:</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={styles.input} required />
                            </div>
                            <div style={styles.field}>
                                <label style={{color:'#aaa'}}>Image:</label>
                                <input id="fileInput" type="file" onChange={e => setFile(e.target.files[0])} style={styles.input} accept="image/*" />
                            </div>
                            
                            {addType === 'HORSE' && (<><div style={styles.field}><label style={{color:'#aaa'}}>Rarity:</label><select value={formData.rarity} onChange={e => setFormData({...formData, rarity: e.target.value})} style={styles.input}><option value="N">N</option><option value="R">R</option><option value="SR">SR</option><option value="SSR">SSR</option></select></div><div style={{display:'flex', gap:'10px'}}><input type="number" placeholder="Speed" value={formData.speed} onChange={e => setFormData({...formData, speed: e.target.value})} style={styles.input} /><input type="number" placeholder="Stamina" value={formData.stamina} onChange={e => setFormData({...formData, stamina: e.target.value})} style={styles.input} /></div></>)}
                            {addType === 'TRAINING' && (<><div style={styles.field}><label style={{color:'#aaa'}}>Stat Type:</label><select value={formData.statType} onChange={e => setFormData({...formData, statType: e.target.value})} style={styles.input}><option value="SPEED">SPEED</option><option value="STAMINA">STAMINA</option><option value="POWER">POWER</option></select></div><div style={styles.field}><label style={{color:'#aaa'}}>Value:</label><input type="number" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} style={styles.input} /></div></>)}
                            {addType === 'ACTION' && (<><div style={styles.field}><label style={{color:'#aaa'}}>Description:</label><input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={styles.input} /></div><div style={styles.field}><label style={{color:'#aaa'}}>Condition:</label><select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} style={styles.input}><option value="ANY">ANY</option><option value="START">START</option><option value="CURVE">CURVE</option><option value="STRAIGHT">STRAIGHT</option><option value="SLOPE">SLOPE</option><option value="LAST_SPURT">LAST_SPURT</option></select></div><div style={{display:'flex', gap:'10px'}}><select value={formData.effectType} onChange={e => setFormData({...formData, effectType: e.target.value})} style={styles.input}><option value="SPEED_BOOST">Speed</option><option value="STAMINA_HEAL">Heal</option><option value="LANE_CHANGE">Lane Change</option></select><input type="number" placeholder="Value" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} style={styles.input} /></div></>)}
                            
                            {/* 🏟️ ฟอร์มเพิ่มสนาม */}
                            {addType === 'TRACK' && (<>
                                <div style={styles.field}><label style={{color:'#aaa'}}>Total Distance:</label><input type="number" value={formData.distance} onChange={e => setFormData({...formData, distance: e.target.value})} style={styles.input} /></div>
                                <div style={styles.field}><label style={{color:'#aaa'}}>Description:</label><input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={styles.input} /></div>
                                
                                <div style={{backgroundColor:'#252525', padding:'10px', borderRadius:'10px', marginTop:'10px', border:'1px solid #444'}}>
                                    <label style={{fontWeight:'bold', color:'white'}}>📍 Segments:</label>
                                    <div style={{display:'flex', alignItems:'center', gap:'10px', marginTop:'5px'}}>
                                        <span style={{color:'#aaa'}}>Count:</span>
                                        <input type="number" min="1" max="20" value={segmentCount} onChange={e => handleSegmentCountChange(e.target.value)} style={{width:'60px', padding:'5px', background:'#333', border:'1px solid #555', color:'white', borderRadius:'5px'}} />
                                    </div>
                                    <div style={{marginTop:'10px', display:'flex', flexDirection:'column', gap:'5px'}}>
                                        {trackSegments.map((seg, idx) => (
                                            <div key={idx} style={{display:'flex', gap:'10px', alignItems:'center'}}>
                                                <span style={{width:'20px', fontSize:'0.8rem', color:'#666'}}>{idx+1}.</span>
                                                <select value={seg.type} onChange={e => handleSegmentChange(idx, 'type', e.target.value)} style={{padding:'5px', borderRadius:'5px', border:'1px solid #555', background:'#333', color:'white'}}>
                                                    <option value="STRAIGHT">Straight</option><option value="CURVE">Curve</option><option value="SLOPE">Slope</option>
                                                </select>
                                                <input type="number" placeholder="Dist (m)" value={seg.distance} onChange={e => handleSegmentChange(idx, 'distance', e.target.value)} style={{padding:'5px', width:'100px', borderRadius:'5px', border:'1px solid #555', background:'#333', color:'white'}} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>)}

                            <button type="submit" style={styles.submitBtn}>💾 SAVE TO DB</button>
                        </form>
                    </div>
                )}

                {tab === 'MANAGE' && (
                    <div style={{color:'white'}}>
                        <h3 style={{borderBottom:'1px solid #333', paddingBottom:'10px'}}>🐎 Horses ({allData.horses.length})</h3>{renderCardList(allData.horses, 'HORSE')}
                        <h3 style={{marginTop:'30px', borderBottom:'1px solid #333', paddingBottom:'10px'}}>🏋️ Training Cards ({allData.trainings.length})</h3>{renderCardList(allData.trainings, 'TRAINING')}
                        <h3 style={{marginTop:'30px', borderBottom:'1px solid #333', paddingBottom:'10px'}}>⚡ Action Cards ({allData.actions.length})</h3>{renderCardList(allData.actions, 'ACTION')}
                        <h3 style={{marginTop:'30px', borderBottom:'1px solid #333', paddingBottom:'10px'}}>🏟️ Tracks ({allData.tracks.length})</h3>{renderCardList(allData.tracks, 'TRACK')}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}

// 🎨 STYLES (Modern Dark Theme)
const styles = {
  // ✅ เพิ่ม style นี้: คลุมทั้งหน้าด้วยสีดำ
  pageWrapper: {
    backgroundColor: '#111',
    minHeight: '100vh',
    width: '100%',
    fontFamily: "'Inter', sans-serif",
    boxSizing: 'border-box'
  },
  // ✅ แก้ container: ลบ background เดิมออก (เพราะย้ายไป pageWrapper แล้ว)
  container: { 
    maxWidth: '1000px', 
    margin: '0 auto', 
    padding: '40px 20px', 
    color: 'white' 
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #333', paddingBottom: '20px' },
  backLink: { textDecoration: 'none', color: '#aaa', fontWeight: 'bold', fontSize:'1.1rem', transition:'0.2s' },
  title: { fontSize: '2rem', fontWeight: '900', color: '#e91e63', letterSpacing:'1px', margin:0 },
  tabs: { display: 'flex', gap: '15px', marginBottom: '30px' },
  tab: { flex: 1, padding: '15px', background: '#1e1e1e', color: '#aaa', border: '1px solid #333', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize:'1rem', transition:'0.2s' },
  activeTab: { flex: 1, padding: '15px', background: 'linear-gradient(45deg, #e91e63, #c2185b)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize:'1rem', boxShadow:'0 5px 15px rgba(233,30,99,0.3)' },
  contentBox: { background: '#1e1e1e', padding: '40px', borderRadius: '20px', border: '1px solid #333', boxShadow:'0 10px 30px rgba(0,0,0,0.3)' },
  field: { marginBottom: '20px' },
  input: { width: '100%', padding: '15px', background: '#2a2a2a', border: '1px solid #444', borderRadius: '10px', color: 'white', marginTop:'5px', boxSizing:'border-box', outline:'none', fontSize:'1rem' },
  submitBtn: { width: '100%', padding: '15px', background: '#00e676', color: 'black', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop:'20px', fontSize:'1.1rem', transition:'0.2s' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '20px' },
  card: { display: 'flex', alignItems: 'center', background: '#252525', padding: '15px', borderRadius: '12px', border: '1px solid #333', transition:'0.2s', ':hover':{ borderColor:'#555' } },
  editBtn: { background: '#ff9800', border:'none', cursor:'pointer', padding:'10px', borderRadius:'8px', marginRight:'5px', fontSize:'1rem' },
  deleteBtn: { background: '#e91e63', border:'none', cursor:'pointer', padding:'10px', borderRadius:'8px', color:'white', fontSize:'1rem' },
  miniInput: { width: '100%', padding: '8px', background: '#333', border: '1px solid #555', borderRadius: '5px', color:'white', outline:'none' },
  saveBtn: { background: '#00e676', color:'black', border:'none', padding:'5px 15px', borderRadius:'5px', marginRight:'5px', cursor:'pointer', fontWeight:'bold' },
  cancelBtn: { background: '#555', color:'white', border:'none', padding:'5px 15px', borderRadius:'5px', cursor:'pointer' }
};

export default Admin;