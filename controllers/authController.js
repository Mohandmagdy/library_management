const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../database/connection');
const jwt = require('jsonwebtoken');

const maxAge = 3 * 24 * 60 * 60;

const create_token = (id, role) => {
    const token = jwt.sign({id, role}, 'increaseupto1', {
        expiresIn: maxAge
    });
    return token;
}

const check_hash_password = async (password) => {
    if(password.length >= 6){
        const salt = await bcrypt.genSalt();
        password = await bcrypt.hash(password, salt);
        return password;
    }
    return 'wrong';
}

const add_customer = (user, res) => {

    pool.beginTransaction((err) => {
        if (err){
            pool.rollback(() => {
                throw err;
            })
        }
        const testQuery = `select email from publishers where email = '${user.email}'`;
        let errors = {'email':''};
        pool.query(testQuery, (err, result1) => {
            if (err){
                pool.rollback(() => {
                    throw err;
                })
            }
            if(result1[0]) {
                pool.rollback(() => {
                    errors.email = 'Email address is already in use';
                    res.json({'errors': errors});
                })
            } else {
                const myQuery = `insert into customers (email, password, firstName, lastName, age) values('${user.email}', '${user.password}', '${user.firstName}', '${user.lastName}', ${user.age});`
    
                pool.query(myQuery, (err, result2) => {
                    if(err){
                        pool.rollback(() => {
                            if(err.sqlMessage.includes('Duplicate')){
                                errors.email = 'Email address is already in use';
                            }
                            res.json({'errors': errors});
                        })
                    } else {
                        pool.commit((err) => {
                            if (err) {
                                pool.rollback(() => {
                                    throw err;
                                });
                            }
                            const token = create_token(result2.insertId, 'customer');
                            res.cookie('jwt', token, {maxAge:maxAge*1000, httpOnly:true});
                            res.json({'case':'success'});
                        });
                    }
                })
            }
        })
    })
}

const add_publisher = (user, res) => {

    pool.beginTransaction((err) => {
        if (err){
            pool.rollback(() => {
                throw err;
            })
        }
        const testQuery = `select email from customers where email = '${user.email}'`;
        let errors = {'email':''};
        pool.query(testQuery, (err, result1) => {
            if (err){
                pool.rollback(() => {
                    throw err;
                })
            }
            if(result1[0]) {
                pool.rollback(() => {
                    errors.email = 'Email address is already in use';
                    res.json({'errors': errors});
                })
            } else {
                const myQuery = `insert into publishers (email, password, name, creation_year) values('${user.email}', '${user.password}', '${user.name}', ${user.creationYear});`
    
                pool.query(myQuery, (err, result2) => {
                    if(err){
                        pool.rollback(() => {
                            if(err.sqlMessage.includes('Duplicate')){
                                errors.email = 'Email address is already in use';
                            }
                            res.json({'errors': errors});
                        })
                    } else {
                        pool.commit((err) => {
                            if (err) {
                                pool.rollback(() => {
                                    throw err;
                                });
                            }
                            const token = create_token(result2.insertId, 'publisher');
                            res.cookie('jwt', token, {maxAge:maxAge*1000, httpOnly:true});
                            res.json({'case':'success'});
                        });
                    }
                })
            }
        })
    })
}

const customer_login = (user, res) => {
    const myQuery = `select * from customers where email='${user.email}';`;
    pool.query(myQuery, (err, result) => {
        if(err){
            console.log(err);
        } else{
            if(!result[0]){
                res.json({'error': 'invalid email or password'});
            } else{
                bcrypt.compare(user.password, result[0].password)
                    .then(rs => {
                        const token = create_token(result[0].customer_id, 'customer');
                        res.cookie('jwt', token, {maxAge:maxAge*1000, httpOnly:true});
                        res.json({'user': result[0]});
                    }).catch(err => {
                        console.log(err);
                    })
                
            }
        }
    })
}

const publisher_login = (user, res) => {
    const myQuery = `select * from publishers where email='${user.email}';`;
    pool.query(myQuery, (err, result) => {
        if(err){
            console.log(err);
        } else{
            if(!result[0]){
                res.json({'error': 'invalid email or password'});
            } else{
                bcrypt.compare(user.password, result[0].password)
                    .then(rs => {
                        const token = create_token(result[0].publisher_id, 'publisher');
                        res.cookie('jwt', token, {maxAge:maxAge*1000, httpOnly:true});
                        res.json({'user': result[0]});
                    }).catch(err => {
                        console.log(err);
                    })
                
            }
        }
    })
}

const get_login = (req, res) => {
    res.render('login');
}

const get_customer_signup = (req, res) => {
    res.render('customerSignup');
}

const get_publisher_signup = (req, res) => {
    res.render('publisherSignup');
}

const post_login = (req, res) => {
    const user = req.body;
    
    if(user.role == 'customer'){
        customer_login(user, res);
    } else {
        publisher_login(user, res);
    }
}

const post_signup = async (req, res) => {
    let user = req.body;

    user.password = await check_hash_password(user.password);
    
    if(user.password == 'wrong'){
        res.json({'errors':{password: 'password must be at least 6 characters'}});
        return;
    }
    
    if(user.firstName){
        add_customer(user, res);
    } else {
        add_publisher(user, res);
    }
}


const logout = (req, res) => {
    res.cookie('jwt', '', {
        maxAge:1
    });
    res.redirect('/');
}

module.exports = {
    get_login,
    get_customer_signup,
    get_publisher_signup,
    post_login,
    post_signup,
    logout,

}