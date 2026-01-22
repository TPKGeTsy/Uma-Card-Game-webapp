import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      // 1. ดึง Token จาก LocalStorage
      const token = localStorage.getItem('token');

      // ถ้าไม่มี Token ดีดกลับหน้า Login ทันที
      if (!token) {
        navigate('/login'); 
        return;
      }

      try {
        // 2. ยิง API พร้อมแนบ Token ไปใน Header
        const res = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: {
            // สำคัญมาก! ต้องมีช่องว่างหลัง Bearer 
            Authorization: `Bearer ${token}` 
          }
        });

        // 3. ถ้าผ่าน เอาข้อมูลมาโชว์
        setUser(res.data);

      } catch (err) {
        console.error("Home Error:", err);
        // ถ้า Token หมดอายุ หรือ Server ปฏิเสธ -> ลบ Token เก่าทิ้ง แล้วให้ Login ใหม่
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        alert("Session หมดอายุ กรุณา Login ใหม่ครับ");
        navigate('/login');
      }
    };

    fetchProfile();
  }, [navigate]);

  // ถ้ายังโหลดไม่เสร็จ
  if (!user) return <div style={{textAlign:'center', marginTop:'50px'}}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>ยินดีต้อนรับ, {user.username}! 👋</h1>
        <p>💰 Coins: <strong>{user.coins}</strong></p>
        
        <div style={styles.menuGrid}>
            <button onClick={() => navigate('/gacha')} style={styles.menuBtn}>🎰 Gacha</button>
            <button onClick={() => navigate('/inventory')} style={styles.menuBtn}>🎒 Inventory</button>
            <button onClick={() => navigate('/battle')} style={styles.menuBtn}>⚔️ Battle</button>
        </div>

        <button 
            onClick={() => {
                localStorage.clear();
                navigate('/login');
            }} 
            style={styles.logoutBtn}
        >
            Logout
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', display: 'flex', justifyContent: 'center', fontFamily: 'Arial' },
  card: { width: '400px', padding: '30px', border: '1px solid #ddd', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', textAlign: 'center' },
  menuGrid: { display: 'grid', gap: '10px', margin: '20px 0' },
  menuBtn: { padding: '15px', fontSize: '1.2rem', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' },
  logoutBtn: { marginTop: '20px', padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default Home;