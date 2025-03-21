const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/expense_tracker.db');

// Login page
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Register page
router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

// Register process
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Basic validation
  if (!username || !email || !password) {
    return res.render('register', { error: 'All fields are required' });
  }

  try {
    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error(err);
        return res.render('register', { error: 'An error occurred' });
      }
      
      if (user) {
        return res.render('register', { error: 'Email already registered' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert new user
      const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
      db.run(sql, [username, email, hashedPassword], (err) => {
        if (err) {
          console.error(err);
          return res.render('register', { error: 'An error occurred during registration' });
        }

        // Redirect to login page after successful registration
        res.redirect('/auth/login');
      });
    });
  } catch (err) {
    console.error(err);
    res.render('register', { error: 'An error occurred' });
  }
});

// Login process
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('login', { error: 'All fields are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error(err);
      return res.render('login', { error: 'An error occurred' });
    }

    if (!user) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    req.session.userId = user.id;
    res.redirect('/dashboard');
  });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/auth/login');
});

module.exports = router;