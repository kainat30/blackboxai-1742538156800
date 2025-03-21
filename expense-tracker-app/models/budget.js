const config = require('../config');

class Budget {
    constructor(db) {
        this.db = db;
    }

    // Set or update a budget for a category
    setBudget(userId, category, monthlyLimit) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO budgets (user_id, category, monthly_limit)
                VALUES (?, ?, ?)
                ON CONFLICT(user_id, category) 
                DO UPDATE SET monthly_limit = ?
            `;
            
            this.db.run(query, [userId, category, monthlyLimit, monthlyLimit], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        category,
                        monthlyLimit
                    });
                }
            });
        });
    }

    // Get all budgets for a user
    getAllBudgets(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    b.id,
                    b.category,
                    b.monthly_limit,
                    COALESCE(SUM(CASE 
                        WHEN t.date >= date('now', 'start of month') 
                        AND t.date < date('now', 'start of month', '+1 month')
                        THEN t.amount 
                        ELSE 0 
                    END), 0) as current_spent
                FROM budgets b
                LEFT JOIN transactions t 
                    ON b.user_id = t.user_id 
                    AND b.category = t.category 
                    AND t.type = 'expense'
                WHERE b.user_id = ?
                GROUP BY b.id, b.category, b.monthly_limit
                ORDER BY b.category
            `;
            
            this.db.all(query, [userId], (err, budgets) => {
                if (err) {
                    reject(err);
                } else {
                    // Calculate percentage spent and alert status
                    const enrichedBudgets = budgets.map(budget => ({
                        ...budget,
                        percentageSpent: (budget.current_spent / budget.monthly_limit) * 100,
                        alertStatus: this.getAlertStatus(budget.current_spent, budget.monthly_limit)
                    }));
                    resolve(enrichedBudgets);
                }
            });
        });
    }

    // Get budget for a specific category
    getBudgetByCategory(userId, category) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    b.id,
                    b.category,
                    b.monthly_limit,
                    COALESCE(SUM(CASE 
                        WHEN t.date >= date('now', 'start of month') 
                        AND t.date < date('now', 'start of month', '+1 month')
                        THEN t.amount 
                        ELSE 0 
                    END), 0) as current_spent
                FROM budgets b
                LEFT JOIN transactions t 
                    ON b.user_id = t.user_id 
                    AND b.category = t.category 
                    AND t.type = 'expense'
                WHERE b.user_id = ? AND b.category = ?
                GROUP BY b.id, b.category, b.monthly_limit
            `;
            
            this.db.get(query, [userId, category], (err, budget) => {
                if (err) {
                    reject(err);
                } else if (budget) {
                    // Calculate percentage spent and alert status
                    budget.percentageSpent = (budget.current_spent / budget.monthly_limit) * 100;
                    budget.alertStatus = this.getAlertStatus(budget.current_spent, budget.monthly_limit);
                    resolve(budget);
                } else {
                    resolve(null);
                }
            });
        });
    }

    // Delete a budget
    deleteBudget(userId, category) {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM budgets WHERE user_id = ? AND category = ?';
            
            this.db.run(query, [userId, category], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    // Get alert status based on current spending
    getAlertStatus(currentSpent, monthlyLimit) {
        const percentageSpent = (currentSpent / monthlyLimit) * 100;
        
        if (percentageSpent >= 100) {
            return {
                level: 'danger',
                message: 'Budget exceeded!'
            };
        } else if (percentageSpent >= config.BUDGET_ALERT_THRESHOLD) {
            return {
                level: 'warning',
                message: `${config.BUDGET_ALERT_THRESHOLD}% of budget reached`
            };
        }
        return {
            level: 'safe',
            message: 'Within budget'
        };
    }

    // Get all categories that exceed budget threshold
    getExceededBudgets(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    b.category,
                    b.monthly_limit,
                    COALESCE(SUM(t.amount), 0) as current_spent,
                    (COALESCE(SUM(t.amount), 0) / b.monthly_limit * 100) as percentage_spent
                FROM budgets b
                LEFT JOIN transactions t 
                    ON b.user_id = t.user_id 
                    AND b.category = t.category 
                    AND t.type = 'expense'
                    AND t.date >= date('now', 'start of month')
                    AND t.date < date('now', 'start of month', '+1 month')
                WHERE b.user_id = ?
                GROUP BY b.category, b.monthly_limit
                HAVING percentage_spent >= ?
                ORDER BY percentage_spent DESC
            `;
            
            this.db.all(query, [userId, config.BUDGET_ALERT_THRESHOLD], (err, budgets) => {
                if (err) {
                    reject(err);
                } else {
                    // Enrich with alert status
                    const exceededBudgets = budgets.map(budget => ({
                        ...budget,
                        alertStatus: this.getAlertStatus(budget.current_spent, budget.monthly_limit)
                    }));
                    resolve(exceededBudgets);
                }
            });
        });
    }

    // Get monthly budget overview
    getMonthlyOverview(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                WITH monthly_spending AS (
                    SELECT 
                        category,
                        SUM(amount) as spent
                    FROM transactions
                    WHERE user_id = ?
                        AND type = 'expense'
                        AND date >= date('now', 'start of month')
                        AND date < date('now', 'start of month', '+1 month')
                    GROUP BY category
                )
                SELECT 
                    b.category,
                    b.monthly_limit,
                    COALESCE(ms.spent, 0) as spent,
                    (b.monthly_limit - COALESCE(ms.spent, 0)) as remaining
                FROM budgets b
                LEFT JOIN monthly_spending ms ON b.category = ms.category
                WHERE b.user_id = ?
                ORDER BY b.category
            `;
            
            this.db.all(query, [userId, userId], (err, overview) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(overview);
                }
            });
        });
    }
}

module.exports = Budget;