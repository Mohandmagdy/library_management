const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../database/connection');
const jwt = require('jsonwebtoken');
const {isEmail} = require('validator');
const nodemailer = require('nodemailer');

const maxAge = 3 * 24 * 60 * 60;

const create_token = (id, role) => {
    const token = jwt.sign({id, role}, 'increaseupto1', {
        expiresIn: maxAge
    });
    return token;
}

const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
      user: 'mohandmagdii45@gmail.com', 
      pass: 'hmadalmaza10' 
    }
});

const generateOTP = () => {
    var digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 6; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}

const sendOtp = (email) => {
    const otp = generateOTP();

    const myQuery = 'insert into otp (otp_code, email) values (?, ?);'
    pool.query(myQuery, [otp, email], (err, result) => {
        if(err) {
            console.log(err);
            return;
        }
    })

    const mailOptions = {
        from: 'mohandmagdii45@gmail.com',
        to: email,
        subject: 'Email verification',
        text: `Hello, Please use this OTP to verify your email ${otp}`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          return console.error('Error occurred while sending email:', err);
        }
    });
}

const validateEmail = (email) => {
    if(isEmail(email))
        return true;
    return false;
}

const check_otp = async (req, res) => {
    const {otp, user} = req.body;

    
    user.password = await hash_password(user.password);
    
    if(user.password == 'wrong'){
        res.json({'errors':{password: 'password must be at least 6 characters'}});
        return;
    }
    

    const publisher = () => {
        const myQuery1 = `insert into publishers (email, password, name, creation_year) values('${user.email}', '${user.password}', '${user.name}', ${user.creationYear});`
    
            pool.query(myQuery1, (err, result1) => {
                if (err) {
                    console.log(err);
                } else {
                    const token = create_token(result1.insertId, 'publisher');
                    res.cookie('jwt', token, {maxAge:maxAge*1000, httpOnly:true});
                    res.json({'case':'success'});
                }
            })
    }

    const customer = () => {
        const myQuery1 = `insert into customers (email, password, firstName, lastName, age) values('${user.email}', '${user.password}', '${user.firstName}', '${user.lastName}', ${user.age});`
    
            pool.query(myQuery1, (err, result1) => {
                if (err) {
                    console.log(err);
                } else {
                    const token = create_token(result1.insertId, 'customer');
                    res.cookie('jwt', token, {maxAge:maxAge*1000, httpOnly:true});
                    res.json({'case':'success'});
                }
            })
    }
    

    const myQuery = `SELECT otp_code FROM otp WHERE email = ${pool.escape(user.email)}ORDER BY created_at DESC LIMIT 1;`;
    pool.query(myQuery, (err, result) => {
        if(err || result.length == 0 || result[0].otp_code != otp){
            res.json({'case':'wrong'});
        } else{
            if(user.firstName) {
                customer();
            } else {
                publisher();
            }
        }
    })
}

const hash_password = async (password) => {
    const salt = await bcrypt.genSalt();
    password = await bcrypt.hash(password, salt);
    return password;
}

const add_user = (user, res) => {
    if(!validateEmail(user.email)){
        res.json({'errors': {'email': 'wrong email address'}});
        return;
    }

    const rollback = (err) => {
        pool.rollback(() => {
            console.log(err);
        })
    }

    let errors = {'email':'', 'password':'', 'creationYear':''};
    pool.beginTransaction((err) => {
        if (err) {rollback(err);}
        else {
            //check not customer email
            const myQuery1 = `select email from customers where email = ${pool.escape(user.email)}`
            pool.query(myQuery1, (err, result) => {
                if(err){rollback(err);}
                if(result.length>0){
                    pool.rollback(() => {
                        errors.email = 'Email address is already in use';
                        res.json({'errors': errors});
                        return;
                    })
                } else {
                    //check not publisher email
                    const myQuery2 = `select email from publishers where email = ${pool.escape(user.email)}`
                    pool.query(myQuery2, (err, result) => {
                        if(err){rollback(err);}
                        if(result.length>0){
                            pool.rollback(() => {
                                errors.email = 'Email address is already in use';
                                res.json({'errors': errors});
                                return;
                            })
                        } else {
                            //send otp
                            sendOtp(user.email);

                            pool.commit((err) => {
                                if (err) {rollback();}
                                else {
                                    res.json({'case':'otp'});
                                    return;
                                }
                            });
                        }
                    })
                }
            })
            
        }
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
            } else {
                const hashedPasswordFromDB = result[0].password;

                bcrypt.compare(user.password, hashedPasswordFromDB, (compareErr, passwordMatch) => {
                    if (compareErr) {
                        console.error('Error comparing passwords:', compareErr);
                        res.json({'error': 'An error occurred while processing your request'});
                        return;
                    }

                    if (passwordMatch) {
                        const token = create_token(result[0].customer_id, 'customer');
                        res.cookie('jwt', token, {maxAge:maxAge*1000, httpOnly:true});
                        res.json({'user': result[0]});
                    } else {
                        res.json({'error': 'Invalid email or password'});
                    }
                });
            }
        }
    })
}

const publisher_login = (user, res) => {
    const myQuery = `SELECT * FROM publishers WHERE email='${user.email}';`;
    pool.query(myQuery, (err, result) => {
        if (err) {
            console.error(err);
            res.json({'error': 'An error occurred while processing your request'});
        } else {
            if (!result[0]) {
                res.json({'error': 'Invalid email or password'});
            } else {
                const hashedPasswordFromDB = result[0].password;

                bcrypt.compare(user.password, hashedPasswordFromDB, (compareErr, passwordMatch) => {
                    if (compareErr) {
                        console.error('Error comparing passwords:', compareErr);
                        res.json({'error': 'An error occurred while processing your request'});
                        return;
                    }

                    if (passwordMatch) {
                        const token = create_token(result[0].publisher_id, 'publisher');
                        res.cookie('jwt', token, {maxAge: maxAge * 1000, httpOnly: true});
                        res.json({'user': result[0]});
                    } else {
                        res.json({'error': 'Invalid email or password'});
                    }
                });
            }
        }
    });
};


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

    let filePath = null;
    if(req.file){
        filePath = req.file.path;
        console.log(filePath);
    } else if (!req.file) {
        console.log('zena');
    }


    if(!validateEmail) {
        res.json({'errors':{email: 'Wrong email address'}});
        return;
    }

    if (user.password.length < 6){
        res.json({'errors':{password: 'password must be at least 6 characters'}});
        return;
    }
    
    add_user(user, res);
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
    check_otp,
    hash_password,

}