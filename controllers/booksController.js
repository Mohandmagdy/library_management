const express = require('express');
const pool = require('../database/connection');

const show_books = (req, res) => {
    const myQuery = "select b.isbn, title, description, pieces, group_concat(Distinct concat(firstName, ' ', lastName)) as authors, group_concat(Distinct category) as categories from books as b inner join book_author as ba on b.ISBN = ba.isbn  inner join authors as a on ba.author_id = a.author_id inner join book_category as bc on bc.isbn = b.isbn group by b.isbn;";
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

    const myQuery = `SELECT b.ISBN, b.title,  b.description,  b.pieces, p.name AS publisher_name, b.pages, b.publish_year, GROUP_CONCAT(DISTINCT CONCAT(a.firstName, ' ', a.lastName)) AS authors, GROUP_CONCAT(DISTINCT bc.category) AS categories
            FROM books AS b
            INNER JOIN book_author AS ba ON b.ISBN = ba.ISBN
            INNER JOIN authors AS a ON ba.author_id = a.author_id
            INNER JOIN book_category AS bc ON b.ISBN = bc.ISBN
            INNER JOIN publishers AS p ON b.publisher_id = p.publisher_id
            GROUP BY b.ISBN, b.title, b.description, b.pieces, b.publisher_id, p.name, b.pages, b.publish_year;`
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
    const authors = book.authors;
    const categories = book.categories;

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

            authors.forEach(authorId => {
                const myQuery2 = 'INSERT INTO book_author (isbn, author_id) VALUES (?, ?)';
                const values = [isbn, authorId];
        
                pool.query(myQuery2, values, (err, result) => {
                    if (err) {
                        pool.rollback(() => {
                            console.error('Error inserting record into book_author:', err);
                            throw err;
                        });
                    }
                });
            });

            categories.forEach(categoryName => {
                const myQuery3 = 'INSERT INTO book_category (ISBN, category) VALUES (?, ?)';
                const values = [isbn, categoryName];
    
                pool.query(myQuery3, values, (err, result) => {
                    if (err) {
                        pool.rollback(() => {
                            console.error('Error inserting record into book_category:', err);
                            throw err;
                        });
                    }
                });
            });

            pool.commit((err) => {
                if (err) {
                    pool.rollback(() => {
                        console.error('Error committing transaction:', err);
                        throw err;
                    });
                }
                res.redirect('/');
            });
        });
    })
}

const filter_category = (category, res) => {
    const myQuery = `SELECT b.ISBN, b.title, b.description, b.pieces, b.pages, GROUP_CONCAT(DISTINCT concat(firstName, ' ', lastName)) AS authors, group_concat(Distinct bc.category) as categories
            FROM books AS b
            INNER JOIN book_author AS ba ON b.ISBN = ba.ISBN
            INNER JOIN authors as a on a.author_id = ba.author_id
            INNER JOIN book_category AS bc ON b.ISBN = bc.ISBN
            GROUP BY b.ISBN
            HAVING categories LIKE '%comedy%';`
    pool.query(myQuery, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.render('books', {books: result});
        }
    })
}

const filter_publisher = (publisher, res) => {
    const myQuery = `SELECT b.ISBN, b.title, b.description, b.pieces, b.pages, GROUP_CONCAT(DISTINCT concat(firstName, ' ', lastName)) AS authors, group_concat(Distinct bc.category) as categories
            FROM books AS b
            INNER JOIN book_author AS ba ON b.ISBN = ba.ISBN
            INNER JOIN authors as a on a.author_id = ba.author_id
            INNER JOIN book_category AS bc ON b.ISBN = bc.ISBN
            INNER JOIN publishers as p ON p.publisher_id = b.publisher_id and p.name = '${publisher}'
            GROUP BY b.ISBN;`
    pool.query(myQuery, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.render('books', {books: result});
        }
    })
}

const filter_author = (author, res) => {
    const myQuery = `SELECT b.ISBN, b.title, b.description, b.pieces, b.pages, GROUP_CONCAT(DISTINCT concat(firstName, ' ', lastName)) AS authors, group_concat(Distinct bc.category) as categories
            FROM books AS b
            INNER JOIN book_author AS ba ON b.ISBN = ba.ISBN
            INNER JOIN authors as a on a.author_id = ba.author_id and concat(firstName, ' ', lastName) = '${author}'
            INNER JOIN book_category AS bc ON b.ISBN = bc.ISBN
            GROUP BY b.ISBN;`
    pool.query(myQuery, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.render('books', {books: result});
        }
    })
}

const filter = (req, res) => {
    
    const type = req.params.type;
    

    if(type == 'author'){
        filter_author(req.body.author, res);
    } else if (type == 'publisher') {
        filter_publisher(req.body.publisher, res);
    } else {
        filter_category(req.body.category, res);
    }
}





module.exports = {
    show_books,
    show_book,
    add_page,
    add_book,
    filter,

}