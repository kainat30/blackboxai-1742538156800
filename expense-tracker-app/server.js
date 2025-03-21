const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8000;

// Ensure database directory exists
const dbDir = './database';
if (!fs.existsSync(dbDir)){
    fs.mkdirSync(dbDir);
}

// Database setup
const db = new sqlite3.Database('./database/expense_tracker.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database');
    // Initialize database schema
    const schema = fs.readFileSync('./database/schema.sql').toString();
    db.exec(schema, (err) => {
      if (err) {
        console.error('Error initializing database schema:', err);
      } else {
        console.log('Database schema initialized');
      }
    });
  }
});

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// Make db available in routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Home route
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/auth/login');
  }
});

// Dashboard route (protected)
app.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  res.render('dashboard', { user: req.session.userId });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Something broke!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});