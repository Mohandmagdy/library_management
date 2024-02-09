const express = require('express');
const pool = require('../database/connection');

const show_books = (req, res) => {
    const myQuery = "select books.isbn, title, description, available as remaining_pieces, concat(firstName, ' ', lastName) as author_name from books inner join book_author on books.ISBN = book_author.isbn inner join authors on book_author.author_id = authors.author_id";
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

    const myQuery = `select b.isbn, title, description, pages, available as remaining_pieces, concat(firstName, ' ', lastName) as author_name, name as publisher_name, publish_year from books as b inner join book_author as ba on b.isbn = ba.isbn inner join authors as a on a.author_id = ba.author_id inner join publishers as p on b.publisher_id = p.publisher_id where b.isbn = ${id}`
    pool.query(myQuery, (err, result) => {
        if(err){
            console.log(err);
        } else {
            res.render('bookDetails', {book:result[0]});
        }
    })
}


module.exports = {
    show_books,
    show_book,

}