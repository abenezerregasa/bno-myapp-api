const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const path = require('path');
const bcrypt = require('bcrypt');

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Middleware to serve static files (if any)
app.use(express.static(path.join(__dirname + "/public")));
app.use(express.json()); // Middleware to parse JSON request bodies

// CORS Middleware
const corsOptions = {
  origin: 'https://bnoregistraclienti.netlify.app',  // Your client-side domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'],  // Allowed headers
  credentials: true,  // Allows credentials (cookies, authorization headers)
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

// Connect to MySQL Database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

// Initialize Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, 
  port: process.env.EMAIL_PORT,
  secure: false,  // Use TLS if true
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

  // Validate required fields
  if (!first_name || !last_name || !email || !phone_number || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if user already exists in the database
    const checkUserSql = 'SELECT * FROM users WHERE email = ? OR phone_number = ?';
    db.query(checkUserSql, [email, phone_number], async (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Error checking user credentials' });
      }

      // If user already exists, send an error
      if (results.length > 0) {
        return res.status(409).json({ error: 'Email or phone number already registered. Please use different credentials.' });
      }

      // Hash the user's password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the new user into the database
      const insertUserSql = 'INSERT INTO users (first_name, last_name, email, phone_number, password) VALUES (?, ?, ?, ?, ?)';
      db.query(insertUserSql, [first_name, last_name, email, phone_number, hashedPassword], (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Error registering user' });
        }

        // Set up welcome email options
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Welcome to BNO INFORMATICA! Happy Linux Day!',
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; background-image: url('https://raw.githubusercontent.com/abenezerregasa/images/refs/heads/main/%E2%80%94Pngtree%E2%80%94technological%20sense%20geometric%20line%20simple_932581.jpg'); background-size: cover; background-position: center; background-color: #f4f4f4; padding: 20px;">
              <div style="background-color: rgba(255, 255, 255, 0.8); padding: 20px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center;">
                  <img src="https://raw.githubusercontent.com/abenezerregasa/images/refs/heads/main/logo%402x.png" alt="Your Logo" style="width: 150px; margin-bottom: 20px;" />
                </div>
                <h1 style="text-align: center; color: #0C89C0;">Welcome, ${first_name}!</h1>
                <p style="font-size: 18px; text-align: center;">We are thrilled to have you join us at <strong>BNO Informatica</strong>. Here’s a summary of your details:</p>
                <table style="margin: 0 auto; border-collapse: collapse; font-size: 16px; width: 100%; max-width: 500px;">
                  <tr><td style="padding: 8px;"><strong>First Name:</strong></td><td style="padding: 8px;">${first_name}</td></tr>
                  <tr><td style="padding: 8px;"><strong>Last Name:</strong></td><td style="padding: 8px;">${last_name}</td></tr>
                  <tr><td style="padding: 8px;"><strong>Email:</strong></td><td style="padding: 8px;">${email}</td></tr>
                  <tr><td style="padding: 8px;"><strong>Phone Number:</strong></td><td style="padding: 8px;">${phone_number}</td></tr>
                </table>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://bnoinformatica.com" style="padding: 15px 30px; font-size: 18px; background-color: #0C89C0; color: white; text-decoration: none; border-radius: 5px; display: inline-block; width: auto;">Visit BNO</a>
                </div>
              </div>
            </div>
          `,
        };

        // Send the welcome email
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

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Find the user by email
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching user data' });
    }

    // If user found, compare passwords
    if (results.length > 0) {
      const user = results[0];

      // Compare password using bcrypt
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (isMatch) {
          // Password match
          res.status(200).json({ message: `Welcome back, ${user.first_name}!` });
        } else {
          // Password mismatch
          res.status(401).json({ error: 'Invalid credentials' });
        }
      });
    } else {
      // No user found
      res.status(404).json({ error: 'User not found' });
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
