const express = require('express');
const router = express.Router();
const controller = require('../controllers/booksController');

router.get('/all', controller.show_books);
router.get('/add', controller.add_page);
router.post('/filter/:type', controller.filter);
router.post('/add/:id', controller.add_book);
router.get('/:id', controller.show_book);

module.exports = router;