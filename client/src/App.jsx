import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import หน้าจอต่างๆ
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Gacha from './pages/Gacha';
import Inventory from './pages/Inventory';
import Battle from './pages/Battle';
import Admin from './pages/Admin';

function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: '20px', fontFamily: 'Arial' }}>
        <Routes>
          {/* Redirect หน้าแรกไป Login */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/home" element={<Home />} />
          <Route path="/gacha" element={<Gacha />} />
          <Route path="/inventory" element={<Inventory />} />
          
          {/* ✅ ต้องมีบรรทัดนี้ครับ ถึงจะเข้าหน้า Battle ได้ */}
          <Route path="/battle" element={<Battle />} />
          
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;