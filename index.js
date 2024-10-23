const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');

// Initialize environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Basic route
app.get('/', (req, res) => {
  res.send('Hello from Express + MySQL API');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
