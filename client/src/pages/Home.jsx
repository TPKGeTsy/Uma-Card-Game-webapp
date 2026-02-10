import React, { useState, useEffect } from 'react'; // ✅ เพิ่ม hooks
import { useNavigate } from 'react-router-dom';

function Home() {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');

    // ✅ 1. เช็คสถานะตอนโหลดหน้าเว็บ
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('username');
        
        if (token) {
            setIsLoggedIn(true);
            setUsername(storedUser || 'Racer');
        } else {
            setIsLoggedIn(false);
        }
    }, []);

    // ✅ 2. ฟังก์ชันออกจากระบบ
    const handleLogout = () => {
        // ลบขยะทิ้งให้หมด
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('isAdmin');
        
        // อัปเดต State และดีดกลับ
        setIsLoggedIn(false);
        setUsername('');
        alert("ออกจากระบบเรียบร้อย 👋");
        navigate('/login');
    };

    return (
        <div style={styles.container}>
            {/* Navbar */}
            <nav style={styles.navbar}>
                <div style={styles.logo}>🏇 UMA CARD BATTLE</div>
                <div style={styles.navLinks}>
                    <span style={styles.link} onClick={() => navigate('/wiki')}>Wiki</span>
                    <span style={styles.link}>Leaderboard</span>
                    
                    {/* ✅ 3. เงื่อนไขเปลี่ยนปุ่ม Login / Logout */}
                    {isLoggedIn ? (
                        <div style={{display:'flex', gap:'20px', alignItems:'center'}}>
                            <span style={{color:'#e91e63', fontWeight:'bold'}}>👤 {username}</span>
                            <span style={styles.logoutBtn} onClick={handleLogout}>Logout</span>
                        </div>
                    ) : (
                        <span style={styles.link} onClick={() => navigate('/login')}>Login</span>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <header style={styles.hero}>
                <div style={styles.heroContent}>
                    <h1 style={styles.heroTitle}>
                        JUMP INTO THE <span style={{color:'#e91e63'}}>NEXT LEVEL</span> <br/>
                        OF HORSE RACING STRATEGY
                    </h1>
                    <p style={styles.heroSubtitle}>
                        จัดทีมสาวม้าในฝัน วางแผนการ์ดกลยุทธ์ และคว้าชัยชนะในศึกความเร็ว<br/>
                        เกม Simulation Card Battle ฝีมือคนไทย!
                    </p>
                    <div style={styles.heroButtons}>
                        {/* ถ้ายังไม่ Login กด Start ให้เด้งไป Login ก่อน */}
                        <button onClick={() => navigate(isLoggedIn ? '/battle' : '/login')} style={styles.primaryBtn}>
                            START GAME 🚀
                        </button>
                        <button onClick={() => navigate(isLoggedIn ? '/inventory' : '/login')} style={styles.secondaryBtn}>
                            MY DECK 🎒
                        </button>
                        <button onClick={() => navigate(isLoggedIn ? '/gacha' : '/login')} style={styles.gachaBtn}>
                            SUMMON 🎰
                        </button>
                    </div>
                </div>
                
                {/* Hero Image */}
                <div style={styles.heroImageOverlay}>
                    <img src="https://placehold.co/600x400/transparent/white?text=Anime+Horse+Art" alt="Hero" style={styles.heroImg} />
                </div>
            </header>

            {/* Features */}
            <section style={styles.featuresSection}>
                <h2 style={styles.sectionTitle}>GAME FEATURES</h2>
                <div style={styles.grid}>
                    <FeatureCard icon="🃏" title="Deck Building" desc="จัดเด็คการ์ด Action, Heal และ Debuff เพื่อแก้ทางคู่แข่งในสนาม"/>
                    <FeatureCard icon="⚡" title="Real-time Lane" desc="ระบบเปลี่ยนเลนหลบหลีกสิ่งกีดขวางแบบ Real-time ตัดสินกันเสี้ยววินาที"/>
                    <FeatureCard icon="🏆" title="Roguelike Draft" desc="สุ่มเลือกการ์ดเสริมแกร่งในแต่ละรอบ ไม่มีความเก่งที่ตายตัว"/>
                </div>
            </section>

            {/* Footer */}
            <footer style={styles.footer}>
                © 2026 Uma Card Battle Project. All rights reserved.
            </footer>
        </div>
    );
}

const FeatureCard = ({ icon, title, desc }) => (
    <div style={styles.card}>
        <div style={styles.cardIcon}>{icon}</div>
        <h3 style={styles.cardTitle}>{title}</h3>
        <p style={styles.cardDesc}>{desc}</p>
    </div>
);

const styles = {
    container: { fontFamily: "'Inter', sans-serif", background: '#111', color: 'white', minHeight: '100vh', overflowX: 'hidden' },
    navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 50px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', position: 'fixed', width: '100%', top: 0, zIndex: 100, boxSizing: 'border-box' },
    logo: { fontSize: '1.5rem', fontWeight: 'bold', background: 'linear-gradient(45deg, #e91e63, #ff9800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    navLinks: { display: 'flex', gap: '30px', alignItems:'center' },
    link: { cursor: 'pointer', fontSize: '1rem', color: '#ccc', transition: 'color 0.3s', ':hover': { color: 'white' } },
    // ✅ สไตล์ปุ่ม Logout
    logoutBtn: { cursor: 'pointer', fontSize: '0.9rem', color: '#fff', border:'1px solid #e91e63', padding:'5px 15px', borderRadius:'20px', transition: '0.3s', ':hover': { background: '#e91e63' } },
    
    hero: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '150px 50px 100px 50px', background: 'radial-gradient(circle at top right, #2a1a1a, #111)', minHeight: '80vh' },
    heroContent: { flex: 1, maxWidth: '600px', zIndex: 2 },
    heroTitle: { fontSize: '3.5rem', lineHeight: '1.2', marginBottom: '20px', fontWeight: '800' },
    heroSubtitle: { fontSize: '1.1rem', color: '#aaa', marginBottom: '40px', lineHeight: '1.6' },
    heroButtons: { display: 'flex', gap: '15px' },
    primaryBtn: { padding: '15px 30px', fontSize: '1rem', fontWeight: 'bold', background: 'linear-gradient(45deg, #e91e63, #ff4081)', border: 'none', borderRadius: '50px', color: 'white', cursor: 'pointer', boxShadow: '0 10px 20px rgba(233, 30, 99, 0.4)' },
    secondaryBtn: { padding: '15px 30px', fontSize: '1rem', fontWeight: 'bold', background: 'transparent', border: '2px solid #555', borderRadius: '50px', color: 'white', cursor: 'pointer' },
    gachaBtn: { padding: '15px 30px', fontSize: '1rem', fontWeight: 'bold', background: 'linear-gradient(45deg, #ffeb3b, #fbc02d)', border: 'none', borderRadius: '50px', color: 'black', cursor: 'pointer', boxShadow: '0 10px 20px rgba(251, 192, 45, 0.4)' },
    heroImageOverlay: { flex: 1, display: 'flex', justifyContent: 'center' },
    heroImg: { width: '100%', maxWidth: '500px', borderRadius: '20px', boxShadow: '0 0 50px rgba(233,30,99,0.2)' },
    featuresSection: { padding: '80px 50px', background: '#1a1a1a', textAlign: 'center' },
    sectionTitle: { fontSize: '2rem', marginBottom: '50px', borderBottom: '3px solid #e91e63', display: 'inline-block', paddingBottom: '10px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', maxWidth: '1200px', margin: '0 auto' },
    card: { background: '#252525', padding: '40px 20px', borderRadius: '15px', border: '1px solid #333', cursor: 'default' },
    cardIcon: { fontSize: '3rem', marginBottom: '20px' },
    cardTitle: { fontSize: '1.5rem', marginBottom: '15px' },
    cardDesc: { color: '#aaa', lineHeight: '1.5' },
    footer: { padding: '30px', textAlign: 'center', color: '#555', fontSize: '0.9rem', borderTop: '1px solid #222' }
};

export default Home;