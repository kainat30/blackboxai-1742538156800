const bcrypt = require('bcryptjs');
const config = require('../config');

class User {
    constructor(db) {
        this.db = db;
    }

    // Create a new user
    async create(username, email, password) {
        try {
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, config.SALT_ROUNDS);
            
            return new Promise((resolve, reject) => {
                const query = `
                    INSERT INTO users (username, email, password)
                    VALUES (?, ?, ?)
                `;
                
                this.db.run(query, [username, email, hashedPassword], function(err) {
                    if (err) {
                        if (err.message.includes('UNIQUE constraint failed')) {
                            reject(new Error('Username or email already exists'));
                        } else {
                            reject(err);
                        }
                    } else {
                        resolve({
                            id: this.lastID,
                            username,
                            email
                        });
                    }
                });
            });
        } catch (err) {
            throw err;
        }
    }

    // Find user by email
    findByEmail(email) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM users WHERE email = ?';
            
            this.db.get(query, [email], (err, user) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(user);
                }
            });
        });
    }

    // Find user by ID
    findById(id) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT id, username, email, created_at FROM users WHERE id = ?';
            
            this.db.get(query, [id], (err, user) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(user);
                }
            });
        });
    }

    // Verify password
    async verifyPassword(password, hashedPassword) {
        try {
            return await bcrypt.compare(password, hashedPassword);
        } catch (err) {
            throw err;
        }
    }

    // Update user profile
    update(userId, updates) {
        return new Promise(async (resolve, reject) => {
            try {
                const allowedUpdates = ['username', 'email'];
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

                updateValues.push(userId);
                const query = `
                    UPDATE users 
                    SET ${updateFields.join(', ')}
                    WHERE id = ?
                `;

                this.db.run(query, updateValues, function(err) {
                    if (err) {
                        if (err.message.includes('UNIQUE constraint failed')) {
                            reject(new Error('Username or email already exists'));
                        } else {
                            reject(err);
                        }
                    } else {
                        resolve(true);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    // Change password
    async changePassword(userId, currentPassword, newPassword) {
        try {
            // First verify current password
            const user = await new Promise((resolve, reject) => {
                this.db.get('SELECT password FROM users WHERE id = ?', [userId], (err, user) => {
                    if (err) reject(err);
                    else resolve(user);
                });
            });

            if (!user) {
                throw new Error('User not found');
            }

            const isValid = await this.verifyPassword(currentPassword, user.password);
            if (!isValid) {
                throw new Error('Current password is incorrect');
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, config.SALT_ROUNDS);

            // Update password
            return new Promise((resolve, reject) => {
                const query = 'UPDATE users SET password = ? WHERE id = ?';
                this.db.run(query, [hashedPassword, userId], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        } catch (err) {
            throw err;
        }
    }

    // Delete user account
    delete(userId) {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM users WHERE id = ?';
            
            this.db.run(query, [userId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }
}

module.exports = User;