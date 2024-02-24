const express = require('express');
const router = express.Router();
const controller = require('../controllers/profileController');

router.get('/edit/customer/:id', controller.customer_edit_page);
router.get('/edit/publisher/:id', controller.publisher_edit_page);
router.post('/edit/:id', controller.edit_user);

module.exports = router;