import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // <--- ถ้าลบไฟล์นี้ไปแล้ว ให้ลบบรรทัดนี้ทิ้งด้วยนะครับ ไม่งั้น Error

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)