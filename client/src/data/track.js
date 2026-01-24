export const TRACKS = [
    {
        id: 'tokyo_2400',
        name: 'Tokyo Racecourse (Japan Cup)',
        distance: 2400,
        image: '/assets/tracks/tokyo.png', // เดี๋ยวหารูปมาใส่
        description: "ทางตรงยาว 500 เมตร วัดกันที่ความเร็วปลาย!",
        weatherOptions: ['Sunny', 'Sunny', 'Rain'], // โอกาสออกแดดเยอะกว่า
        events: [
            { 
                distance: 1000, 
                name: "🌳 ต้นยักษ์ (Great Zelkova)", 
                type: "BUFF", 
                desc: "เช็คตำแหน่ง: ใครอยู่อันดับกลางๆ ได้ Stamina คืน" 
            },
            { 
                distance: 2000, 
                name: "🔥 ทางตรงมหาโหด (Final Straight)", 
                type: "CHECK", 
                statCheck: "STAMINA", 
                threshold: 300, // ถ้า Stamina เหลือต่ำกว่านี้ ขาตาย
                desc: "วัดกึ๋นช่วงท้าย ใครหมดแรงคือจบ" 
            }
        ],
        gimmick: {
            requiredStat: "SPEED",
            threshold: 800,
            bonus: 1.1 // Speed x1.1 ถ้าผ่านเกณฑ์
        }
    },
    {
        id: 'nakayama_2500',
        name: 'Nakayama Racecourse (Arima Kinen)',
        distance: 2500,
        image: '/assets/tracks/nakayama.png',
        description: "โค้งเยอะ ทางตรงสั้น และเนินนรกหน้าเส้นชัย",
        weatherOptions: ['Sunny', 'Cloudy', 'Snow'], // มีโอกาสหิมะตก (แข่งหน้าหนาว)
        events: [
            { 
                distance: 2300, 
                name: "🏔️ เนินนรก (Heartbreak Hill)", 
                type: "CHECK", 
                statCheck: "POWER", 
                threshold: 600, // Power ต้องถึงถึงจะวิ่งขึ้นไหว
                desc: "เนินสูงชัน วัดพลังขา!" 
            }
        ],
        gimmick: {
            requiredStat: "GUTS",
            threshold: 700,
            bonus: "IGNORE_TERRAIN" // ไม่สน Debuff เนิน
        }
    },
    // เพิ่ม Kyoto หรือสนามอื่นต่อได้
];