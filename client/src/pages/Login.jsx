import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
      
      // 1. เก็บข้อมูลลงเครื่อง
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      
      // ✅ 2. เก็บสถานะ Admin (แปลง boolean เป็น string)
      localStorage.setItem('isAdmin', res.data.isAdmin ? 'true' : 'false');

      alert("Login สำเร็จ! ยินดีต้อนรับ " + res.data.username);

      // ✅ 3. เช็คว่าเป็น Admin ไหม?
      if (res.data.isAdmin) {
          navigate('/admin'); // ถ้าใช่ ไปหลังบ้าน
      } else {
          navigate('/home');  // ถ้าไม่ใช่ ไปหน้าเกม
      }

    } catch (err) { 
      alert("Login Failed: " + (err.response?.data?.message || err.message)); 
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2 style={styles.title}>WELCOME BACK</h2>
        <p style={styles.subtitle}>Log in to continue your race</p>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Username" value={username} onChange={(e)=>setUsername(e.target.value)} style={styles.input} required />
          <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} style={styles.input} required />
          <button type="submit" style={styles.button}>LOG IN</button>
        </form>
        <p style={{marginTop:'20px', color:'#aaa', fontSize:'0.9rem'}}>
          New Racer? <Link to="/register" style={{color:'#e91e63', fontWeight:'bold', textDecoration:'none'}}>Create Account</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#111', fontFamily:"'Inter', sans-serif", color:'white' },
  box: { padding:'50px', background:'#1e1e1e', borderRadius:'20px', border:'1px solid #333', width:'350px', textAlign:'center', boxShadow:'0 10px 40px rgba(0,0,0,0.5)' },
  title: { fontSize:'2rem', fontWeight:'900', margin:'0 0 10px', letterSpacing:'1px' },
  subtitle: { color:'#aaa', marginBottom:'30px', fontSize:'0.9rem' },
  input: { width:'100%', padding:'15px', marginBottom:'15px', background:'#2a2a2a', border:'1px solid #444', borderRadius:'10px', color:'white', boxSizing:'border-box', outline:'none', fontSize:'1rem' },
  button: { width:'100%', padding:'15px', background:'linear-gradient(45deg, #e91e63, #ff4081)', color:'white', border:'none', borderRadius:'50px', cursor:'pointer', fontSize:'1rem', fontWeight:'bold', marginTop:'10px', transition:'0.2s' }
};

export default Login;