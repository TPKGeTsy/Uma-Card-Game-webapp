const mongoose = require('mongoose');

// 👇 ก๊อป URL จากบรรทัด mongoose.connect ในไฟล์ seed.js มาใส่ตรงนี้
const uri = 'mongodb://127.0.0.1:27017/uma-card-game'; 

console.log("กำลังทดสอบการเชื่อมต่อ... ⏳");

mongoose.connect(uri)
    .then(() => {
        console.log("\n✅ เชื่อมต่อ MongoDB สำเร็จ!");
        console.log("------------------------------------------------");
        console.log(`📂 Database Name :  ${mongoose.connection.name}`);
        console.log(`🏠 Host          :  ${mongoose.connection.host}`);
        console.log(`🔌 Port          :  ${mongoose.connection.port}`);
        console.log("------------------------------------------------");
        process.exit(0);
    })
    .catch((err) => {
        console.error("\n❌ เชื่อมต่อล้มเหลว:", err.message);
        process.exit(1);
    });