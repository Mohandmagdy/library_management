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
                        const token = create_token(result[0].customer_id);
                        res.cookie('jwt', token, {maxAge:maxAge*1000, httpOnly:true});
                        res.json({'user': result[0]});
                    }).catch(err => {
                        console.log(err);
                    })
                
            }
        }
    })
}

const post_signup = async (req, res) => {
    let user = req.body;

    if(user.password.length < 6){
        res.json({'errors':{password: 'password must be at least 6 characters'}});
        return;
    }

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(user.password, salt);
    const myQuery = `insert into customers (email, password, firstName, lastName, user_role, age) values('${user.email}', '${user.password}', '${user.firstName}', '${user.lastName}', '${user.user_role}', ${user.age});`
    const errors = {};
    
    pool.query(myQuery, (err, result) => {
        if(err){
            if(err.sqlMessage.includes('Duplicate')){
                errors.email = 'Email address is already in use';
            }
            res.json({'errors': errors});
        } else {
            const myQuery1 = `select customer_id from customers where email = '${user.email}'`;
            pool.query(myQuery1, (err, result1) => {
                if(err){
                    console.log(err);
                } else {
                    const token = create_token(result1[0].customer_id);
                    res.cookie('jwt', token, {maxAge:maxAge*1000, httpOnly:true});
                    res.json({'user':result1[0]});
                }
            })
        }
    })
}


const logout = (req, res) => {
    res.cookie('jwt', '', {
        maxAge:1
    });
    res.redirect('/');
}

module.exports = {
    get_login,
    get_signup,
    post_login,
    post_signup,
    logout,

}