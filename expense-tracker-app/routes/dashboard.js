const express = require('express');
const Transaction = require('../models/transaction');
const Budget = require('../models/budget');
const router = express.Router();

// Helper function to get current month's name
const getCurrentMonth = () => {
    return new Date().toLocaleString('default', { month: 'long' });
};

// Helper function to get current year
const getCurrentYear = () => {
    return new Date().getFullYear();
};

// Helper function to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
};

// Dashboard home
router.get('/', async (req, res) => {
    try {
        const transactionModel = new Transaction(req.app.locals.db);
        const budgetModel = new Budget(req.app.locals.db);

        // Get current month and year
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = getCurrentYear();

        // Fetch monthly summary
        const monthlySummary = await transactionModel.getMonthlySummary(
            req.session.userId,
            currentYear,
            currentMonth
        );

        // Calculate totals
        let monthlyIncome = 0;
        let monthlyExpense = 0;
        monthlySummary.forEach(item => {
            if (item.type === 'income') {
                monthlyIncome += item.total;
            } else {
                monthlyExpense += item.total;
            }
        });

        // Get budget overview
        const budgetOverview = await budgetModel.getMonthlyOverview(req.session.userId);

        // Get exceeded budgets for alerts
        const exceededBudgets = await budgetModel.getExceededBudgets(req.session.userId);

        // Get yearly summary for trends
        const yearlySummary = await transactionModel.getYearlySummary(
            req.session.userId,
            currentYear
        );

        // Prepare chart data
        const expensesByCategory = monthlySummary
            .filter(item => item.type === 'expense')
            .map(item => ({
                category: item.category,
                amount: item.total
            }));

        const monthlyTrends = Array(12).fill(0).map((_, index) => {
            const month = index + 1;
            const monthData = yearlySummary.filter(item => parseInt(item.month) === month);
            
            return {
                month: new Date(currentYear, index).toLocaleString('default', { month: 'short' }),
                income: monthData.find(item => item.type === 'income')?.total || 0,
                expense: monthData.find(item => item.type === 'expense')?.total || 0
            };
        });

        // Get recent transactions
        const recentTransactions = await transactionModel.getAll(req.session.userId, {
            limit: 5,
            sortBy: 'date',
            sortOrder: 'DESC'
        });

        // Calculate savings rate
        const savingsRate = monthlyIncome > 0 
            ? ((monthlyIncome - monthlyExpense) / monthlyIncome * 100).toFixed(1)
            : 0;

        // Prepare dashboard data
        const dashboardData = {
            title: 'Dashboard',
            currentMonth: getCurrentMonth(),
            currentYear,
            summary: {
                income: monthlyIncome,
                expense: monthlyExpense,
                balance: monthlyIncome - monthlyExpense,
                savingsRate
            },
            budgets: {
                overview: budgetOverview,
                exceeded: exceededBudgets
            },
            charts: {
                expensesByCategory,
                monthlyTrends
            },
            recentTransactions,
            formatCurrency
        };

        // If it's an AJAX request, return JSON
        if (req.xhr) {
            return res.json(dashboardData);
        }

        // Otherwise render the dashboard
        res.render('dashboard', dashboardData);
    } catch (err) {
        console.error('Error loading dashboard:', err);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error loading dashboard'
        });
    }
});

// Get updated dashboard data (for AJAX refresh)
router.get('/refresh', async (req, res) => {
    try {
        const transactionModel = new Transaction(req.app.locals.db);
        const budgetModel = new Budget(req.app.locals.db);

        // Get current month and year
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = getCurrentYear();

        // Fetch updated summary
        const monthlySummary = await transactionModel.getMonthlySummary(
            req.session.userId,
            currentYear,
            currentMonth
        );

        // Get updated budget alerts
        const exceededBudgets = await budgetModel.getExceededBudgets(req.session.userId);

        // Get updated recent transactions
        const recentTransactions = await transactionModel.getAll(req.session.userId, {
            limit: 5,
            sortBy: 'date',
            sortOrder: 'DESC'
        });

        res.json({
            summary: monthlySummary,
            budgetAlerts: exceededBudgets,
            recentTransactions
        });
    } catch (err) {
        console.error('Error refreshing dashboard:', err);
        res.status(500).json({ error: 'Error refreshing dashboard data' });
    }
});

// Get chart data
router.get('/charts/:type', async (req, res) => {
    try {
        const transactionModel = new Transaction(req.app.locals.db);
        const currentYear = getCurrentYear();
        let data;

        switch (req.params.type) {
            case 'monthly-trends':
                data = await transactionModel.getYearlySummary(req.session.userId, currentYear);
                break;
            
            case 'category-breakdown':
                const currentMonth = new Date().getMonth() + 1;
                data = await transactionModel.getMonthlySummary(
                    req.session.userId,
                    currentYear,
                    currentMonth
                );
                break;

            default:
                return res.status(400).json({ error: 'Invalid chart type' });
        }

        res.json(data);
    } catch (err) {
        console.error('Error fetching chart data:', err);
        res.status(500).json({ error: 'Error fetching chart data' });
    }
});

// Get budget status
router.get('/budget-status', async (req, res) => {
    try {
        const budgetModel = new Budget(req.app.locals.db);
        const budgets = await budgetModel.getAllBudgets(req.session.userId);

        res.json(budgets);
    } catch (err) {
        console.error('Error fetching budget status:', err);
        res.status(500).json({ error: 'Error fetching budget status' });
    }
});

module.exports = router;