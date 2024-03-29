const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const upload = require('../middleware/multerMiddleware');


router.get('/login', controller.get_login);
router.get('/signup/customer', controller.get_customer_signup);
router.get('/signup/publisher', controller.get_publisher_signup);
router.post('/login', controller.post_login);
router.post('/otp', controller.check_otp);
router.post('/signup',upload.single('photo'), controller.post_signup);
router.get('/logout', controller.logout);

module.exports = router;