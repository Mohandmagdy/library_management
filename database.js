const mysql = require('mysql');

const pool = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'library',
})

pool.query('select * from customers', (err, res, fields) => {
    if(err){
        return console.log(err);
    }
    return console.log(res);
})

