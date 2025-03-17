const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();
const pool = mysql.createPool({
    host:DB_HOST,
    user:DB_USER,
    password:DB_PASS,
    database:DB_NAME,
    port:DB_PORT
});
   module.exports = pool.promise();
