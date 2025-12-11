const express = require('express');
const app = express();
const db = require('./db');
app.get('/users', (req, res) => {
db.query('SELECT * FROM users', (err, results) => {
if (err) {
return res.status(500).send('Error fetching users');
}
res.json(results);
});
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});