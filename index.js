const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const path = require('path');
const bcrypt = require('bcrypt');

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(express.static(path.join(__dirname + "/public")));
app.use(express.json()); // To parse JSON request bodies

// CORS Middleware
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Database Connection
const db = mysql.createConnection(
  process.env.JAWSDB_URL || {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  }
);

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});


// Initialize Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // You should have this defined in your .env
  port: process.env.EMAIL_PORT,
  secure: false, // If true, it will use TLS, otherwise, it'll use STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Basic route
app.get('/', (req, res) => {
  res.send('API is running');
});

// User Registration
app.post('/api/register', async (req, res) => {
  const { first_name, last_name, email, phone_number, password } = req.body;

  if (!first_name || !last_name || !email || !phone_number || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const checkUserSql = 'SELECT * FROM users WHERE email = ? OR phone_number = ?';
    db.query(checkUserSql, [email, phone_number], async (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Error checking user credentials' });
      }

      if (results.length > 0) {
        return res.status(409).json({ error: 'Email or phone number already registered. Please use different credentials.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const insertUserSql = 'INSERT INTO users (first_name, last_name, email, phone_number, password) VALUES (?, ?, ?, ?, ?)';
      db.query(insertUserSql, [first_name, last_name, email, phone_number, hashedPassword], (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Error registering user' });
        }

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Welcome to BNO INFORMATICA! Happy Linux Day!',
          html: `<div>Welcome, ${first_name}!</div>`,
        };

        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            return res.status(500).json({ error: 'Registration successful, but email could not be sent.' });
          }
          res.status(201).json({ message: `Welcome, ${first_name}! You have successfully registered.` });
        });
      });
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// User Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching user data' });
    }

    if (results.length > 0) {
      const user = results[0];

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (isMatch) {
          res.status(200).json({ message: `Welcome back, ${user.first_name}!` });
        } else {
          res.status(401).json({ error: 'Invalid credentials' });
        }
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
