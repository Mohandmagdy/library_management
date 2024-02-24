const express = require('express');
const pool = require('../database/connection');
const util = require('util');
const {hash_password} = require('./authController');

const query = util.promisify(pool.query).bind(pool);

const publisher_edit_page = async (req, res) => {
    const {id} = req.params;
    const myQuery = 'select publisher_id, email, password, name, creation_year from publishers where publisher_id = ?';
    try {
        const result = await query(myQuery, [id]);
        res.render('publisherProfile', {myUser: result[0]});
    } catch(err) {
        console.log(err);
    }
}

const customer_edit_page = async (req, res) => {
    const {id} = req.params;
    const myQuery = 'select customer_id, email, password, firstName, lastName, age from customers where customer_id = ?';
    try {
        const result = await query(myQuery, [id]);
        res.render('customerProfile', {myUser: result[0]});
        console.log(result[0]);
    } catch(err) {
        console.log(err);
    }
}

const edit_publisher = async (user, id, res) => {
    user.password = await hash_password(user.password);
    const myQuery = 'update publishers set password = ?, name = ?, creation_year = ? where publisher_id = ?'
    try{
        await query(myQuery, [user.password, user.name, user.creation_year, id]);
        res.render('index');
    } catch (err){
        console.log(err);
    }
}

const edit_customer = async (user, id, res) => {
    user.password = await hash_password(user.password);
    const myQuery = 'update customers set password = ?, firstName = ?, lastName = ?, age = ? where customer_id = ?'
    try{
        await query(myQuery, [user.password, user.firstName, user.lastName, user.age, id]);
        res.render('index');
    } catch (err){
        console.log(err);
    }
}

const edit_user = (req, res) => {
    const user = req.body;
    const {id} = req.params;

    if(user.name) {
        edit_publisher(user, id, res);
    } else {
        edit_customer(user, id, res);
    }
}


module.exports = {
    customer_edit_page,
    publisher_edit_page,
    edit_user,

}