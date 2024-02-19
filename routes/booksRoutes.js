const express = require('express');
const router = express.Router();
const controller = require('../controllers/booksController');

router.get('/all', controller.show_books);
router.get('/add', controller.add_page);
router.get('/edit/:isbn', controller.edit_book_page);
router.post('/edit/:isbn', controller.edit_book);
router.get('/published/:id', controller.published_books);
router.get('/delete/:isbn', controller.delete_book);
router.post('/filter/:type', controller.filter);
router.post('/search', controller.book_search);
router.post('/add/:id', controller.add_book);
router.get('/:id', controller.show_book);

module.exports = router;