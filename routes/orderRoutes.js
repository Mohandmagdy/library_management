const express = require('express');
const router = express.Router();
const controller = require('../controllers/orderController');

router.get('/add/:customer_id', controller.add_order);
router.post('/delete/:order_id', controller.delete_order);
router.get('/:customer_id', controller.show_order);


module.exports = router;