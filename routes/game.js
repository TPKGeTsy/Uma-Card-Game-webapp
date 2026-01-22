const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const verifyToken = require('../middleware/auth');
const authenticateUser = require('../middleware/auth');
// GET /api/game/draft -> ขอกองการ์ดมาเลือก

router.get('/draft-pool', authenticateUser, gameController.getDraftPool);
router.post('/simulate-race', authenticateUser, gameController.simulateRace);
router.get('/draft', verifyToken, gameController.getDraftPool);
// POST /api/game/race -> เริ่มจำลองการแข่ง
router.post('/race', verifyToken, gameController.simulateRace);

module.exports = router;