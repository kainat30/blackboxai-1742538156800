const express = require('express');
const { query, validationResult } = require('express-validator');
const Transaction = require('../models/transaction');
const Budget = require('../models/budget');
const config = require('../config');
const router = express.Router();

// Validation middleware for date range
const dateRangeValidation = [
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid start date format'),
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid end date format')
];

// Reports dashboard
router.get('/', (req, res) => {
    res.render('reports/index', {
        title: 'Financial Reports',
        categories: {
            income: config.INCOME_CATEGORIES,
            expense: config.EXPENSE_CATEGORIES
        }
    });
});

// Generate monthly report
router.get('/monthly', dateRangeValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const transactionModel = new Transaction(req.app.locals.db);
        const budgetModel = new Budget(req.app.locals.db);

        // Get the requested month or default to current month
        const date = req.query.date ? new Date(req.query.date) : new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        // Fetch monthly data
        const [monthlySummary, budgetOverview] = await Promise.all([
            transactionModel.getMonthlySummary(req.session.userId, year, month),
            budgetModel.getMonthlyOverview(req.session.userId)
        ]);

        // Calculate totals
        const totals = {
            income: 0,
            expense: 0,
            savings: 0
        };

        monthlySummary.forEach(item => {
            if (item.type === 'income') {
                totals.income += item.total;
            } else {
                totals.expense += item.total;
            }
        });
        totals.savings = totals.income - totals.expense;
        totals.savingsRate = totals.income > 0 
            ? ((totals.savings / totals.income) * 100).toFixed(1) 
            : 0;

        // Prepare report data
        const reportData = {
            period: {
                month: date.toLocaleString('default', { month: 'long' }),
                year: year
            },
            summary: {
                byCategory: monthlySummary,
                totals
            },
            budgets: budgetOverview
        };

        // If it's an AJAX request, return JSON
        if (req.xhr) {
            return res.json(reportData);
        }

        // Otherwise render the report
        res.render('reports/monthly', {
            title: 'Monthly Report',
            ...reportData
        });
    } catch (err) {
        console.error('Error generating monthly report:', err);
        res.status(500).json({ message: 'Error generating monthly report' });
    }
});

// Generate yearly report
router.get('/yearly', dateRangeValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const transactionModel = new Transaction(req.app.locals.db);
        
        // Get the requested year or default to current year
        const year = req.query.year || new Date().getFullYear();

        // Fetch yearly summary
        const yearlySummary = await transactionModel.getYearlySummary(
            req.session.userId,
            year
        );

        // Process data by month
        const monthlyData = Array(12).fill(0).map((_, index) => {
            const month = index + 1;
            const monthData = yearlySummary.filter(item => parseInt(item.month) === month);
            
            const income = monthData.find(item => item.type === 'income')?.total || 0;
            const expense = monthData.find(item => item.type === 'expense')?.total || 0;
            
            return {
                month: new Date(year, index).toLocaleString('default', { month: 'long' }),
                income,
                expense,
                savings: income - expense,
                savingsRate: income > 0 ? ((income - expense) / income * 100).toFixed(1) : 0
            };
        });

        // Calculate yearly totals
        const yearlyTotals = monthlyData.reduce((acc, month) => {
            acc.income += month.income;
            acc.expense += month.expense;
            acc.savings += month.savings;
            return acc;
        }, { income: 0, expense: 0, savings: 0 });

        yearlyTotals.savingsRate = yearlyTotals.income > 0 
            ? ((yearlyTotals.savings / yearlyTotals.income) * 100).toFixed(1)
            : 0;

        const reportData = {
            year,
            monthlyData,
            totals: yearlyTotals
        };

        // If it's an AJAX request, return JSON
        if (req.xhr) {
            return res.json(reportData);
        }

        // Otherwise render the report
        res.render('reports/yearly', {
            title: 'Yearly Report',
            ...reportData
        });
    } catch (err) {
        console.error('Error generating yearly report:', err);
        res.status(500).json({ message: 'Error generating yearly report' });
    }
});

// Generate custom date range report
router.get('/custom', dateRangeValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const transactionModel = new Transaction(req.app.locals.db);

        // Get transactions for the date range
        const transactions = await transactionModel.getAll(req.session.userId, {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            sortBy: 'date',
            sortOrder: 'ASC'
        });

        // Group transactions by category
        const categoryTotals = transactions.reduce((acc, transaction) => {
            const key = `${transaction.type}-${transaction.category}`;
            if (!acc[key]) {
                acc[key] = {
                    type: transaction.type,
                    category: transaction.category,
                    total: 0
                };
            }
            acc[key].total += transaction.amount;
            return acc;
        }, {});

        // Calculate totals
        const totals = transactions.reduce((acc, transaction) => {
            if (transaction.type === 'income') {
                acc.income += transaction.amount;
            } else {
                acc.expense += transaction.amount;
            }
            return acc;
        }, { income: 0, expense: 0 });

        totals.savings = totals.income - totals.expense;
        totals.savingsRate = totals.income > 0 
            ? ((totals.savings / totals.income) * 100).toFixed(1)
            : 0;

        const reportData = {
            dateRange: {
                start: req.query.startDate,
                end: req.query.endDate
            },
            transactions,
            categoryTotals: Object.values(categoryTotals),
            totals
        };

        // If it's an AJAX request, return JSON
        if (req.xhr) {
            return res.json(reportData);
        }

        // Otherwise render the report
        res.render('reports/custom', {
            title: 'Custom Report',
            ...reportData
        });
    } catch (err) {
        console.error('Error generating custom report:', err);
        res.status(500).json({ message: 'Error generating custom report' });
    }
});

// Export data to CSV
router.get('/export', dateRangeValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const transactionModel = new Transaction(req.app.locals.db);
        const csvData = await transactionModel.exportToCSV(req.session.userId, req.query);

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=transactions-${Date.now()}.csv`);
        res.send(csvData);
    } catch (err) {
        console.error('Error exporting data:', err);
        res.status(500).json({ message: 'Error exporting data' });
    }
});

module.exports = router;