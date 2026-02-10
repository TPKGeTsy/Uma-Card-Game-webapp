import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminRoute from "./components/AdminRoute";
// Import หน้าจอต่างๆ
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Gacha from './pages/Gacha';
import Inventory from './pages/Inventory';
import Battle from './pages/Battle';
import Admin from './pages/Admin';
import Wiki from './pages/Wiki';
import WikiDetail from './pages/WikiDetail';

// Import ตัวเช็คสิทธิ์ (Guard)


function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: '0', fontFamily: 'Arial' }}> {/* ลบ padding ออกเพื่อให้ Full Screen สวยๆ */}
        <Routes>
          {/* Redirect หน้าแรกไป Login */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/wiki" element={<Wiki />} />
          <Route path="/wiki/:id" element={<WikiDetail />} />
          {/* โซน User ทั่วไป */}
          <Route path="/home" element={<Home />} />
          <Route path="/gacha" element={<Gacha />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/battle" element={<Battle />} />
          
          {/* 🔒 โซน Admin (ต้องผ่าน AdminRoute ก่อนถึงจะเจอ) */}
          <Route element={<AdminRoute />}>
              <Route path="/admin" element={<Admin />} />
          </Route>

        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;