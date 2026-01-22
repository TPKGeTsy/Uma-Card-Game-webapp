import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // ยิงไปที่ Route สมัครสมาชิก
      await axios.post('http://localhost:5000/api/auth/register', formData);
      
      alert('สมัครสมาชิกสำเร็จ! กรุณา Login เพื่อเข้าเล่น');
      navigate('/login'); // สมัครเสร็จ เด้งไปหน้า Login

    } catch (error) {
      console.error(error);
      alert('สมัครไม่ผ่าน: ' + (error.response?.data?.message || 'Server Error'));
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={{color: '#2196f3'}}>📝 สมัครสมาชิกใหม่</h1>
        
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label>Username</label>
            <input type="text" name="username" onChange={handleChange} style={styles.input} required />
          </div>
          
          <div style={styles.inputGroup}>
            <label>Password</label>
            <input type="password" name="password" onChange={handleChange} style={styles.input} required />
          </div>

          <button type="submit" style={styles.button}>ยืนยันการสมัคร</button>
        </form>

        <p style={{marginTop: '15px'}}>
          มีไอดีแล้ว? <Link to="/login" style={{color: '#ff4081'}}>กลับไป Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' },
  card: { padding: '30px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', backgroundColor: 'white', width: '300px', textAlign: 'center' },
  inputGroup: { marginBottom: '15px', textAlign: 'left' },
  input: { width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' },
  button: { width: '100%', padding: '10px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }
};

export default Register;