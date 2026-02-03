const User = require('../models/User');

const checkAdmin = async (req, res, next) => {
    try {
        // req.user.userId มาจาก auth middleware (JWT)
        const user = await User.findById(req.user.userId);
        
        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: "⛔ Access Denied: Admin only!" });
        }
        
        // ถ้าเป็น Admin จริง ให้ผ่านไป
        next();
    } catch (err) {
        res.status(500).json({ message: "Server Error checking admin role" });
    }
};

module.exports = checkAdmin;