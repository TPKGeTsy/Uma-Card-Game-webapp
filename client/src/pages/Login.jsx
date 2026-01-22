import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom'; // 1. ต้อง import useNavigate

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // 2. ประกาศตัวแปร navigate

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // ยิงไปที่ Backend
      const res = await axios.post('http://localhost:5000/api/auth/login', { 
        username, 
        password 
      });

      // ถ้ามาถึงตรงนี้แปลว่า Login สำเร็จ (200 OK)
      alert("Login สำเร็จ! ยินดีต้อนรับครับ " + res.data.username);

      // 3. สำคัญมาก: เก็บ Token ลงเครื่อง (เพื่อเอาไปใช้ในหน้า Battle)
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);

      // 4. สั่งเปลี่ยนหน้าไปที่ /home (หรือ /battle)
      navigate('/home'); 

    } catch (err) {
      console.error(err);
      alert("Login ไม่ผ่าน: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2 style={{textAlign: 'center', color: '#333'}}>เข้าสู่ระบบ Game Master</h2>
        <form onSubmit={handleLogin}>
          <div style={styles.inputGroup}>
            <label>Username:</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              style={styles.input}
              required 
            />
          </div>
          <div style={styles.inputGroup}>
            <label>Password:</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={styles.input}
              required 
            />
          </div>
          <button type="submit" style={styles.button}>Login 🚀</button>
        </form>
        <p style={{marginTop: '15px', textAlign: 'center'}}>
          ยังไม่มีไอดี? <Link to="/register">สมัครสมาชิกที่นี่</Link>
        </p>
      </div>
    </div>
  );
}

// Styles ง่ายๆ
const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Arial' },
  box: { padding: '40px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', width: '350px' },
  inputGroup: { marginBottom: '15px' },
  input: { width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' },
  button: { width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1rem', marginTop: '10px' }
};

export default Login;