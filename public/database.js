require('dotenv').config();
const mysql = require('mysql');
const connection = mysql.createConnection({
host: process.env.DB_HOST,
user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
database: process.env.DB_NAME
});
connection.connect((err) => {
if (err) throw err;
console.log('Connected to the database!');
});
const removeBgApiKey = process.env.REMOVE_BG_API_KEY;
console.log(`Remove.bg API Key: ${removeBgApiKey}`);