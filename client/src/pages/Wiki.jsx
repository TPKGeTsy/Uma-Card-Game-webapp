import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function Wiki() {
    const [horses, setHorses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHorses = async () => {
            try {
                // ไม่ต้องใช้ Token ก็ได้ เพราะเป็นข้อมูลสาธารณะ
                const res = await axios.get('http://localhost:5000/api/user/wiki-cards');
                setHorses(res.data);
            } catch (err) {
                console.error("Failed to load wiki data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHorses();
    }, []);

    if (loading) return <div style={{textAlign:'center', padding:'50px', color:'white'}}>⏳ Loading Wiki...</div>;

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <Link to="/home" style={styles.backBtn}>⬅ Back Home</Link>
                <h1 style={styles.title}>📘 UMA MUSUME WIKI</h1>
                <p style={{color:'#aaa', marginTop:'-10px'}}>ฐานข้อมูลสาวม้าแห่ง Tracen Academy</p>
            </div>

            {/* Grid Display */}
            <div style={styles.grid}>
                {horses.map((horse) => (
                    <div 
                        key={horse._id} 
                        style={{...styles.card, borderColor: horse.wikiProfile?.themeColor || '#444'}}
                        onClick={() => navigate(`/wiki/${horse._id}`)} // 👉 คลิกแล้วไปหน้า Detail
                    >
                        {/* Image Wrapper */}
                        <div style={styles.imgWrapper}>
                            <img 
                                src={horse.image} 
                                alt={horse.name} 
                                style={styles.img}
                                onError={(e) => e.target.src = 'https://placehold.co/300x400?text=No+Image'} 
                            />
                            {/* Rarity Badge */}
                            <div style={{...styles.badge, background: getRarityColor(horse.rarity)}}>
                                {horse.rarity}
                            </div>
                        </div>

                        {/* Name */}
                        <div style={styles.nameBox}>
                            {horse.name}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Helper สีตามระดับความหายาก
const getRarityColor = (rarity) => {
    if (rarity === 'SSR') return 'linear-gradient(45deg, #FFD700, #FFA500)';
    if (rarity === 'SR') return 'linear-gradient(45deg, #C0C0C0, #E0E0E0)';
    return 'linear-gradient(45deg, #cd7f32, #a0522d)';
};

// Styles
const styles = {
    container: {
        minHeight: '100vh',
        background: '#111',
        padding: '40px 20px',
        fontFamily: "'Inter', sans-serif",
        color: 'white'
    },
    header: {
        textAlign: 'center',
        marginBottom: '40px'
    },
    title: {
        fontSize: '3rem',
        fontWeight: '900',
        background: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '15px'
    },
    backBtn: {
        textDecoration: 'none',
        color: '#aaa',
        fontSize: '0.9rem',
        border: '1px solid #444',
        padding: '5px 15px',
        borderRadius: '20px',
        transition: '0.3s',
        display: 'inline-block',
        marginBottom: '20px'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', // Responsive Grid
        gap: '25px',
        maxWidth: '1000px',
        margin: '0 auto'
    },
    card: {
        background: '#1e1e1e',
        borderRadius: '15px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: '2px solid #333',
        transition: 'transform 0.2s, box-shadow 0.2s',
        ':hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 10px 20px rgba(0,0,0,0.5)'
        }
    },
    imgWrapper: {
        position: 'relative',
        width: '100%',
        paddingTop: '120%', // Aspect Ratio 4:5 แนวตั้งสวยๆ
        background: '#000'
    },
    img: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    badge: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        padding: '2px 8px',
        borderRadius: '5px',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        color: 'black',
        boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
    },
    nameBox: {
        padding: '15px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '1rem',
        borderTop: '1px solid #333',
        background: 'linear-gradient(to bottom, #252525, #1e1e1e)'
    }
};

export default Wiki;