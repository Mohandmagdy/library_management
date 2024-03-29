const express = require('express');
const pool = require('../database/connection');
const util = require('util');

const query = util.promisify(pool.query).bind(pool);

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

    const myQuery = `SELECT b.isbn, b.title,  b.description,  b.pieces, p.name AS publisher_name, b.pages, b.publish_year, GROUP_CONCAT(DISTINCT CONCAT(a.firstName, ' ', a.lastName)) AS authors, GROUP_CONCAT(DISTINCT bc.category) AS categories
            FROM books AS b
            INNER JOIN book_author AS ba ON b.isbn = ba.isbn
            INNER JOIN authors AS a ON ba.author_id = a.author_id
            INNER JOIN book_category AS bc ON b.isbn = bc.isbn 
            INNER JOIN publishers AS p ON b.publisher_id = p.publisher_id
            where b.isbn = ${id}
            GROUP BY b.isbn, b.title, b.description, b.pieces, b.publisher_id, p.name, b.pages, b.publish_year;`
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
    let authors = book.authors;
    let categories = book.categories;

    const authorsArray = Array.isArray(book.authors) ? book.authors : [book.authors];
    const categoriesArray = Array.isArray(book.categories) ? book.categories : [book.categories];
    authors = authorsArray;
    categories = categoriesArray;
    
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
    const myQuery = `SELECT b.isbn, b.title, b.description, b.pieces, b.pages, GROUP_CONCAT(DISTINCT concat(firstName, ' ', lastName)) AS authors, group_concat(Distinct bc.category) as categories
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
    const myQuery = `SELECT b.isbn, b.title, b.description, b.pieces, b.pages, GROUP_CONCAT(DISTINCT concat(firstName, ' ', lastName)) AS authors, group_concat(Distinct bc.category) as categories
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
    const myQuery = `SELECT b.isbn, b.title, b.description, b.pieces, b.pages, GROUP_CONCAT(DISTINCT concat(firstName, ' ', lastName)) AS authors, group_concat(Distinct bc.category) as categories
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

const published_books = (req, res) => {
    const {id}= req.params;

    const myQuery = `SELECT b.isbn, b.title, b.description, b.pieces, b.pages, GROUP_CONCAT(DISTINCT concat(firstName, ' ', lastName)) AS authors, group_concat(Distinct bc.category) as categories
            FROM books AS b
            INNER JOIN book_author AS ba ON b.ISBN = ba.ISBN
            INNER JOIN authors as a on a.author_id = ba.author_id
            INNER JOIN book_category AS bc ON b.ISBN = bc.ISBN
            INNER JOIN publishers as p ON p.publisher_id = b.publisher_id
            where p.publisher_id = ${id}
            GROUP BY b.ISBN;`
    pool.query(myQuery, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.render('books', {books: result, publisher:true});
        }
    })
}

const delete_book = (req, res) => {
    const { isbn } = req.params;

    pool.beginTransaction((err) => {
        if (err) {
            throw err;
        }

        const queries = [
            `DELETE FROM book_author WHERE isbn = ${pool.escape(isbn)}`,
            `DELETE FROM book_category WHERE isbn = ${pool.escape(isbn)}`,
            `DELETE FROM books WHERE isbn = ${pool.escape(isbn)}`
        ];

        queries.forEach((query) => {
            pool.query(query, (err, result) => {
                if (err) {
                    return pool.rollback(() => {
                        throw err;
                    });
                }
            });
        });

        pool.commit((err) => {
            if (err) {
                return pool.rollback(() => {
                    throw err; 
                });
            }
            res.redirect('/');
        });
    });
};


const edit_book_page = (req, res) => {
    const {isbn} = req.params;

    const myQuery = `SELECT b.isbn, b.title,  b.description,  b.pieces, b.pages, b.publish_year, GROUP_CONCAT(DISTINCT CONCAT(a.firstName, ' ', a.lastName)) AS authors, GROUP_CONCAT(DISTINCT bc.category) AS categories
            FROM books AS b
            INNER JOIN book_author AS ba ON b.isbn = ba.isbn
            INNER JOIN authors AS a ON ba.author_id = a.author_id
            INNER JOIN book_category AS bc ON b.isbn = bc.isbn 
            where b.isbn = ${isbn}
            GROUP BY b.isbn, b.title, b.description, b.pieces, b.pages, b.publish_year;`
    pool.query(myQuery, (err, result) => {
        if(err){
            console.log(err);
        } else {
            res.render('edit', {book:result[0]});
        }
    })
}

const edit_book = (req, res) => {
    const {isbn} = req.params;
    const b = req.body;

    const myQuery = 'update books set title = ?, description = ?, pieces = ?, pages = ?, publish_year = ? where isbn = ?';
    const values = [b.title, b.description, b.pieces, b.pages, b.publish_year, isbn];
    pool.query(myQuery, values, (err, result) => {
        if (err) {
            res.json({'error': ''});
        } else {
            res.json({'case':'success'});
        }
    })
}

const book_search = async (req, res) => {
    const text = req.body.text;

    try{
        const myQuery = `select b.isbn, title, description, pieces, group_concat(Distinct concat(firstName, ' ', lastName)) as authors, group_concat(Distinct category) as categories from books as b inner join book_author as ba on b.ISBN = ba.isbn  inner join authors as a on ba.author_id = a.author_id inner join book_category as bc on bc.isbn = b.isbn where b.title like ? group by b.isbn;`;
        const books = await query(myQuery, [`%${text}%`]);
        res.render('books', {books});
    } catch(err){
        console.log(err);
    }

}



module.exports = {
    show_books,
    show_book,
    add_page,
    add_book,
    filter,
    published_books,
    delete_book,
    edit_book_page,
    edit_book,
    book_search,

}