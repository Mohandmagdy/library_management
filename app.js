const express = require('express');
const {createPool} = require('mysql');

const app = express();

app.use(express.json());