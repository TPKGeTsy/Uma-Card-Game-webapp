import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function WikiDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [horse, setHorse] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/user/wiki-cards/${id}`);
                setHorse(res.data);
            } catch (err) {
                console.error(err);
                navigate('/wiki'); // ถ้าหาไม่เจอ ดีดกลับหน้ารวม
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    if (loading) return <div style={{textAlign:'center', padding:'50px', color:'white'}}>⏳ Loading Profile...</div>;
    if (!horse) return null;

    // 🎨 ดึง Theme Color (ถ้าไม่มีใช้สี Default)
    const THEME = horse.wikiProfile?.themeColor || '#e91e63'; // สีหลัก
    const SUB_THEME = horse.wikiProfile?.subColor || '#f3e5f5'; // สีรอง
    const PROFILE = horse.wikiProfile || {}; // กัน Error

    return (
        <div style={{...styles.pageWrapper, fontFamily: "'Inter', sans-serif"}}>
            
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.container}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <h1 style={{fontSize:'1.5rem', margin:0, color:'#1a237e', fontWeight:'900', letterSpacing:'-1px'}}>
                            THE LEGEND <span style={{color: THEME}}>{horse.name.toUpperCase()}</span>
                        </h1>
                        <div style={styles.nav}>
                            <Link to="/wiki" style={{textDecoration:'none', color:'#666', fontWeight:'bold'}}>⬅ Back to Wiki</Link>
                        </div>
                    </div>
                </div>
            </header>

            <div style={{...styles.container, padding:'40px 20px', display:'flex', flexDirection:'column', gap:'30px', mdFlexDirection:'row'}}>
                
                {/* 🟢 MAIN CONTENT */}
                <main style={{flex: 2, display:'flex', flexDirection:'column', gap:'40px'}}>

                    {/* 1. Hero Section */}
                    <section style={{...styles.card, borderTop: `8px solid ${THEME}`}}>
                        <div style={{display:'flex', gap:'30px', flexWrap:'wrap', alignItems:'center'}}>
                            <div style={{...styles.imgFrame, background: `linear-gradient(135deg, ${THEME}, #333)`}}>
                                <img src={horse.image} style={styles.heroImg} onError={(e)=>e.target.src='https://placehold.co/300'}/>
                                <div style={styles.caption}>{PROFILE.alias || "Uma Musume"}</div>
                            </div>
                            <div style={{flex:1}}>
                                <h2 style={{fontSize:'2.5rem', margin:'0 0 10px 0', color:'#1a237e', fontWeight:'900'}}>สวัสดี! ข้าคือ...</h2>
                                <div style={{fontSize:'2rem', color: THEME, fontWeight:'900', fontStyle:'italic', marginBottom:'15px'}}>
                                    {horse.name}
                                </div>
                                <p style={{color:'#555', fontSize:'1.1rem', lineHeight:'1.6'}}>
                                    "{PROFILE.introQuote || horse.description}"
                                </p>
                                <div style={{marginTop:'20px', padding:'15px', background: SUB_THEME, borderRadius:'10px', borderLeft:`4px solid ${THEME}`}}>
                                    <p style={{margin:0, color:'#333', fontSize:'0.95rem'}}>{PROFILE.fullStory || "ยังไม่มีข้อมูลประวัติ..."}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2. Profile Info */}
                    <section style={{...styles.card, background: '#f8f9fa', border:`1px solid ${THEME}30`}}>
                        <h2 style={{...styles.sectionTitle, color:'#1a237e', borderLeft:`6px solid ${THEME}`}}>ประวัติการต่อสู้ (Profile)</h2>
                        <div style={styles.grid2}>
                            <InfoBox title="วันเกิด" value={PROFILE.birthDate} />
                            <InfoBox title="บ้านเกิด" value={PROFILE.origin} />
                            <InfoBox title="ฉายา" value={PROFILE.alias} />
                            <InfoBox title="นักพากย์" value={PROFILE.voiceActor} />
                        </div>
                    </section>

                    {/* 3. Race Statistics */}
                    <section style={styles.card}>
                        <h2 style={{...styles.sectionTitle, color:'#1a237e'}}>บันทึกชัยชนะ (Race History)</h2>
                        <div style={{overflowX:'auto'}}>
                            <table style={styles.table}>
                                <thead style={{background:'#1a237e', color:'white'}}>
                                    <tr>
                                        <th style={styles.th}>รายการแข่งขัน</th>
                                        <th style={styles.th}>เกรด</th>
                                        <th style={styles.th}>ผลการแข่ง</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {PROFILE.raceHistory?.map((race, i) => (
                                        <tr key={i} style={{borderBottom:'1px solid #eee', background: i%2===0?'white':'#f9f9f9'}}>
                                            <td style={{...styles.td, fontWeight:'bold'}}>{race.name}</td>
                                            <td style={styles.td}>{race.grade}</td>
                                            <td style={{...styles.td, color: THEME, fontWeight:'bold'}}>{race.result}</td>
                                        </tr>
                                    ))}
                                    {(!PROFILE.raceHistory || PROFILE.raceHistory.length === 0) && (
                                        <tr><td colSpan="3" style={{padding:'20px', textAlign:'center', color:'#999'}}>ยังไม่มีข้อมูลการแข่ง</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                </main>

                {/* 🟠 SIDEBAR */}
                <aside style={{flex: 1, minWidth:'300px', display:'flex', flexDirection:'column', gap:'25px'}}>
                    
                    {/* Game Stats */}
                    <section style={{...styles.card, background: `linear-gradient(to bottom, ${THEME}, #222)`, color:'white'}}>
                        <h3 style={{margin:'0 0 20px 0', textTransform:'uppercase', letterSpacing:'1px', borderBottom:'1px solid rgba(255,255,255,0.2)', paddingBottom:'10px'}}>
                            GAME STATS
                        </h3>
                        <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                            <StatBar label="SPEED" val={horse.stats.speed} />
                            <StatBar label="STAMINA" val={horse.stats.stamina} />
                            <StatBar label="POWER" val={horse.stats.power} />
                            <StatBar label="GUTS" val={horse.stats.guts} />
                            <StatBar label="WISDOM" val={horse.stats.wisdom} />
                        </div>
                    </section>

                    {/* Goals */}
                    <section style={styles.card}>
                        <h3 style={{margin:'0 0 15px 0', color:'#1a237e', borderBottom:'2px solid #eee', paddingBottom:'10px'}}>เป้าหมายสูงสุด 🏆</h3>
                        <ul style={{listStyle:'none', padding:0, margin:0}}>
                            {PROFILE.goals?.map((g, i) => (
                                <li key={i} style={{marginBottom:'10px', display:'flex', gap:'10px', fontSize:'0.9rem', color:'#555'}}>
                                    <span style={{color:THEME}}>✦</span> {g}
                                </li>
                            ))}
                            {(!PROFILE.goals || PROFILE.goals.length === 0) && <li style={{color:'#aaa'}}>- ไม่มีเป้าหมายระบุ -</li>}
                        </ul>
                    </section>

                    {/* Tips */}
                    <section style={styles.card}>
                        <h3 style={{margin:'0 0 10px 0', color:'#1a237e'}}>💡 Trainer's Note</h3>
                        <p style={{fontSize:'0.85rem', color:'#666', lineHeight:'1.5'}}>
                            {horse.name} เป็นม้าที่มีจุดเด่นด้าน {horse.stats.stamina > 800 ? 'ความอึด (Stamina)' : 'ความเร็ว (Speed)'} 
                            ควรเน้นการ์ดที่ส่งเสริม {horse.stats.wisdom > 600 ? 'กลยุทธ์ (Wisdom)' : 'พลัง (Power)'} เพื่อดึงศักยภาพสูงสุดออกมา!
                        </p>
                    </section>

                </aside>
            </div>

            <footer style={styles.footer}>
                © 2026 Uma Card Battle Wiki - Data provided by Tracen Academy
            </footer>
        </div>
    );
}

