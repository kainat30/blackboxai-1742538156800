const path = require('path');

const config = {
    // Server configuration
    PORT: process.env.PORT || 8000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Session configuration
    SESSION_SECRET: process.env.SESSION_SECRET || 'your-secret-key-here',
    SESSION_NAME: 'expense_tracker_session',
    SESSION_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours

    // Database configuration
    DB_PATH: path.join(__dirname, 'database', 'expense_tracker.db'),

    // Password hashing
    SALT_ROUNDS: 10,

    // Categories
    EXPENSE_CATEGORIES: [
        'Food', 'Transportation', 'Utilities', 'Rent', 
        'Shopping', 'Entertainment', 'Healthcare', 
        'Education', 'Travel', 'Other Expenses'
    ],
    
    INCOME_CATEGORIES: [
        'Salary', 'Freelance', 'Investments', 'Other Income'
    ],

    // Budget alert threshold (percentage)
    BUDGET_ALERT_THRESHOLD: 80
};

module.exports = config;