const express = require('express');
const pool = require('../database/connection');
const jwt = require('jsonwebtoken');

const check_user = (req, res, next) => {
    const token = req.cookies.jwt;

    if(token){
        jwt.verify(token, 'increaseupto1', async(err, decodedToken) => {
            if(err){
                res.locals.user = null;
                next();
            } else {
                const myQuery = `select * from customers where customer_id = ${decodedToken.id}`
                pool.query(myQuery, (err, result) => {
                    if(err){
                        res.locals.user = null;
                        next();
                    } else {
                        res.locals.user = result[0];
                        next();
                    }
                })
            }
        });
    }
    else{
        res.locals.user = null;
        next();
    }
}

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;
    
    if(token){
        jwt.verify(token, 'increaseupto1', (err, decodedToken) => {
            if(err){
                res.redirect('/auth/login');
            } else {
                next();
            }
        })
    } else {
        res.redirect('/auth/login');
        next();
    }
}

module.exports = {
    check_user,
    requireAuth
}
