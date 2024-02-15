const express = require('express');
const router = express.Router();
const controller = require('../controllers/cartController');

router.post('/add/:customer_id/:isbn', controller.add_book);
router.post('/delete', controller.delete_book);
router.get('/:id', controller.show_cart);

module.exports = router;