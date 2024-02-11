const express = require('express');
const pool = require('../database/connection');

const show_books = (req, res) => {
    const myQuery = "select books.isbn, title, description, pieces as remaining_pieces, concat(firstName, ' ', lastName) as author_name from books inner join book_author on books.ISBN = book_author.isbn inner join authors on book_author.author_id = authors.author_id";
    pool.query(myQuery, (err, result) => {
        if(err){
            console.log(err);
        } else {
            res.render('books', {books:result});
        }
    })
}

const show_book = (req, res) => {
    const id = req.params.id;

    const myQuery = `select b.isbn, title, description, pages, pieces as remaining_copies, concat(firstName, ' ', lastName) as author_name, name as publisher_name, publish_year from books as b inner join book_author as ba on b.isbn = ba.isbn inner join authors as a on a.author_id = ba.author_id inner join publishers as p on b.publisher_id = p.publisher_id where b.isbn = ${id}`
    pool.query(myQuery, (err, result) => {
        if(err){
            console.log(err);
        } else {
            res.render('bookDetails', {book:result[0]});
        }
    })
}

const add_page = (req, res) => {
    const myQuery = `select author_id, CONCAT(firstName, ' ', lastName) as name from authors`;

    pool.query(myQuery, (err, authors) => {
        if(err) {
            console.log(err);
        } else {
            res.render('add', {authors});
        }
    })
}

const add_book = (req, res) => {
    const book = req.body;
    const publisher_id = req.params.id;

    let isbn;
    const myQuery1 = `insert into books (title, description, pieces, publisher_id, pages, publish_year) values ('${book.title}', '${book.description}', '${book.pieces}', '${publisher_id}', '${book.pages}', '${book.publish_year}')`;

    pool.beginTransaction((err) => {
        if (err) {
            pool.rollback(() => {
                throw err;
            });
        }

        pool.query(myQuery1, (err, result) => {
            if(err){
                pool.rollback(() => {
                    throw err;
                });
            }
            isbn = result.insertId;

            const myQuery2 = `insert into book_author (isbn, author_id) values ('${isbn}', '${book.author}')`

            pool.query(myQuery2, (err) => {
                if (err) {
                    pool.rollback(() => {
                        throw err;
                    });
                }
                pool.commit((err) => {
                    if (err) {
                        pool.rollback(() => {
                            throw err;
                        });
                    }
    
                    res.redirect('/');
    
                    pool.end();
                });
            })
        });
    })
}


module.exports = {
    show_books,
    show_book,
    add_page,
    add_book,

}