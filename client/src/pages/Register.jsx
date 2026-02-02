import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register', formData);
      alert('Success! Please Login');
      navigate('/login');
    } catch (error) { alert('Failed'); }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2 style={styles.title}>CREATE ACCOUNT</h2>
        <p style={styles.subtitle}>Join the ultimate horse racing battle</p>
        <form onSubmit={handleSubmit}>
          <input type="text" name="username" placeholder="Username" onChange={(e)=>setFormData({...formData, username:e.target.value})} style={styles.input} required />
          <input type="password" name="password" placeholder="Password" onChange={(e)=>setFormData({...formData, password:e.target.value})} style={styles.input} required />
          <button type="submit" style={styles.button}>SIGN UP</button>
        </form>
        <p style={{marginTop:'20px', color:'#aaa', fontSize:'0.9rem'}}>
          Already have an account? <Link to="/login" style={{color:'#e91e63', fontWeight:'bold', textDecoration:'none'}}>Log In</Link>
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
  button: { width:'100%', padding:'15px', background:'linear-gradient(45deg, #00e676, #00bfa5)', color:'white', border:'none', borderRadius:'50px', cursor:'pointer', fontSize:'1rem', fontWeight:'bold', marginTop:'10px', transition:'0.2s' }
};

export default Register;