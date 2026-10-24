require('dotenv').config();
const app = require('./app');
const pool = require('./db');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

pool.query('SELECT 1')
  .then(() => {
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Could not connect to MySQL:', err.message);
    process.exit(1);
  });
