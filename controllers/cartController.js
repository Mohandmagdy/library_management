const express = require('express');
const pool = require('../database/connection');

const add_book = (req, res) => {
    const customer_id = req.params.customer_id;
    const isbn = req.params.isbn;

    pool.beginTransaction((err) => {
        if(err) {
            pool.rollback(() => {
                throw err;
            })
        }
        const myQuery1 = 'select cart_id from cart where customer_id = ? and isbn = ?';
        const values1 = [customer_id, isbn];
        pool.query(myQuery1, values1, (err, result) => {
            if(err) {
                pool.rollback(() => {
                    throw err;
                })
            }
            if(result.length > 0){
                pool.rollback(() => {
                    res
                })
            }



            const myQuery2 = 'insert into cart (isbn, customer_id) values (?, ?);'
            const values2 = [isbn, customer_id];
            pool.query(myQuery2, values2, (err, result) => {
                if(err) {
                    console.log(err)
                } else {

                }
            })
        })
    })

}



module.exports = {
    add_book,

}