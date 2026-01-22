const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        // 1. ดึง Header ที่ชื่อ Authorization ออกมา
        const authHeader = req.headers.authorization;

        // ถ้าไม่มี Header ส่งมาเลย -> ไล่กลับ
        if (!authHeader) {
            return res.status(401).json({ message: "Access Denied: ไม่พบ Token!" });
        }

        // 2. ตัดคำว่า "Bearer " ออก เพื่อเอาตัว Token เพียวๆ
        // รูปแบบที่ส่งมาคือ: "Bearer eyJhbGciOi..."
        const token = authHeader.split(' ')[1]; 

        if (!token) {
            return res.status(401).json({ message: "Access Denied: Token ผิดรูปแบบ!" });
        }

        // 3. 🗝️ ตรวจสอบด้วยกุญแจ 'secret' (ต้องตรงกับ authController.js เป๊ะๆ!)
        // ⚠️ ของเดิมคุณเป็น 'MySuperSecretKey' ซึ่งมันผิดครับ
        const verified = jwt.verify(token, 'secret'); 

        // 4. แปะข้อมูล User ลงไปใน Request
        req.user = verified;
        
        next(); // ผ่าน!

    } catch (err) {
        // ถ้ากุญแจผิด หรือ Token หมดอายุ จะเด้งเข้าตรงนี้
        console.log("Middleware Error:", err.message);
        res.status(400).json({ message: "Invalid Token: Token ใช้ไม่ได้ครับ" });
    }
};