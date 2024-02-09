const express = require('express');
const authRoutes = require('./routes/authRoutes');
const booksRoutes = require('./routes/booksRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const pool = require('./database/connection');
const cookieParser = require('cookie-parser');


const app = express();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded());
app.use(cookieParser());


app.get('*', authMiddleware.check_user);
app.post('*', authMiddleware.check_user);
app.get('/', (req, res) => {
    res.render('index');
})

app.use('/auth', authRoutes);
app.use('/books', booksRoutes);

app.listen(3000);