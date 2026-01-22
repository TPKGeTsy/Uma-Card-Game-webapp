const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const userRoutes = require('./routes/user');
const battleRoutes = require('./routes/battle');
const adminRoutes = require('./routes/admin');

// --- 1. เรียกไฟล์ Route ---
const cardRoutes = require('./routes/card');
const authRoutes = require('./routes/auth');
const gachaRoutes = require('./routes/gacha'); // <--- [เพิ่มบรรทัดนี้]
const gameRoutes = require('./routes/game');





const app = express();
const port = 5000;

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/uma-card-game');
        console.log('✅ MongoDB Connected...');
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
    }
};
connectDB();

// --- 2. ใช้งาน Route ---
app.use('/api', cardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/gacha', gachaRoutes);
app.use('/api/user', userRoutes);
app.use('/api/battle', battleRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);




app.get('/', (req, res) => {
    res.send('<h1>Server & Database Ready! 🚀</h1>');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});