const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
};

const pool = mysql.createPool({
    host:process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});
   module.exports = pool.promise();
