import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
    const token = localStorage.getItem('token');
    // เช็คว่า isAdmin เป็น "true" หรือไม่
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    // 1. ถ้าไม่มี Token -> ดีดไป Login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // 2. ถ้ามี Token แต่ไม่ใช่ Admin -> ดีดไป Home
    if (!isAdmin) {
        return <Navigate to="/home" replace />;
    }

    // 3. ผ่านหมด -> อนุญาตให้เข้า
    return <Outlet />;
};

export default AdminRoute;