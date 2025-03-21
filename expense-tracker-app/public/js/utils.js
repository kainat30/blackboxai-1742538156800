// Data Transformations
const DataTransformer = {
    // Group transactions by category
    groupByCategory(transactions) {
        return transactions.reduce((acc, transaction) => {
            const key = `${transaction.type}-${transaction.category}`;
            if (!acc[key]) {
                acc[key] = {
                    type: transaction.type,
                    category: transaction.category,
                    total: 0,
                    count: 0,
                    transactions: []
                };
            }
            acc[key].total += transaction.amount;
            acc[key].count += 1;
            acc[key].transactions.push(transaction);
            return acc;
        }, {});
    },

    // Group transactions by date
    groupByDate(transactions, grouping = 'month') {
        return transactions.reduce((acc, transaction) => {
            const date = new Date(transaction.date);
            let key;
            
            switch (grouping) {
                case 'day':
                    key = date.toISOString().split('T')[0];
                    break;
                case 'month':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                case 'year':
                    key = date.getFullYear().toString();
                    break;
                default:
                    key = date.toISOString().split('T')[0];
            }

            if (!acc[key]) {
                acc[key] = {
                    date: key,
                    income: 0,
                    expense: 0,
                    transactions: []
                };
            }

            if (transaction.type === 'income') {
                acc[key].income += transaction.amount;
            } else {
                acc[key].expense += transaction.amount;
            }

            acc[key].transactions.push(transaction);
            return acc;
        }, {});
    },

    // Calculate financial metrics
    calculateMetrics(transactions) {
        const metrics = {
            income: 0,
            expense: 0,
            savings: 0,
            savingsRate: 0,
            categories: {},
            trends: []
        };

        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                metrics.income += transaction.amount;
            } else {
                metrics.expense += transaction.amount;
            }

            const categoryKey = `${transaction.type}-${transaction.category}`;
            if (!metrics.categories[categoryKey]) {
                metrics.categories[categoryKey] = {
                    type: transaction.type,
                    category: transaction.category,
                    total: 0,
                    count: 0
                };
            }
            metrics.categories[categoryKey].total += transaction.amount;
            metrics.categories[categoryKey].count += 1;
        });

        metrics.savings = metrics.income - metrics.expense;
        metrics.savingsRate = metrics.income > 0 
            ? ((metrics.savings / metrics.income) * 100).toFixed(1) 
            : 0;

        return metrics;
    }
};

// Budget Calculations
const BudgetCalculator = {
    // Calculate budget progress
    calculateProgress(budget, spent) {
        const progress = {
            spent: spent,
            remaining: budget - spent,
            percentage: ((spent / budget) * 100).toFixed(1),
            status: 'safe'
        };

        if (spent >= budget) {
            progress.status = 'exceeded';
        } else if (spent >= budget * 0.8) {
            progress.status = 'warning';
        }

        return progress;
    },

    // Get budget status message
    getStatusMessage(progress) {
        switch (progress.status) {
            case 'exceeded':
                return 'Budget exceeded';
            case 'warning':
                return 'Approaching budget limit';
            default:
                return 'Within budget';
        }
    },

    // Calculate budget recommendations
    calculateRecommendations(income, expenses, categories) {
        const recommendations = [];
        const totalExpenses = Object.values(expenses).reduce((sum, exp) => sum + exp, 0);
        
        // Check overall spending
        if (totalExpenses > income * 0.9) {
            recommendations.push({
                type: 'warning',
                message: 'Total expenses are too high relative to income',
                action: 'Consider reducing non-essential expenses'
            });
        }

        // Check individual category spending
        Object.entries(categories).forEach(([category, amount]) => {
            const percentageOfTotal = (amount / totalExpenses) * 100;
            if (percentageOfTotal > 30) {
                recommendations.push({
                    type: 'info',
                    message: `${category} spending is ${percentageOfTotal.toFixed(1)}% of total expenses`,
                    action: 'Consider setting a budget for this category'
                });
            }
        });

        return recommendations;
    }
};

// Date Utilities
const DateUtils = {
    // Get date range for period
    getDateRange(period = 'month', date = new Date()) {
        const start = new Date(date);
        const end = new Date(date);

        switch (period) {
            case 'week':
                start.setDate(start.getDate() - start.getDay());
                end.setDate(end.getDate() + (6 - end.getDay()));
                break;
            case 'month':
                start.setDate(1);
                end.setMonth(end.getMonth() + 1);
                end.setDate(0);
                break;
            case 'year':
                start.setMonth(0, 1);
                end.setMonth(11, 31);
                break;
            case 'quarter':
                const quarter = Math.floor(date.getMonth() / 3);
                start.setMonth(quarter * 3, 1);
                end.setMonth(quarter * 3 + 3, 0);
                break;
        }

        return { start, end };
    },

    // Format date range for display
    formatDateRange(start, end) {
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (startDate.getMonth() === endDate.getMonth() && startDate.getYear() === endDate.getYear()) {
            return `${startDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}`;
        }

        return `${startDate.toLocaleDateString('default', { month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('default', { month: 'short', year: 'numeric' })}`;
    },

    // Get relative date description
    getRelativeDate(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        if (days < 365) return `${Math.floor(days / 30)} months ago`;
        return `${Math.floor(days / 365)} years ago`;
    }
};

// Export utilities
window.DataTransformer = DataTransformer;
window.BudgetCalculator = BudgetCalculator;
window.DateUtils = DateUtils;