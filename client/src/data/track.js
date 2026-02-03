export const TRACKS = [
    {
        id: 1,
        name: "Tokyo Racecourse",
        distance: 2000,
        image:  '/images/tracks/tokyo.png',
        description: "สนามแข่งมาตรฐาน มีทางตรงยาวและโค้งกว้าง",
        weatherOptions: ["Sunny", "Rainy"],
        // ✅ เพิ่ม Segments: กำหนดช่วงของสนาม (รวมกันต้องได้ distance)
        segments: [
            { type: 'STRAIGHT', length: 400 }, // 0-400m: ออกตัวทางตรง
            { type: 'CURVE',    length: 600 }, // 400-1000m: โค้งแรก
            { type: 'STRAIGHT', length: 400 }, // 1000-1400m: ทางตรงยาว
            { type: 'CURVE',    length: 400 }, // 1400-1800m: โค้งสุดท้าย
            { type: 'STRAIGHT', length: 200 }  // 1800-2000m: ทางตรงเข้าเส้นชัย
        ]
    },
    {
        id: 2,
        name: "Nakayama Racecourse",
        distance: 2500,
        image:'/images/tracks/nakayama.png',
        description: "สนามวัดใจ ทางโค้งเยอะและมีเนินชัน",
        weatherOptions: ["Cloudy", "Snowy"],
        segments: [
            { type: 'STRAIGHT', length: 300 },
            { type: 'CURVE',    length: 800 },
            { type: 'SLOPE',    length: 400 }, // เนินเขา (กิน Stamina เยอะ)
            { type: 'CURVE',    length: 600 },
            { type: 'STRAIGHT', length: 400 }
        ]
    }
];