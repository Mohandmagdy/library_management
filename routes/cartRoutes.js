const express = require('express');
const router = express.Router();
const controller = require('../controllers/cartController');

router.get('/add/:customer_id/:isbn', controller.add_book);

module.exports = router;