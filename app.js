const express = require('express');
const authenticationRoutes = require('./routes/authenticationRoutes')
const pool = require('./database/connection');
const cookieParser = require('cookie-parser');


const app = express();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.render('index');
})

app.use('/auth', authenticationRoutes);

app.listen(3000);