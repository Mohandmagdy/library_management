const express = require('express');
const router = express.Router();
const controller = require('../controllers/authenticationController');


router.get('/login', controller.get_login);
router.get('/signup', controller.get_signup);
router.post('/login', controller.post_login);
router.post('/signup', controller.post_signup);

module.exports = router;