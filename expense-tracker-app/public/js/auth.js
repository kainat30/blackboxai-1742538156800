// Authentication State Manager
const AuthManager = {
    // Check if user is authenticated
    isAuthenticated() {
        return !!localStorage.getItem('authToken');
    },

    // Get authentication token
    getToken() {
        return localStorage.getItem('authToken');
    },

    // Set authentication token
    setToken(token) {
        localStorage.setItem('authToken', token);
    },

    // Remove authentication token
    removeToken() {
        localStorage.removeItem('authToken');
    },

    // Get user data
    getUserData() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    },

    // Set user data
    setUserData(data) {
        localStorage.setItem('userData', JSON.stringify(data));
    },

    // Remove user data
    removeUserData() {
        localStorage.removeItem('userData');
    },

    // Handle logout
    logout() {
        this.removeToken();
        this.removeUserData();
        window.location.href = '/login';
    }
};

// Authentication API Requests
const AuthAPI = {
    // Login request
    async login(email, password) {
        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            AuthManager.setToken(data.token);
            AuthManager.setUserData(data.user);

            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    },

    // Register request
    async register(userData) {
        try {
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    },

    // Password reset request
    async requestPasswordReset(email) {
        try {
            const response = await fetch('/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Password reset request failed');
            }

            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    },

    // Reset password with token
    async resetPassword(token, newPassword) {
        try {
            const response = await fetch('/auth/reset-password/' + token, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password: newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Password reset failed');
            }

            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    },

    // Update profile
    async updateProfile(profileData) {
        try {
            const response = await fetch('/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AuthManager.getToken()}`
                },
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Profile update failed');
            }

            AuthManager.setUserData(data.user);
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    },

    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await fetch('/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AuthManager.getToken()}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Password change failed');
            }

            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }
};

// Authentication Form Handlers
const AuthForms = {
    // Initialize login form
    initLoginForm() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = form.querySelector('[name="email"]').value;
            const password = form.querySelector('[name="password"]').value;
            
            const result = await AuthAPI.login(email, password);
            
            if (result.success) {
                window.location.href = '/dashboard';
            } else {
                Toast.show(result.error, 'error');
            }
        });
    },

    // Initialize registration form
    initRegisterForm() {
        const form = document.getElementById('registerForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const userData = Object.fromEntries(formData.entries());
            
            const result = await AuthAPI.register(userData);
            
            if (result.success) {
                Toast.show('Registration successful! Please log in.', 'success');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                Toast.show(result.error, 'error');
            }
        });
    },

    // Initialize password reset form
    initPasswordResetForm() {
        const form = document.getElementById('passwordResetForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = form.querySelector('[name="email"]').value;
            
            const result = await AuthAPI.requestPasswordReset(email);
            
            if (result.success) {
                Toast.show('Password reset instructions sent to your email.', 'success');
                form.reset();
            } else {
                Toast.show(result.error, 'error');
            }
        });
    }
};

// Initialize auth functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize forms
    AuthForms.initLoginForm();
    AuthForms.initRegisterForm();
    AuthForms.initPasswordResetForm();

    // Handle logout button clicks
    document.querySelectorAll('[data-logout]').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            AuthManager.logout();
        });
    });
});

// Export auth utilities
window.AuthManager = AuthManager;
window.AuthAPI = AuthAPI;