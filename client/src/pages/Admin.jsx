import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Admin() {
  const [tab, setTab] = useState('ADD');
  const [refresh, setRefresh] = useState(false);

  // --- ส่วนของ ADD NEW ---
  const [addType, setAddType] = useState('HORSE');
  const [file, setFile] = useState(null); 
  
  // State พื้นฐาน (เพิ่ม Stat ให้ครบ 5 ค่า)
  const [formData, setFormData] = useState({
    name: '', rarity: 'R', 
    speed: 600, stamina: 600, power: 600, guts: 600, wisdom: 600, // ✅ 5 Stats
    statType: 'SPEED', value: 10, 
    condition: 'ANY', effectType: 'SPEED_BOOST', description: '',
    distance: 2000, weather: 'Sunny'
  });

  // 🏟️ Track Logic
  const [segmentCount, setSegmentCount] = useState(1); 
  const [trackSegments, setTrackSegments] = useState([
    { type: 'STRAIGHT', length: 1000 } // ✅ แก้ key เป็น length ให้ตรง engine
  ]);
  // ✅ เพิ่ม Landmarks (จุด Trigger)
  const [trackLandmarks, setTrackLandmarks] = useState([
      { name: 'Start Gate', distance: 0 },
      { name: 'Final Bend', distance: 1000 }
  ]);

  // Handle Segments
  const handleSegmentCountChange = (count) => {
    const newCount = parseInt(count) || 1;
    setSegmentCount(newCount);
    const newSegments = [...trackSegments];
    if (newCount > newSegments.length) {
        for (let i = newSegments.length; i < newCount; i++) newSegments.push({ type: 'STRAIGHT', length: 200 });
    } else {
        newSegments.splice(newCount);
    }
    setTrackSegments(newSegments);
  };
  const handleSegmentChange = (idx, field, val) => {
    const newSegs = [...trackSegments]; newSegs[idx][field] = val; setTrackSegments(newSegs);
  };

  // Handle Landmarks
  const addLandmark = () => setTrackLandmarks([...trackLandmarks, { name: '', distance: 0 }]);
  const removeLandmark = (idx) => setTrackLandmarks(trackLandmarks.filter((_, i) => i !== idx));
  const updateLandmark = (idx, field, val) => {
      const newMarks = [...trackLandmarks]; newMarks[idx][field] = val; setTrackLandmarks(newMarks);
  };

  // --- MANAGE DATA ---
  const [allData, setAllData] = useState({ horses: [], trainings: [], actions: [], tracks: [] });
  const [editMode, setEditMode] = useState(null);
  const [editData, setEditData] = useState({});
  const [editFile, setEditFile] = useState(null); 
  const [editSegments, setEditSegments] = useState([]);
  const [editLandmarks, setEditLandmarks] = useState([]); // ✅ Edit Landmarks

  useEffect(() => { fetchAllCards(); }, [refresh]);

  const fetchAllCards = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/all-cards');
      setAllData(res.data);
    } catch (err) { console.error(err); }
  };

  // --- CREATE ---
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('type', addType);
    data.append('name', formData.name);
    if (file) data.append('imageFile', file); else { alert("⚠️ ใส่รูปด้วยครับ!"); return; }

    if (addType === 'HORSE') {
        data.append('rarity', formData.rarity);
        // ✅ ส่งครบ 5 Stats
        data.append('stats', JSON.stringify({ 
            speed: formData.speed, stamina: formData.stamina, 
            power: formData.power, guts: formData.guts, wisdom: formData.wisdom 
        }));
    } else if (addType === 'TRAINING') {
        data.append('statType', formData.statType);
        data.append('value', formData.value);
        data.append('rarity', formData.rarity);
    } else if (addType === 'ACTION') {
        data.append('description', formData.description);
        data.append('condition', formData.condition);
        data.append('effectType', formData.effectType);
        data.append('value', formData.value);
        data.append('rarity', formData.rarity);
    } else if (addType === 'TRACK') { 
        data.append('description', formData.description);
        data.append('distance', formData.distance);
        data.append('weatherOptions', JSON.stringify([formData.weather])); // Mock weather
        data.append('segments', JSON.stringify(trackSegments));
        data.append('landmarks', JSON.stringify(trackLandmarks)); // ✅ ส่ง Landmarks
    }

    try {
        await axios.post('http://localhost:5000/api/admin/add-card', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        alert("✅ เพิ่มข้อมูลสำเร็จ!");
        setRefresh(!refresh);
        setFormData({ ...formData, name: '' });
        setFile(null);
        document.getElementById('fileInput').value = ""; 
    } catch (err) { alert("Error: " + (err.response?.data?.message || err.message)); }
  };

  // --- DELETE ---
  const handleDelete = async (id, type) => {
    if (!window.confirm("แน่ใจนะว่าจะลบ?")) return;
    try {
        await axios.delete(`http://localhost:5000/api/admin/delete-card/${id}?collectionType=${type}`);
        setRefresh(!refresh);
    } catch (err) { alert("Error: " + err.message); }
  };

  // --- UPDATE ---
  const startEdit = (item) => {
    setEditMode(item._id);
    setEditData(item);
    setEditFile(null);
    if (item.segments) setEditSegments(item.segments);
    if (item.landmarks) setEditLandmarks(item.landmarks); // ✅ Load Landmarks
  };

  const handleUpdateSubmit = async (type) => {
    const data = new FormData();
    data.append('collectionType', type);
    data.append('name', editData.name);
    if (editFile) data.append('imageFile', editFile); else data.append('image', editData.image);

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
        data.append('landmarks', JSON.stringify(editLandmarks)); // ✅ Update Landmarks
    }

    try {
        await axios.put(`http://localhost:5000/api/admin/update-card/${editMode}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        alert("📝 แก้ไขเรียบร้อย");
        setEditMode(null);
        setRefresh(!refresh);
    } catch (err) { alert("Error: " + err.message); }
  };

  // --- RENDER LIST ---
  const renderCardList = (list, type) => (
    <div style={styles.grid}>
        {list.map(item => (
            <div key={item._id} style={styles.card}>
                {/* Image Section */}
                <div style={{display:'flex', flexDirection:'column', alignItems:'center', marginRight:'15px'}}>
                    <img src={item.image} style={{width:'70px', height:'70px', borderRadius:'10px', objectFit:'cover', border: '2px solid #444'}} />
                    {editMode === item._id && <input type="file" onChange={e => setEditFile(e.target.files[0])} style={{width:'80px', fontSize:'0.7rem', marginTop:'5px'}} />}
                </div>
                
                {/* Info / Edit Form */}
                <div style={{flex:1}}>
                    {editMode === item._id ? (
                        <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                            <input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} style={styles.miniInput} />
                            
                            {type === 'HORSE' && (
                                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'5px'}}>
                                    {['speed','stamina','power','guts','wisdom'].map(s => (
                                        <input key={s} type="number" value={editData.stats[s]} onChange={e => setEditData({...editData, stats: {...editData.stats, [s]: e.target.value}})} style={styles.miniInput} placeholder={s} title={s}/>
                                    ))}
                                </div>
                            )}
                            
                            {/* ... (TRAINING / ACTION logic similar to add) ... */}
                            
                            <div style={{marginTop:'5px'}}>
                                <button onClick={() => handleUpdateSubmit(type)} style={styles.saveBtn}>💾</button>
                                <button onClick={() => setEditMode(null)} style={styles.cancelBtn}>❌</button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div style={{fontWeight:'bold', fontSize:'1.1rem', color:'#fff'}}>{item.name} <span style={{fontSize:'0.7rem', color: item.rarity==='SSR'?'gold':'#aaa'}}>{item.rarity}</span></div>
                            
                            {/* 🐎 Display 5 Stats */}
                            {type === 'HORSE' && (
                                <div style={{fontSize:'0.75rem', color:'#ccc', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2px'}}>
                                    <span style={{color:'#2196f3'}}>Spd: {item.stats?.speed}</span>
                                    <span style={{color:'#ff9800'}}>Sta: {item.stats?.stamina}</span>
                                    <span style={{color:'#f44336'}}>Pow: {item.stats?.power}</span>
                                    <span style={{color:'#e91e63'}}>Gut: {item.stats?.guts}</span>
                                    <span style={{color:'#00e676'}}>Wis: {item.stats?.wisdom}</span>
                                </div>
                            )}
                            
                            {/* 🏟️ Display Track Info */}
                            {type === 'TRACK' && (
                                <div style={{fontSize:'0.8rem', color:'#aaa'}}>
                                    <div>🚩 {item.distance}m | Segments: {item.segments?.length}</div>
                                    <div>⚡ Landmarks: {item.landmarks?.length || 0} จุด</div>
                                </div>
                            )}

                            {/* Action / Training Info */}
                            {type === 'ACTION' && <div style={{fontSize:'0.8rem', color:'#00e676'}}>{item.effectType} ({item.value})</div>}
                            {type === 'TRAINING' && <div style={{fontSize:'0.8rem', color:'#e91e63'}}>+{item.value} {item.statType}</div>}
                        </div>
                    )}
                </div>

                {/* Actions */}
                {editMode !== item._id && (
                    <div style={{display:'flex', flexDirection:'column', gap:'5px', marginLeft:'10px'}}>
                        <button onClick={() => startEdit(item)} style={styles.editBtn}>✏️</button>
                        <button onClick={() => handleDelete(item._id, type)} style={styles.deleteBtn}>🗑️</button>
                    </div>
                )}
            </div>
        ))}
    </div>
  );

  return (
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
                            
                            {/* 🐎 HORSE INPUTS (5 STATS) */}
                            {addType === 'HORSE' && (<>
                                <div style={styles.field}><label style={{color:'#aaa'}}>Rarity:</label><select value={formData.rarity} onChange={e => setFormData({...formData, rarity: e.target.value})} style={styles.input}><option value="N">N</option><option value="R">R</option><option value="SR">SR</option><option value="SSR">SSR</option></select></div>
                                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'20px'}}>
                                    <div><label style={{color:'#2196f3'}}>Speed</label><input type="number" value={formData.speed} onChange={e => setFormData({...formData, speed: e.target.value})} style={styles.input} /></div>
                                    <div><label style={{color:'#ff9800'}}>Stamina</label><input type="number" value={formData.stamina} onChange={e => setFormData({...formData, stamina: e.target.value})} style={styles.input} /></div>
                                    <div><label style={{color:'#f44336'}}>Power</label><input type="number" value={formData.power} onChange={e => setFormData({...formData, power: e.target.value})} style={styles.input} /></div>
                                    <div><label style={{color:'#e91e63'}}>Guts</label><input type="number" value={formData.guts} onChange={e => setFormData({...formData, guts: e.target.value})} style={styles.input} /></div>
                                    <div><label style={{color:'#00e676'}}>Wisdom</label><input type="number" value={formData.wisdom} onChange={e => setFormData({...formData, wisdom: e.target.value})} style={styles.input} /></div>
                                </div>
                            </>)}

                            {/* 🏟️ TRACK INPUTS (SEGMENTS + LANDMARKS) */}
                            {addType === 'TRACK' && (<>
                                <div style={styles.field}><label style={{color:'#aaa'}}>Total Distance:</label><input type="number" value={formData.distance} onChange={e => setFormData({...formData, distance: e.target.value})} style={styles.input} /></div>
                                <div style={styles.field}><label style={{color:'#aaa'}}>Description:</label><input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={styles.input} /></div>
                                
                                {/* Segments */}
                                <div style={styles.groupBox}>
                                    <label style={{fontWeight:'bold', color:'#2196f3'}}>📍 Segments (ช่วงสนาม):</label>
                                    <div style={{display:'flex', alignItems:'center', gap:'10px', marginTop:'5px', marginBottom:'10px'}}>
                                        <span style={{color:'#aaa'}}>Count:</span>
                                        <input type="number" min="1" max="20" value={segmentCount} onChange={e => handleSegmentCountChange(e.target.value)} style={{width:'60px', padding:'5px', background:'#333', border:'1px solid #555', color:'white', borderRadius:'5px'}} />
                                    </div>
                                    {trackSegments.map((seg, idx) => (
                                        <div key={idx} style={{display:'flex', gap:'5px', marginBottom:'5px'}}>
                                            <span style={{width:'20px', color:'#666'}}>{idx+1}.</span>
                                            <select value={seg.type} onChange={e => handleSegmentChange(idx, 'type', e.target.value)} style={styles.miniSelect}>
                                                <option value="STRAIGHT">Straight</option><option value="CURVE">Curve</option><option value="SLOPE">Slope</option>
                                            </select>
                                            <input type="number" placeholder="Len (m)" value={seg.length} onChange={e => handleSegmentChange(idx, 'length', e.target.value)} style={styles.miniInputTable} />
                                        </div>
                                    ))}
                                </div>

                                {/* Landmarks */}
                                <div style={{...styles.groupBox, borderColor:'#e91e63'}}>
                                    <label style={{fontWeight:'bold', color:'#e91e63'}}>⚡ Landmarks (จุด Trigger):</label>
                                    {trackLandmarks.map((lm, idx) => (
                                        <div key={idx} style={{display:'flex', gap:'5px', marginBottom:'5px'}}>
                                            <input type="text" placeholder="Name (e.g. Start)" value={lm.name} onChange={e => updateLandmark(idx, 'name', e.target.value)} style={styles.miniInputTable} />
                                            <input type="number" placeholder="Dist (m)" value={lm.distance} onChange={e => updateLandmark(idx, 'distance', e.target.value)} style={{...styles.miniInputTable, width:'80px'}} />
                                            <button type="button" onClick={() => removeLandmark(idx)} style={{background:'red', border:'none', color:'white', borderRadius:'3px', cursor:'pointer'}}>x</button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addLandmark} style={{marginTop:'5px', padding:'5px', background:'#e91e63', border:'none', color:'white', borderRadius:'5px', cursor:'pointer', width:'100%'}}>+ Add Landmark</button>
                                </div>
                            </>)}

                            {/* Training / Action Inputs */}
                            {addType === 'TRAINING' && (<><div style={styles.field}><label>Stat:</label><select value={formData.statType} onChange={e=>setFormData({...formData, statType:e.target.value})} style={styles.input}><option>SPEED</option><option>STAMINA</option><option>POWER</option><option>GUTS</option><option>WISDOM</option></select></div><div style={styles.field}><label>Value:</label><input type="number" value={formData.value} onChange={e=>setFormData({...formData, value:e.target.value})} style={styles.input}/></div></>)}
                            {addType === 'ACTION' && (<><div style={styles.field}><label>Desc:</label><input value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})} style={styles.input}/></div><div style={styles.field}><label>Cond:</label><select value={formData.condition} onChange={e=>setFormData({...formData, condition:e.target.value})} style={styles.input}><option>ANY</option><option>START</option><option>CURVE</option><option>STRAIGHT</option><option>SLOPE</option><option>LAST_SPURT</option></select></div><div style={{display:'flex', gap:'10px'}}><select value={formData.effectType} onChange={e=>setFormData({...formData, effectType:e.target.value})} style={styles.input}><option value="SPEED_BOOST">Speed</option><option value="STAMINA_HEAL">Heal</option><option value="LANE_CHANGE">Lane</option></select><input type="number" placeholder="Val" value={formData.value} onChange={e=>setFormData({...formData, value:e.target.value})} style={styles.input}/></div></>)}

                            <button type="submit" style={styles.submitBtn}>💾 SAVE TO DB</button>
                        </form>
                    </div>
                )}

                {tab === 'MANAGE' && (
                    <div style={{color:'white'}}>
                        <h3 style={{borderBottom:'1px solid #333', paddingBottom:'10px'}}>🐎 Horses ({allData.horses.length})</h3>{renderCardList(allData.horses, 'HORSE')}
                        <h3 style={{marginTop:'30px', borderBottom:'1px solid #333', paddingBottom:'10px'}}>🏟️ Tracks ({allData.tracks.length})</h3>{renderCardList(allData.tracks, 'TRACK')}
                        <h3 style={{marginTop:'30px', borderBottom:'1px solid #333', paddingBottom:'10px'}}>⚡ Action Cards ({allData.actions.length})</h3>{renderCardList(allData.actions, 'ACTION')}
                        <h3 style={{marginTop:'30px', borderBottom:'1px solid #333', paddingBottom:'10px'}}>🏋️ Training Cards ({allData.trainings.length})</h3>{renderCardList(allData.trainings, 'TRAINING')}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}

const styles = {
  pageWrapper: { backgroundColor: '#111', minHeight: '100vh', width: '100%', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', color: 'white' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #333', paddingBottom: '20px' },
  backLink: { textDecoration: 'none', color: '#aaa', fontWeight: 'bold', fontSize:'1.1rem', transition:'0.2s' },
  title: { fontSize: '2rem', fontWeight: '900', color: '#e91e63', letterSpacing:'1px', margin:0 },
  tabs: { display: 'flex', gap: '15px', marginBottom: '30px' },
  tab: { flex: 1, padding: '15px', background: '#1e1e1e', color: '#aaa', border: '1px solid #333', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize:'1rem' },
  activeTab: { flex: 1, padding: '15px', background: 'linear-gradient(45deg, #e91e63, #c2185b)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize:'1rem', boxShadow:'0 5px 15px rgba(233,30,99,0.3)' },
  contentBox: { background: '#1e1e1e', padding: '40px', borderRadius: '20px', border: '1px solid #333', boxShadow:'0 10px 30px rgba(0,0,0,0.3)' },
  field: { marginBottom: '20px' },
  input: { width: '100%', padding: '15px', background: '#2a2a2a', border: '1px solid #444', borderRadius: '10px', color: 'white', marginTop:'5px', boxSizing:'border-box', outline:'none', fontSize:'1rem' },
  submitBtn: { width: '100%', padding: '15px', background: '#00e676', color: 'black', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop:'20px', fontSize:'1.1rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '20px' },
  card: { display: 'flex', alignItems: 'center', background: '#252525', padding: '15px', borderRadius: '12px', border: '1px solid #333' },
  editBtn: { background: '#ff9800', border:'none', cursor:'pointer', padding:'10px', borderRadius:'8px', marginRight:'5px', fontSize:'1rem' },
  deleteBtn: { background: '#e91e63', border:'none', cursor:'pointer', padding:'10px', borderRadius:'8px', color:'white', fontSize:'1rem' },
  miniInput: { width: '100%', padding: '8px', background: '#333', border: '1px solid #555', borderRadius: '5px', color:'white', outline:'none' },
  saveBtn: { background: '#00e676', color:'black', border:'none', padding:'5px 15px', borderRadius:'5px', marginRight:'5px', cursor:'pointer', fontWeight:'bold' },
  cancelBtn: { background: '#555', color:'white', border:'none', padding:'5px 15px', borderRadius:'5px', cursor:'pointer' },
  groupBox: { backgroundColor:'#252525', padding:'10px', borderRadius:'10px', marginTop:'10px', border:'1px solid #2196f3' },
  miniSelect: { padding:'5px', borderRadius:'5px', border:'1px solid #555', background:'#333', color:'white' },
  miniInputTable: { padding:'5px', width:'100%', borderRadius:'5px', border:'1px solid #555', background:'#333', color:'white' }
};

export default Admin;