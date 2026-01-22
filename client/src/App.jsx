import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import หน้าจอที่เราเพิ่งสร้าง
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Gacha from './pages/Gacha';
import Inventory from './pages/Inventory';
import Battle from './pages/Battle';
import Admin from './pages/Admin';

<Routes>
   {/* ... route อื่นๆ ... */}
   <Route path="/admin" element={<Admin />} /> 
</Routes>


function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: '20px', fontFamily: 'Arial' }}>
        {/* Routes คือตัวกำหนดว่า URL ไหน จะโชว์หน้าอะไร */}
        <Routes>
          {/* ถ้าเข้ามาหน้าแรก (/) ให้เด้งไป Login ก่อน */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* หน้าที่ต้อง Login แล้วถึงเข้าได้ (เดี๋ยวเรามาทำระบบป้องกันทีหลัง) */}
          <Route path="/home" element={<Home />} />
          <Route path="/gacha" element={<Gacha />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/battle" element={<Battle />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;