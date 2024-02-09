const express = require('express');
const router = express.Router();
const controller = require('../controllers/booksController');

router.get('/all', controller.show_books);
router.get('/:id', controller.show_book);

module.exports = router;