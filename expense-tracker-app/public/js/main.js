// Toast Notification System
const Toast = {
    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast fade-in ${type}`;
        
        const icon = document.createElement('i');
        switch (type) {
            case 'success':
                icon.className = 'fas fa-check-circle text-green-500 mr-2';
                break;
            case 'error':
                icon.className = 'fas fa-exclamation-circle text-red-500 mr-2';
                break;
            case 'warning':
                icon.className = 'fas fa-exclamation-triangle text-yellow-500 mr-2';
                break;
            default:
                icon.className = 'fas fa-info-circle text-blue-500 mr-2';
        }

        const text = document.createElement('span');
        text.textContent = message;

        toast.appendChild(icon);
        toast.appendChild(text);
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

// Form Validation
const FormValidator = {
    validateForm(form) {
        let isValid = true;
        const errors = [];

        // Required fields
        form.querySelectorAll('[required]').forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                errors.push(`${field.name} is required`);
                this.showFieldError(field, `${field.name} is required`);
            } else {
                this.clearFieldError(field);
            }
        });

        // Email validation
        form.querySelectorAll('input[type="email"]').forEach(field => {
            if (field.value && !this.isValidEmail(field.value)) {
                isValid = false;
                errors.push('Invalid email address');
                this.showFieldError(field, 'Invalid email address');
            }
        });

        // Password validation
        const password = form.querySelector('input[type="password"]');
        if (password && password.value) {
            if (!this.isValidPassword(password.value)) {
                isValid = false;
                errors.push('Password must be at least 6 characters and contain at least one number');
                this.showFieldError(password, 'Password must be at least 6 characters and contain at least one number');
            }
        }

        return { isValid, errors };
    },

    showFieldError(field, message) {
        field.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-500 text-sm mt-1';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    },

    clearFieldError(field) {
        field.classList.remove('error');
        const errorDiv = field.parentNode.querySelector('.text-red-500');
        if (errorDiv) {
            errorDiv.remove();
        }
    },

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    isValidPassword(password) {
        return password.length >= 6 && /\d/.test(password);
    }
};

// Currency Formatter
const CurrencyFormatter = {
    format(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },

    parse(value) {
        return parseFloat(value.replace(/[^\d.-]/g, ''));
    }
};

// Date Formatter
const DateFormatter = {
    format(date, format = 'short') {
        const d = new Date(date);
        switch (format) {
            case 'full':
                return d.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            case 'medium':
                return d.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            default:
                return d.toLocaleDateString('en-US');
        }
    }
};

// API Request Handler
const API = {
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(endpoint, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: error.message };
        }
    },

    async get(endpoint) {
        return this.request(endpoint);
    },

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
};

// Chart Helpers
const ChartHelpers = {
    colors: {
        income: '#10B981',
        expense: '#EF4444',
        savings: '#3B82F6',
        default: '#6B7280'
    },

    createChart(ctx, config) {
        return new Chart(ctx, {
            ...config,
            options: {
                ...config.options,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#1F2937',
                        bodyColor: '#4B5563',
                        borderColor: '#E5E7EB',
                        borderWidth: 1,
                        padding: 12,
                        boxPadding: 6,
                        usePointStyle: true,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += CurrencyFormatter.format(context.raw);
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
};

// Document Ready Handler
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all tooltips
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(element => {
        element.addEventListener('mouseenter', e => {
            const tooltip = document.createElement('div');
            tooltip.className = 'chart-tooltip';
            tooltip.textContent = element.dataset.tooltip;
            document.body.appendChild(tooltip);

            const rect = element.getBoundingClientRect();
            tooltip.style.position = 'absolute';
            tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
            tooltip.style.left = `${rect.left + (rect.width - tooltip.offsetWidth) / 2}px`;

            element.addEventListener('mouseleave', () => tooltip.remove());
        });
    });

    // Handle form submissions
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', e => {
            const { isValid, errors } = FormValidator.validateForm(form);
            if (!isValid) {
                e.preventDefault();
                errors.forEach(error => Toast.show(error, 'error'));
            }
        });
    });
});

// Export utilities for use in other scripts
window.Toast = Toast;
window.FormValidator = FormValidator;
window.CurrencyFormatter = CurrencyFormatter;
window.DateFormatter = DateFormatter;
window.API = API;
window.ChartHelpers = ChartHelpers;