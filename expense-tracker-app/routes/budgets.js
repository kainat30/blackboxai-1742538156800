const express = require('express');
const { body, validationResult } = require('express-validator');
const Budget = require('../models/budget');
const config = require('../config');
const router = express.Router();

// Validation middleware
const budgetValidation = [
    body('category')
        .notEmpty()
        .withMessage('Category is required')
        .custom(value => {
            return config.EXPENSE_CATEGORIES.includes(value);
        })
        .withMessage('Invalid category'),
    body('monthlyLimit')
        .isFloat({ min: 0.01 })
        .withMessage('Monthly limit must be greater than 0')
];

// List all budgets
router.get('/', async (req, res) => {
    try {
        const budgetModel = new Budget(req.app.locals.db);
        const budgets = await budgetModel.getAllBudgets(req.session.userId);

        // Calculate total monthly budget
        const totalBudget = budgets.reduce((sum, budget) => sum + budget.monthly_limit, 0);
        const totalSpent = budgets.reduce((sum, budget) => sum + budget.current_spent, 0);

        // If it's an AJAX request, return JSON
        if (req.xhr) {
            return res.json({
                budgets,
                totalBudget,
                totalSpent
            });
        }

        // Otherwise render the page
        res.render('budgets/index', {
            title: 'Budget Management',
            budgets,
            categories: config.EXPENSE_CATEGORIES,
            totalBudget,
            totalSpent,
            errors: [],
            success: req.query.success
        });
    } catch (err) {
        console.error('Error fetching budgets:', err);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error loading budgets'
        });
    }
});

// Show budget form
router.get('/new', (req, res) => {
    res.render('budgets/new', {
        title: 'Set New Budget',
        categories: config.EXPENSE_CATEGORIES,
        errors: [],
        formData: {}
    });
});

// Create or update budget
router.post('/', budgetValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            if (req.xhr) {
                return res.status(400).json({ errors: errors.array() });
            }
            return res.render('budgets/new', {
                title: 'Set New Budget',
                categories: config.EXPENSE_CATEGORIES,
                errors: errors.array(),
                formData: req.body
            });
        }

        const budgetModel = new Budget(req.app.locals.db);
        await budgetModel.setBudget(
            req.session.userId,
            req.body.category,
            parseFloat(req.body.monthlyLimit)
        );

        if (req.xhr) {
            return res.json({ message: 'Budget set successfully' });
        }

        res.redirect('/budgets?success=true');
    } catch (err) {
        console.error('Error setting budget:', err);
        if (req.xhr) {
            return res.status(500).json({ message: 'Error setting budget' });
        }
        res.status(500).render('budgets/new', {
            title: 'Set New Budget',
            categories: config.EXPENSE_CATEGORIES,
            errors: [{ msg: 'Error setting budget' }],
            formData: req.body
        });
    }
});

// Get specific budget
router.get('/:category', async (req, res) => {
    try {
        const budgetModel = new Budget(req.app.locals.db);
        const budget = await budgetModel.getBudgetByCategory(
            req.session.userId,
            req.params.category
        );

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        res.json(budget);
    } catch (err) {
        console.error('Error fetching budget:', err);
        res.status(500).json({ message: 'Error fetching budget' });
    }
});

// Update specific budget
router.put('/:category', budgetValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const budgetModel = new Budget(req.app.locals.db);
        await budgetModel.setBudget(
            req.session.userId,
            req.params.category,
            parseFloat(req.body.monthlyLimit)
        );

        res.json({ message: 'Budget updated successfully' });
    } catch (err) {
        console.error('Error updating budget:', err);
        res.status(500).json({ message: 'Error updating budget' });
    }
});

// Delete budget
router.delete('/:category', async (req, res) => {
    try {
        const budgetModel = new Budget(req.app.locals.db);
        await budgetModel.deleteBudget(req.session.userId, req.params.category);

        res.json({ message: 'Budget deleted successfully' });
    } catch (err) {
        console.error('Error deleting budget:', err);
        res.status(500).json({ message: 'Error deleting budget' });
    }
});

// Get budget alerts
router.get('/alerts/exceeded', async (req, res) => {
    try {
        const budgetModel = new Budget(req.app.locals.db);
        const exceededBudgets = await budgetModel.getExceededBudgets(req.session.userId);

        res.json(exceededBudgets);
    } catch (err) {
        console.error('Error fetching budget alerts:', err);
        res.status(500).json({ message: 'Error fetching budget alerts' });
    }
});

// Get monthly budget overview
router.get('/overview/monthly', async (req, res) => {
    try {
        const budgetModel = new Budget(req.app.locals.db);
        const overview = await budgetModel.getMonthlyOverview(req.session.userId);

        // Calculate totals
        const totals = overview.reduce((acc, curr) => {
            acc.budgeted += curr.monthly_limit;
            acc.spent += curr.spent;
            acc.remaining += curr.remaining;
            return acc;
        }, { budgeted: 0, spent: 0, remaining: 0 });

        res.json({
            categories: overview,
            totals
        });
    } catch (err) {
        console.error('Error fetching budget overview:', err);
        res.status(500).json({ message: 'Error fetching budget overview' });
    }
});

module.exports = router;