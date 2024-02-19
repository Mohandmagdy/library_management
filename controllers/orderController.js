const pool = require('../database/connection');
const util = require('util');

const poolQueryPromise = util.promisify(pool.query).bind(pool);

const add_order = async (req, res) => {
    const {customer_id} = req.params;
    try{
        await pool.beginTransaction();

        const myQuery1 = `INSERT INTO orders (customer_id) VALUES (?)`;
        const result1 = await poolQueryPromise(myQuery1, [customer_id]);
        const orderId = result1.insertId;

        const myQuery2 = `INSERT INTO order_details (order_id, isbn) SELECT ?, isbn FROM Cart WHERE customer_id = ?`;
        const result2 = await poolQueryPromise(myQuery2, [orderId, customer_id]);

        const myQuery3 = `DELETE FROM cart WHERE customer_id = ?`;
        const result3 = await poolQueryPromise(myQuery3, [customer_id]);

        await pool.commit();
        res.redirect('/');
    }

    catch(err) {
        console.log(err);
        await pool.rollback();
        
        res.json({ 'errors': "An error occurred while processing the request" });
    }
}

const show_order = (req, res) => {
    const {customer_id} = req.params;

    const myQuery = 'select o.order_id, group_concat(b.title) from orders as o inner join order_details as od on od.order_id = o.order_id inner join books as b on od.isbn = b.ISBN where o.customer_id = ? group by (o.order_id);'
    pool.query(myQuery, [customer_id], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.render('orders', {orders:result});
        }
    })
}

const delete_order = async (req, res) => {
    const {order_id} = req.params;

    try {
        await pool.beginTransaction();

        const myQuery1 = 'select isbn from order_details where order_id = ?'
        const books = await poolQueryPromise(myQuery1, [order_id]);

        const myQuery2 = 'delete from order_details where order_id = ?'
        const reuslt2 = await poolQueryPromise(myQuery2, [order_id]);

        const myQuery3 = 'delete from orders where order_id = ?'
        const result3 = await poolQueryPromise(myQuery3, [order_id]);

        books.forEach(async (book) => {
            const myQuery = 'update books set pieces = pieces + 1 where isbn = ?';
            const result = await poolQueryPromise(myQuery, [book.isbn]);
        });

        await pool.commit();
        res.redirect('/');

    } catch (err){
        await pool.rollback();
        console.log(err);
        res.json({'errors': "couldn't delete the order"});
    }
}

module.exports = {
    add_order,
    show_order,
    delete_order,

}