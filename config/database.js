const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',         // ✅ Make sure this is correct
  password: 'kirk24',         // ✅ If you set a password, add it here
  database: 'exam_scanner_db',
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('✅ Connected to MySQL database');
});

module.exports = db;
