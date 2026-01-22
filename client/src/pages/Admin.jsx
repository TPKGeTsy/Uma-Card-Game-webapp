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
  const [segmentCount, setSegmentCount] = useState(1); // จำนวนจุดสำคัญ
  const [trackSegments, setTrackSegments] = useState([
    { type: 'STRAIGHT', distance: 1000 } // ค่าเริ่มต้น 1 จุด
  ]);

  // ฟังก์ชันปรับจำนวน Segment (เมื่อกรอกเลข X)
  const handleSegmentCountChange = (count) => {
    const newCount = parseInt(count) || 1;
    setSegmentCount(newCount);
    
    // ปรับขนาด Array ให้เท่ากับจำนวนใหม่
    const newSegments = [...trackSegments];
    if (newCount > newSegments.length) {
        // ถ้าเพิ่ม: ให้เพิ่มช่องว่างเข้าไป
        for (let i = newSegments.length; i < newCount; i++) {
            newSegments.push({ type: 'STRAIGHT', distance: 100 });
        }
    } else {
        // ถ้าลด: ให้ตัดส่วนเกินออก
        newSegments.splice(newCount);
    }
    setTrackSegments(newSegments);
  };

  // ฟังก์ชันแก้ไขค่าในแต่ละ Segment (เมื่อพิมพ์ในแต่ละแถว)
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
  // 🏟️ State สำหรับ Edit Track Segments
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
        // 🏟️ ส่ง Segments ไปเป็น JSON String
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
    // ถ้าเป็น Track ให้โหลด Segments มาใส่ State Edit ด้วย
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
        // 🏟️ ส่ง Segments ที่แก้แล้วกลับไป
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

  const renderCardList = (list, type) => (
    <div style={styles.grid}>
        {list.map(item => (
            <div key={item._id} style={styles.card}>
                
                {editMode === item._id ? (
                    <div style={{display:'flex', flexDirection:'column', alignItems:'center', marginRight:'10px'}}>
                        <img src={item.image} alt={item.name} style={{width:'50px', height:'50px', borderRadius:'50%', objectFit:'cover', border: '1px solid #ddd', opacity: 0.5}} />
                        <input type="file" onChange={e => setEditFile(e.target.files[0])} style={{width:'70px', fontSize:'0.7rem', marginTop:'5px'}} accept="image/*" />
                    </div>
                ) : (
                    <img src={item.image} alt={item.name} style={{width:'50px', height:'50px', borderRadius:'50%', objectFit:'cover', border: '1px solid #ddd', marginRight:'10px'}} />
                )}
                
                {editMode === item._id ? (
                    // 🔴 โหมดแก้ไข
                    <div style={{flex:1, display:'flex', flexDirection:'column', gap:'5px'}}>
                        <input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} style={styles.miniInput} placeholder="ชื่อ"/>

                        {type === 'HORSE' && ( <div style={{display:'flex', gap:'5px'}}><input type="number" value={editData.stats?.speed} onChange={e => setEditData({...editData, stats: { ...editData.stats, speed: e.target.value } })} style={styles.miniInput} placeholder="Spd"/><input type="number" value={editData.stats?.stamina} onChange={e => setEditData({...editData, stats: { ...editData.stats, stamina: e.target.value } })} style={styles.miniInput} placeholder="Sta"/></div> )}
                        {type === 'TRAINING' && ( <div style={{display:'flex', gap:'5px'}}><input type="number" value={editData.value} onChange={e => setEditData({...editData, value: e.target.value})} style={styles.miniInput} placeholder="Value"/><span style={{fontSize:'0.8rem', alignSelf:'center'}}>{item.statType}</span></div> )}
                        
                        {/* 🏟️ Edit TRACK Segments */}
                        {type === 'TRACK' && (
                            <div style={{display:'flex', gap:'5px', flexDirection: 'column'}}>
                                <input type="number" value={editData.distance} onChange={e => setEditData({...editData, distance: e.target.value})} style={styles.miniInput} placeholder="Total Distance"/>
                                <div style={{maxHeight:'150px', overflowY:'auto', border:'1px solid #eee', padding:'5px'}}>
                                    <small>แก้จุดสำคัญ ({editSegments.length} จุด):</small>
                                    {editSegments.map((seg, idx) => (
                                        <div key={idx} style={{display:'flex', gap:'3px', marginBottom:'3px'}}>
                                            <select value={seg.type} onChange={e => handleEditSegmentChange(idx, 'type', e.target.value)} style={{fontSize:'0.7rem', width:'60px'}}>
                                                <option value="STRAIGHT">Str</option><option value="CURVE">Cur</option><option value="SLOPE">Slp</option>
                                            </select>
                                            <input type="number" value={seg.distance} onChange={e => handleEditSegmentChange(idx, 'distance', e.target.value)} style={{fontSize:'0.7rem', width:'50px'}} />
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
                    // 🟢 โหมดปกติ
                    <div style={{flex:1}}>
                        <div style={{fontWeight:'bold'}}>{item.name}</div>
                        {type === 'HORSE' && <div style={{fontSize:'0.8rem', color:'#666'}}>Spd: {item.stats?.speed} | Sta: {item.stats?.stamina}</div>}
                        {type === 'TRAINING' && <div style={{fontSize:'0.8rem', color:'#e91e63'}}>+{item.value} {item.statType}</div>}
                        
                        {/* 🏟️ แสดงผลสนาม */}
                        {type === 'TRACK' && (
                            <div style={{fontSize:'0.8rem', color:'#3f51b5'}}>
                                <div>ระยะรวม: {item.distance}m</div>
                                <div style={{fontSize:'0.7rem', color:'#666'}}>
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
    <div style={styles.container}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <Link to="/home" style={{textDecoration:'none', fontWeight:'bold', color: '#333'}}>⬅ กลับหน้าหลัก</Link>
        <h1>🛠️ Game Master Control</h1>
      </header>
      <div style={styles.tabs}>
        <button onClick={() => setTab('ADD')} style={tab === 'ADD' ? styles.activeTab : styles.tab}>➕ เพิ่มข้อมูลใหม่ (Add)</button>
        <button onClick={() => setTab('MANAGE')} style={tab === 'MANAGE' ? styles.activeTab : styles.tab}>📋 จัดการข้อมูล (Edit/Delete)</button>
      </div>

      {tab === 'ADD' && (
        <div style={styles.box}>
            <h2>เพิ่มข้อมูลลง Database</h2>
            <div style={{marginBottom:'15px'}}>
                <label>ประเภท: </label>
                <select value={addType} onChange={(e) => setAddType(e.target.value)} style={styles.input}>
                    <option value="HORSE">🐎 ม้าแข่ง</option><option value="TRAINING">🏋️ การ์ดฝึก</option><option value="ACTION">⚡ การ์ด Action</option>
                    <option value="TRACK">🏟️ สนามแข่ง</option> 
                </select>
            </div>
            <form onSubmit={handleAddSubmit}>
                <div style={styles.field}><label>ชื่อ:</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={styles.input} required placeholder="ใส่ชื่อ..." /></div>
                <div style={styles.field}><label>รูปภาพ (File Upload):</label><input id="fileInput" type="file" onChange={e => setFile(e.target.files[0])} style={styles.input} accept="image/*" /></div>
                
                {addType === 'HORSE' && (<><div style={styles.field}><label>ระดับความหายาก:</label><select value={formData.rarity} onChange={e => setFormData({...formData, rarity: e.target.value})} style={styles.input}><option value="N">N</option><option value="R">R</option><option value="SR">SR</option><option value="SSR">SSR</option></select></div><div style={{display:'flex', gap:'10px'}}><input type="number" placeholder="Speed" value={formData.speed} onChange={e => setFormData({...formData, speed: e.target.value})} style={styles.input} /><input type="number" placeholder="Stamina" value={formData.stamina} onChange={e => setFormData({...formData, stamina: e.target.value})} style={styles.input} /></div></>)}
                {addType === 'TRAINING' && (<><div style={styles.field}><label>เพิ่มค่าพลัง:</label><select value={formData.statType} onChange={e => setFormData({...formData, statType: e.target.value})} style={styles.input}><option value="SPEED">SPEED</option><option value="STAMINA">STAMINA</option><option value="POWER">POWER</option></select></div><div style={styles.field}><label>จำนวน (Value):</label><input type="number" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} style={styles.input} /></div></>)}
                {addType === 'ACTION' && (<><div style={styles.field}><label>คำอธิบาย:</label><input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={styles.input} placeholder="เช่น เร่งความเร็วเมื่อ..." /></div><div style={styles.field}><label>เงื่อนไข:</label><select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} style={styles.input}><option value="ANY">ANY</option><option value="START">START</option><option value="CURVE">CURVE</option><option value="STRAIGHT">STRAIGHT</option><option value="SLOPE">SLOPE</option><option value="LAST_SPURT">LAST_SPURT</option></select></div><div style={{display:'flex', gap:'10px'}}><select value={formData.effectType} onChange={e => setFormData({...formData, effectType: e.target.value})} style={styles.input}><option value="SPEED_BOOST">Speed Boost</option><option value="STAMINA_HEAL">Heal</option></select><input type="number" placeholder="Value" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} style={styles.input} /></div></>)}
                
                {/* 🏟️ ฟอร์มเพิ่มสนามแบบ Manual Detail */}
                {addType === 'TRACK' && (<>
                    <div style={styles.field}><label>ระยะทางรวม (เมตร):</label><input type="number" value={formData.distance} onChange={e => setFormData({...formData, distance: e.target.value})} style={styles.input} /></div>
                    <div style={styles.field}><label>คำอธิบายสนาม:</label><input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={styles.input} /></div>
                    
                    <div style={{backgroundColor:'#f5f5f5', padding:'10px', borderRadius:'5px', marginTop:'10px'}}>
                        <label style={{fontWeight:'bold'}}>📍 กำหนดจุดสำคัญ (Segments):</label>
                        <div style={{display:'flex', alignItems:'center', gap:'10px', marginTop:'5px'}}>
                            <span>จำนวนจุด:</span>
                            <input type="number" min="1" max="20" value={segmentCount} onChange={e => handleSegmentCountChange(e.target.value)} style={{width:'60px', padding:'5px'}} />
                        </div>
                        
                        {/* Loop สร้าง Input Bar ตามจำนวนที่กรอก */}
                        <div style={{marginTop:'10px', display:'flex', flexDirection:'column', gap:'5px'}}>
                            {trackSegments.map((seg, idx) => (
                                <div key={idx} style={{display:'flex', gap:'10px', alignItems:'center'}}>
                                    <span style={{width:'20px', fontSize:'0.8rem', color:'#666'}}>{idx+1}.</span>
                                    <select value={seg.type} onChange={e => handleSegmentChange(idx, 'type', e.target.value)} style={{padding:'5px', borderRadius:'5px', border:'1px solid #ccc'}}>
                                        <option value="STRAIGHT">ทางตรง (Straight)</option>
                                        <option value="CURVE">ทางโค้ง (Curve)</option>
                                        <option value="SLOPE">ทางลาด/เนิน (Slope)</option>
                                    </select>
                                    <input 
                                        type="number" 
                                        placeholder="ระยะ (m)" 
                                        value={seg.distance} 
                                        onChange={e => handleSegmentChange(idx, 'distance', e.target.value)} 
                                        style={{padding:'5px', width:'100px', borderRadius:'5px', border:'1px solid #ccc'}}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </>)}

                <button type="submit" style={styles.submitBtn}>💾 บันทึกเข้า DB</button>
            </form>
        </div>
      )}

      {tab === 'MANAGE' && (
        <div style={{marginTop: '20px'}}>
            <h3>🐎 ม้าแข่ง ({allData.horses.length})</h3>{renderCardList(allData.horses, 'HORSE')}
            <h3 style={{marginTop:'30px'}}>🏋️ การ์ดฝึกซ้อม ({allData.trainings.length})</h3>{renderCardList(allData.trainings, 'TRAINING')}
            <h3 style={{marginTop:'30px'}}>⚡ Action Cards ({allData.actions.length})</h3>{renderCardList(allData.actions, 'ACTION')}
            <h3 style={{marginTop:'30px'}}>🏟️ สนามแข่ง ({allData.tracks.length})</h3>{renderCardList(allData.tracks, 'TRACK')}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' },
  tabs: { display: 'flex', marginBottom: '20px' },
  tab: { flex: 1, padding: '10px', cursor: 'pointer', border: 'none', backgroundColor: '#e0e0e0', fontSize:'1rem' },
  activeTab: { flex: 1, padding: '10px', cursor: 'pointer', border: 'none', backgroundColor: '#3f51b5', color: 'white', fontWeight: 'bold', fontSize:'1rem' },
  box: { backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
  field: { marginBottom: '15px' },
  input: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', marginTop:'5px', boxSizing:'border-box' },
  submitBtn: { width: '100%', padding: '15px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop:'15px', fontSize:'1.1rem', fontWeight:'bold' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '15px' },
  card: { display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', border: '1px solid #eee' },
  editBtn: { backgroundColor: '#ff9800', border:'none', cursor:'pointer', padding:'8px', borderRadius:'5px', marginRight:'5px', fontSize:'1rem' },
  deleteBtn: { backgroundColor: '#e91e63', border:'none', cursor:'pointer', padding:'8px', borderRadius:'5px', color:'white', fontSize:'1rem' },
  miniInput: { width: '100%', padding: '5px', border: '1px solid #ddd', borderRadius:'4px' },
  saveBtn: { backgroundColor: '#4caf50', color:'white', border:'none', padding:'5px 10px', borderRadius:'3px', marginRight:'5px', cursor:'pointer', fontSize:'0.9rem' },
  cancelBtn: { backgroundColor: '#999', color:'white', border:'none', padding:'5px 10px', borderRadius:'3px', cursor:'pointer', fontSize:'0.9rem' }
};

export default Admin;