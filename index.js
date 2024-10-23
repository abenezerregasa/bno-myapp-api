const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');  // Declare mysql only once
const dotenv = require('dotenv');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const path = require('path');  // Path module to serve frontend

dotenv.config();

// Initialize the Express app
const app = express();
const port = process.env.PORT || 5001;
app.use(express.static(path.join(__dirname + "/public")));

// Middleware
app.use(cors());
app.use(express.json());


// Update CORS Configuration
const corsOptions = {
  origin: 'https://helpful-longma-fde6b8.netlify.app', // Your Netlify frontend URL
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));


// Database Connection using environment variables from the .env file
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT, // Ensure the port is included
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // Use TLS (true for 465, false for 587)
  auth: {
    user: process.env.EMAIL_USER, // SMTP username
    pass: process.env.EMAIL_PASS, // SMTP password
  },
});

// Basic route
app.get('/', (req, res) => {
  res.send('API is running');
});

// User Registration
app.post('/api/register', (req, res) => {
  const { first_name, last_name, email, phone_number, password } = req.body;

  const sql = 'INSERT INTO users (first_name, last_name, email, phone_number, password) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [first_name, last_name, email, phone_number, password], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error registering user' });
    }

    // Send a welcome email to the user
    const mailOptions = {
      from: process.env.EMAIL_USER,  // Sender address
      to: email,  // User's email from the registration form
      subject: 'Welcome to BNO INFORMATICA! Happy Linux Day!',  // Subject line
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: rgba(255, 255, 255, 0.8); padding: 20px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
            <h1 style="text-align: center; color: #0C89C0;">Welcome, ${first_name}!</h1>
            <p style="font-size: 18px; text-align: center;">We are thrilled to have you join us at 
            <strong>BNO Informatica</strong>. Here’s a summary of your details:</p>
            <table style="margin: 0 auto; border-collapse: collapse; font-size: 16px; width: 100%; max-width: 500px;">
              <tr>
                <td style="padding: 8px;"><strong>First Name:</strong></td>
                <td style="padding: 8px;">${first_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px;"><strong>Last Name:</strong></td>
                <td style="padding: 8px;">${last_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px;"><strong>Email:</strong></td>
                <td style="padding: 8px;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px;"><strong>Phone Number:</strong></td>
                <td style="padding: 8px;">${phone_number}</td>
              </tr>
            </table>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://bnoinformatica.com" 
                style="padding: 15px 30px; font-size: 18px; background-color: #0C89C0; color: white; text-decoration: none; border-radius: 5px; display: inline-block; width: auto;">
                Visit BNO
              </a>
            </div>
          </div>
        </div>
      `,
    };

    // Send the email using NodeMailer
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending email: ', err);
        return res.status(500).json({ error: 'Registration successful, but email could not be sent.' });
      }
      console.log('Email sent: ' + info.response);
      res.status(201).json({ message: `Welcome, ${first_name}! You have successfully registered.` });
    });
  });
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

      // Compare password (in a real app, you should hash passwords)
      if (password === user.password) {
        res.status(200).json({ message: `Welcome back, ${user.first_name}!` });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
});

// Serve static files from the React app (dist folder after build)
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Serve index.html on all other routes (fallback for client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
