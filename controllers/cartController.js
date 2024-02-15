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
                    res.json({'error': 'You already have this book in your cart'});
                    return;
                })
            } else {
                const myQuery2 = `insert into cart (isbn, customer_id) values (${isbn}, ${customer_id})`
                pool.query(myQuery2, (err, result) => {
                    if(err) {
                        console.log(err)
                    } else {
                        const myQuery3 = `update books set pieces = pieces-1 where isbn = ${isbn}`;
                        pool.query(myQuery3, (err, result) => {
                            if(err) {
                                pool.rollback(() => {
                                    throw err;
                                })
                            } else {
                                pool.commit(err => {
                                    if(err) {
                                        pool.rollback(() => {
                                            throw err;
                                        })
                                    } else {
                                        res.json({'case':'success'});
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    })

}

const show_cart = (req, res) => {
    const id = req.params.id;

    const myQuery = `select b.title, c.isbn, c.cart_id
            from cart as c
            inner join books as b on b.isbn = c.isbn
            where customer_id = ${id};`;
    pool.query(myQuery, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.render('cart', {books: result});
        }
    })
}

const delete_book = (req, res) => {
    const {isbn, cart_id} = req.body;

    pool.beginTransaction(err => {
        if (err) {
            pool.rollback(() => {
                throw err;
            })
        } else {
            const myQuery2 = `delete from cart where cart_id = '${cart_id}'`;
            pool.query(myQuery2, (err, result1) => {
                if (err) {
                    pool.rollback(() => {
                        throw err;
                    })
                } else {
                    const myQuery2 = `update books set pieces = pieces + 1 where isbn = '${isbn}'`;
                    pool.query(myQuery2, (err, result2) => {
                        if (err) {
                            pool.rollback(() => {
                                throw err;
                            })
                        } else {
                            pool.commit(err => {
                                if(err) {
                                    pool.rollback(() => {
                                        throw err;
                                    })
                                } else {
                                    res.redirect('/');
                                }
                            })
                        }
                    })
                }
            })
        }
    })
}



module.exports = {
    add_book,
    show_cart,
    delete_book,
    
}