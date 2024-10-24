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
  origin: 'https://671a1935e5e76eb44f60fb82--bnoregistraclient.netlify.app',
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
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; background-image: url('https://raw.githubusercontent.com/abenezerregasa/images/refs/heads/main/%E2%80%94Pngtree%E2%80%94technological%20sense%20geometric%20line%20simple_932581.jpg'); background-size: cover; background-position: center; background-color: #f4f4f4; padding: 20px;">
              <div style="background-color: rgba(255, 255, 255, 0.8); padding: 20px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center;">
                  <img src="https://bnoinformatica.com/wp-content/uploads/2024/05/BNO-informatica-Messina-logo.png" alt="Your Logo" style="width: 150px; margin-bottom: 20px;" />
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
                <div style="text-align: center; margin-top: 20px;">
                  <a href="https://www.google.com/maps/place/BNO+Informatica+-+Assistenza+tecnica+Computer+e+Telefonia+-+Messina/@38.1892396,15.5566559,17z/data=!3m1!4b1!4m6!3m5!1s0x13144e79839695c3:0x4d7aa8a1a65227cc!8m2!3d38.1892396!4d15.5566559!16s%2Fg%2F1vv2pgkz?entry=ttu&g_ep=EgoyMDI0MTAxNi4wIKXMDSoASAFQAw%3D%3D" style="padding: 15px 30px; font-size: 18px; background-color: #2BA5CB; color: white; text-decoration: none; border-radius: 5px; display: inline-block; width: auto;">Navigate to BNO on Google Maps</a>
                </div>
                <div style="text-align: center; margin-top: 50px;">
                  <p style="font-size: 14px; color: #888;">Follow us on social media:</p>
                  <a href="https://www.facebook.com/bnoinformatica" style="margin-right: 10px;"><img src="https://cdn.pixabay.com/photo/2017/06/22/06/22/facebook-2429746_1280.png" alt="Facebook" style="width: 30px;"></a>
                  <a href="https://www.linkedin.com/company/bno-informatica/posts/?feedView=all" style="margin-right: 10px;"><img src="https://cdn.pixabay.com/photo/2017/08/22/11/56/linked-in-2668700_1280.png" alt="LinkedIn" style="width: 30px;"></a>
                  <a href="https://www.instagram.com/bnoinformatica?igsh=MXU4c21wNGM4dG1nbw=="><img src="https://cdn.pixabay.com/photo/2022/04/01/05/40/app-7104075_1280.png" alt="Instagram" style="width: 30px;"></a>
                </div>
                <p style="text-align: center; font-size: 12px; color: #999;">If you didn't register on our platform, please ignore this email.</p>
              </div>
            </div>
          `,
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

  // Check if both email and password are provided
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error('Error fetching user data:', err);
      return res.status(500).json({ error: 'Error fetching user data' });
    }

    // Check if the user exists
    if (results.length > 0) {
      const user = results[0];

      // Compare the hashed password with the input password
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error('Error comparing passwords:', err);
          return res.status(500).json({ error: 'Server error during login' });
        }

        if (isMatch) {
          // Successful login
          res.status(200).json({ message: `Welcome back, ${user.first_name}!` });
        } else {
          // Password does not match
          res.status(401).json({ error: 'Invalid credentials' });
        }
      });
    } else {
      // User not found
      res.status(404).json({ error: 'User not found' });
    }
  });
});







// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
