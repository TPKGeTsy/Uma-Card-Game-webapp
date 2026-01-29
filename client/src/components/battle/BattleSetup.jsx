import React, { useState } from 'react';

// รับของฝาก (Props) มา 3 อย่าง
function BattleSetup({ inventory, onConfirm, trackInfo }) {
    
    // 1. สร้างตะกร้าไว้ใส่ม้าที่เลือก (สูงสุด 3 ตัว)
    const [selectedHorses, setSelectedHorses] = useState([]);

    // 2. ฟังก์ชันเวลาจิ้มที่รูปม้า
    const handleSelect = (horse) => {
        // เช็คว่ามีม้านี้ในตะกร้าหรือยัง?
        const exists = selectedHorses.find(h => h._id === horse._id);

        if (exists) {
            // ถ้ามีแล้ว -> เอาออก
            setSelectedHorses(prev => prev.filter(h => h._id !== horse._id));
        } else {
            // ถ้ายังไม่มี -> เช็คว่าครบ 3 ตัวยัง? ถ้ายังก็ยัดใส่ตะกร้า
            if (selectedHorses.length < 3) {
                setSelectedHorses(prev => [...prev, horse]);
            }
        }
    };

    // 3. ส่วนแสดงผล (UI)
    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h2>🏁 Phase 1: จัดทีมลงสนาม</h2>
            
            {/* โชว์ข้อมูลสนาม */}
            <div style={{ marginBottom: '20px', color: 'blue' }}>
                สนามแข่ง: {trackInfo?.name || "Loading..."}
            </div>

            {/* โชว์ Slot ม้าที่เลือก */}
            <div style={{ marginBottom: '20px' }}>
                เลือกแล้ว: {selectedHorses.length} / 3 ตัว
            </div>

            {/* Grid รายชื่อม้าทั้งหมด */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                {inventory.map(horse => {
                    const isSelected = selectedHorses.find(h => h._id === horse._id);
                    return (
                        <div 
                            key={horse._id} 
                            onClick={() => handleSelect(horse)}
                            style={{
                                border: isSelected ? '3px solid green' : '1px solid gray',
                                padding: '10px',
                                cursor: 'pointer',
                                width: '120px'
                            }}
                        >
                            <img src={horse.image} style={{ width: '100%' }} alt={horse.name} />
                            <div>{horse.name}</div>
                        </div>
                    )
                })}
            </div>

            {/* ปุ่มยืนยัน (กดได้เมื่อครบ 3 ตัว) */}
            <button 
                onClick={() => onConfirm(selectedHorses)}
                disabled={selectedHorses.length !== 3}
                style={{ marginTop: '20px', padding: '10px 30px', fontSize: '1.2rem' }}
            >
                ยืนยันทีม ➡️
            </button>
        </div>
    );
}

export default BattleSetup;