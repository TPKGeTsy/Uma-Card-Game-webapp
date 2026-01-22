const express = require('express');
const router = express.Router();
const battleController = require('../controllers/battleController');
const verifyToken = require('../middleware/auth');

// POST /api/battle/start
router.post('/start', verifyToken, battleController.startBattle);

module.exports = router;