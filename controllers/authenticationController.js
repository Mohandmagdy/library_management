const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../database/connection');
const jwt = require('jsonwebtoken');

const maxAge = 3 * 24 * 60 * 60;

const create_token = (id) => {
    const token = jwt.sign({id}, 'increaseupto1', {
        expiresIn: maxAge
    });
    return token;
}

const get_login = (req, res) => {
    res.render('login');
}

const get_signup = (req, res) => {
    res.render('signup');
}

const post_login = (req, res) => {
    const user = req.body;
    const myQuery = `select * from customers where email='${user.email}';`;
    pool.query(myQuery, (err, result, fields) => {
        if(err){
            console.log(err);
        } else{
            if(!result[0]){
                res.json({'error': 'invalid email or password'});
            } else{
                bcrypt.compare(user.password, result[0].password)
                    .then(rs => {
                        const token = create_token(result.customer_id);
                        res.cookie('jwt', token, {maxAge:maxAge*1000, httpOnly:true});
                        res.json(result);
                    }).catch(err => {
                        console.log(err);
                    })
                
            }
        }
    })
}

const post_signup = async (req, res) => {
    let user = req.body;
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(user.password, salt);
    const myQuery = `insert into customers (email, password, firstName, lastName, user_role, age) values('${user.email}', '${user.password}', '${user.firstName}', '${user.lastName}', '${user.user_role}', ${user.age});`
    pool.query(myQuery, (err, result) => {
        if(err){
            console.log(err)
        } else {
            const token = create_token(result.customer_id);
            res.cookie('jwt', token, {maxAge:maxAge*1000, httpOnly:true});
            res.json({'case':'account created'});
        }
    })
}


module.exports = {
    get_login,
    get_signup,
    post_login,
    post_signup,

}