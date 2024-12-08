// routes/authRoutesjs
const express = require('express');
const { register, login, getUserDetails } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getUserDetails);

module.exports = router;