// --- Sub Components ---
const InfoBox = ({title, value}) => (
    <div style={{background:'white', padding:'15px', borderRadius:'10px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
        <div style={{color:'#1a237e', fontWeight:'bold', fontSize:'0.9rem', marginBottom:'3px'}}>{title}</div>
        <div style={{color:'#555', fontSize:'0.9rem'}}>{value || "-"}</div>
    </div>
);

const StatBar = ({label, val}) => (
    <div>
        <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', marginBottom:'3px', fontWeight:'bold'}}>
            <span>{label}</span>
            <span>{val}</span>
        </div>
        <div style={{width:'100%', background:'rgba(255,255,255,0.2)', height:'6px', borderRadius:'3px'}}>
            <div style={{width:`${Math.min((val/1200)*100, 100)}%`, background:'white', height:'100%', borderRadius:'3px', boxShadow:'0 0 5px rgba(255,255,255,0.5)'}}></div>
        </div>
    </div>
);

// --- Styles (Adapted from Tailwind classes) ---
const styles = {
    pageWrapper: { background: '#f1f5f9', minHeight: '100vh', color: '#333' },
    header: { background: 'white', padding: '15px 0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', position:'sticky', top:0, zIndex:50 },
    container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
    card: { background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: '1px solid white' },
    sectionTitle: { fontSize:'1.5rem', fontWeight:'900', paddingLeft:'15px', marginBottom:'20px' },
    
    // Hero
    imgFrame: { padding: '5px', borderRadius: '15px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', transform: 'rotate(-2deg)', flexShrink:0 },
    heroImg: { width: '220px', height: 'auto', borderRadius: '10px', display:'block' },
    caption: { textAlign:'center', color:'white', fontSize:'0.7rem', fontWeight:'900', marginTop:'8px', textTransform:'uppercase', letterSpacing:'1px' },
    
    // Grid
    grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' },
    
    // Table
    table: { width: '100%', borderCollapse: 'collapse', borderRadius: '10px', overflow: 'hidden' },
    th: { padding: '15px', textAlign: 'left', fontSize:'0.9rem' },
    td: { padding: '15px', fontSize:'0.9rem', color:'#444' },
    
    footer: { background:'white', padding:'30px', textAlign:'center', color:'#999', fontSize:'0.8rem', borderTop:'1px solid #eee', marginTop:'50px' }
};

export default WikiDetail;