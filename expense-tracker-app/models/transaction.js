class Transaction {
    constructor(db) {
        this.db = db;
    }

    // Create a new transaction
    create(userId, data) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO transactions (
                    user_id, type, category, amount, 
                    description, date
                ) VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                userId,
                data.type,
                data.category,
                data.amount,
                data.description,
                data.date
            ];

            this.db.run(query, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        ...data
                    });
                }
            });
        });
    }

    // Get all transactions for a user with optional filters
    getAll(userId, filters = {}) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT 
                    id, type, category, amount, 
                    description, date, created_at
                FROM transactions 
                WHERE user_id = ?
            `;
            
            const params = [userId];

            // Add filters if provided
            if (filters.type) {
                query += ' AND type = ?';
                params.push(filters.type);
            }

            if (filters.category) {
                query += ' AND category = ?';
                params.push(filters.category);
            }

            if (filters.startDate) {
                query += ' AND date >= ?';
                params.push(filters.startDate);
            }

            if (filters.endDate) {
                query += ' AND date <= ?';
                params.push(filters.endDate);
            }

            if (filters.minAmount) {
                query += ' AND amount >= ?';
                params.push(filters.minAmount);
            }

            if (filters.maxAmount) {
                query += ' AND amount <= ?';
                params.push(filters.maxAmount);
            }

            // Add search term if provided
            if (filters.search) {
                query += ' AND (description LIKE ? OR category LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm);
            }

            // Add sorting
            query += ` ORDER BY ${filters.sortBy || 'date'} ${filters.sortOrder || 'DESC'}`;

            this.db.all(query, params, (err, transactions) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(transactions);
                }
            });
        });
    }

    // Get a single transaction by ID
    getById(userId, transactionId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM transactions 
                WHERE id = ? AND user_id = ?
            `;
            
            this.db.get(query, [transactionId, userId], (err, transaction) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(transaction);
                }
            });
        });
    }

    // Update a transaction
    update(userId, transactionId, updates) {
        return new Promise((resolve, reject) => {
            const allowedUpdates = ['type', 'category', 'amount', 'description', 'date'];
            const updateFields = [];
            const updateValues = [];

            // Build update query dynamically
            Object.keys(updates).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    updateFields.push(`${key} = ?`);
                    updateValues.push(updates[key]);
                }
            });

            if (updateFields.length === 0) {
                return resolve(null);
            }

            updateValues.push(transactionId, userId);
            const query = `
                UPDATE transactions 
                SET ${updateFields.join(', ')}
                WHERE id = ? AND user_id = ?
            `;

            this.db.run(query, updateValues, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    // Delete a transaction
    delete(userId, transactionId) {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM transactions WHERE id = ? AND user_id = ?';
            
            this.db.run(query, [transactionId, userId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    // Get monthly summary
    getMonthlySummary(userId, year, month) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    type,
                    category,
                    SUM(amount) as total
                FROM transactions
                WHERE user_id = ?
                AND strftime('%Y', date) = ?
                AND strftime('%m', date) = ?
                GROUP BY type, category
                ORDER BY type, total DESC
            `;

            const monthStr = month.toString().padStart(2, '0');
            
            this.db.all(query, [userId, year.toString(), monthStr], (err, summary) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(summary);
                }
            });
        });
    }

    // Get yearly summary
    getYearlySummary(userId, year) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    strftime('%m', date) as month,
                    type,
                    SUM(amount) as total
                FROM transactions
                WHERE user_id = ?
                AND strftime('%Y', date) = ?
                GROUP BY month, type
                ORDER BY month, type
            `;
            
            this.db.all(query, [userId, year.toString()], (err, summary) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(summary);
                }
            });
        });
    }

    // Export transactions to CSV format
    exportToCSV(userId, filters = {}) {
        return this.getAll(userId, filters)
            .then(transactions => {
                const header = 'Date,Type,Category,Amount,Description\n';
                const rows = transactions.map(t => {
                    return `${t.date},${t.type},${t.category},${t.amount},"${t.description || ''}"`
                }).join('\n');
                return header + rows;
            });
    }
}

module.exports = Transaction;