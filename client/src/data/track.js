export const TRACKS = [
    {
        id: 'tokyo_2400',
        name: 'Tokyo Racecourse (Japan Cup)',
        distance: 2400,
        image: '/images/tracks/tokyo.png',
        description: "ทางตรงยาว 525 เมตร วัดกันที่ความเร็วปลาย!",
        weatherOptions: ['Sunny', 'Sunny', 'Rain'],
        // 📍 จุดสำคัญในสนามจริง (อิงตามแผนที่)
        landmarks: [
            { distance: 350, name: "Corner 1 (โค้งแรก)" },
            { distance: 700, name: "Corner 2 (เข้าทางตรงหลัง)" },
            { distance: 1000, name: "Great Zelkova (ต้นยักษ์)" }, // จุดดังของโตเกียว
            { distance: 1400, name: "Corner 3 (โค้งมรณะ)" },
            { distance: 1800, name: "Corner 4 (โค้งสุดท้าย)" },
            { distance: 1900, name: "Final Straight (เข้าทางตรง)" },
            { distance: 2200, name: "Uphill (เนินวัดใจ)" }
        ],
        gimmick: {
            requiredStat: "SPEED",
            threshold: 800,
            bonus: 1.1
        }
    },
    {
        id: 'nakayama_2500',
        name: 'Nakayama Racecourse (Arima Kinen)',
        distance: 2500,
        image: '/images/tracks/nakayama.png',
        description: "โค้งเยอะ ทางตรงสั้น และเนินนรกหน้าเส้นชัย",
        weatherOptions: ['Sunny', 'Cloudy', 'Snow'],
        // 📍 จุดสำคัญในสนามจริง
        landmarks: [
            { distance: 400, name: "First Curve (โค้งแรก)" },
            { distance: 800, name: "Grandstand (หน้าอัฒจันทร์)" },
            { distance: 1100, name: "Corner 1 (รอบสอง)" },
            { distance: 1600, name: "Backstretch (ทางตรงหลัง)" },
            { distance: 2100, name: "Final Corner (โค้งตัดสิน)" },
            { distance: 2300, name: "Heartbreak Hill (เนินนรก)" }
        ],
        gimmick: {
            requiredStat: "GUTS",
            threshold: 700,
            bonus: "IGNORE_TERRAIN"
        }
    }
];