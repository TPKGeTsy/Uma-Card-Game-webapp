const jwt = require('jsonwebtoken');

// 🔥 ต้องตรงกับใน routes/auth.js เป๊ะๆ
const JWT_SECRET = 'mysecretkey123'; 

const authenticateUser = (req, res, next) => {
    // 1. ดึง Token จาก Header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    // ตัดคำว่า "Bearer " ออก
    const token = authHeader.replace('Bearer ', '');

    try {
        // 2. ตรวจสอบ Token (ด้วยกุญแจดอกเดียวกัน)
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 3. ถ้าผ่าน ให้ยัด userId ใส่ req ไว้ใช้ต่อ
        req.user = decoded; 
        next();
    } catch (err) {
        console.error("Auth Error:", err.message);
        res.status(401).json({ message: "Token is not valid" });
    }
};

module.exports = authenticateUser;