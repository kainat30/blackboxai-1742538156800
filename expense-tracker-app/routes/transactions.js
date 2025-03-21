const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Transaction = require('../models/transaction');
const Budget = require('../models/budget');
const config = require('../config');
const router = express.Router();

// Validation middleware
const transactionValidation = [
    body('type')
        .isIn(['income', 'expense'])
        .withMessage('Transaction type must be either income or expense'),
    body('category')
        .notEmpty()
        .withMessage('Category is required')
        .custom((value, { req }) => {
            const categories = req.body.type === 'income' 
                ? config.INCOME_CATEGORIES 
                : config.EXPENSE_CATEGORIES;
            return categories.includes(value);
        })
        .withMessage('Invalid category'),
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be greater than 0'),
    body('date')
        .isISO8601()
        .withMessage('Invalid date format'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Description must not exceed 255 characters')
];

// List transactions with filters
router.get('/', [
    query('type').optional().isIn(['income', 'expense']),
    query('category').optional(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('minAmount').optional().isFloat(),
    query('maxAmount').optional().isFloat(),
    query('search').optional().trim(),
    query('sortBy').optional().isIn(['date', 'amount', 'category']),
    query('sortOrder').optional().isIn(['ASC', 'DESC'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const transactionModel = new Transaction(req.app.locals.db);
        const transactions = await transactionModel.getAll(req.session.userId, req.query);

        // If it's an AJAX request, return JSON
        if (req.xhr) {
            return res.json(transactions);
        }

        // Otherwise render the page
        res.render('transactions/index', {
            title: 'Transactions',
            transactions,
            filters: req.query,
            categories: {
                income: config.INCOME_CATEGORIES,
                expense: config.EXPENSE_CATEGORIES
            }
        });
    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error loading transactions'
        });
    }
});

// Show transaction form
router.get('/new', (req, res) => {
    res.render('transactions/new', {
        title: 'New Transaction',
        categories: {
            income: config.INCOME_CATEGORIES,
            expense: config.EXPENSE_CATEGORIES
        },
        errors: [],
        formData: {}
    });
});

// Create new transaction
router.post('/', transactionValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('transactions/new', {
                title: 'New Transaction',
                categories: {
                    income: config.INCOME_CATEGORIES,
                    expense: config.EXPENSE_CATEGORIES
                },
                errors: errors.array(),
                formData: req.body
            });
        }

        const transactionModel = new Transaction(req.app.locals.db);
        await transactionModel.create(req.session.userId, req.body);

        // If it's an expense, check budget
        if (req.body.type === 'expense') {
            const budgetModel = new Budget(req.app.locals.db);
            const budget = await budgetModel.getBudgetByCategory(req.session.userId, req.body.category);
            
            if (budget && budget.alertStatus.level !== 'safe') {
                req.session.flash = {
                    type: budget.alertStatus.level,
                    message: `Budget Alert: ${budget.alertStatus.message} for ${req.body.category}`
                };
            }
        }

        // If it's an AJAX request, return success response
        if (req.xhr) {
            return res.json({ message: 'Transaction created successfully' });
        }

        res.redirect('/transactions');
    } catch (err) {
        console.error('Error creating transaction:', err);
        res.status(500).render('transactions/new', {
            title: 'New Transaction',
            categories: {
                income: config.INCOME_CATEGORIES,
                expense: config.EXPENSE_CATEGORIES
            },
            errors: [{ msg: 'Error creating transaction' }],
            formData: req.body
        });
    }
});

// Show edit form
router.get('/:id/edit', async (req, res) => {
    try {
        const transactionModel = new Transaction(req.app.locals.db);
        const transaction = await transactionModel.getById(req.session.userId, req.params.id);

        if (!transaction) {
            return res.status(404).render('error', {
                title: 'Error',
                message: 'Transaction not found'
            });
        }

        res.render('transactions/edit', {
            title: 'Edit Transaction',
            transaction,
            categories: {
                income: config.INCOME_CATEGORIES,
                expense: config.EXPENSE_CATEGORIES
            },
            errors: []
        });
    } catch (err) {
        console.error('Error fetching transaction:', err);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error loading transaction'
        });
    }
});

// Update transaction
router.put('/:id', transactionValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const transactionModel = new Transaction(req.app.locals.db);
        const success = await transactionModel.update(req.session.userId, req.params.id, req.body);

        if (!success) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json({ message: 'Transaction updated successfully' });
    } catch (err) {
        console.error('Error updating transaction:', err);
        res.status(500).json({ message: 'Error updating transaction' });
    }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
    try {
        const transactionModel = new Transaction(req.app.locals.db);
        const success = await transactionModel.delete(req.session.userId, req.params.id);

        if (!success) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json({ message: 'Transaction deleted successfully' });
    } catch (err) {
        console.error('Error deleting transaction:', err);
        res.status(500).json({ message: 'Error deleting transaction' });
    }
});

// Export transactions
router.get('/export', async (req, res) => {
    try {
        const transactionModel = new Transaction(req.app.locals.db);
        const csvData = await transactionModel.exportToCSV(req.session.userId, req.query);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
        res.send(csvData);
    } catch (err) {
        console.error('Error exporting transactions:', err);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error exporting transactions'
        });
    }
});

module.exports = router;