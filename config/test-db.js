const db = require('./database'); // Import database connection

// Run a simple query to check the connection
db.query('SELECT 1', (err, results) => {
  if (err) {
    console.error('Database test failed:', err);
  } else {
    console.log('Database test successful:', results);
  }
  db.end(); // Close the connection after the test
});
