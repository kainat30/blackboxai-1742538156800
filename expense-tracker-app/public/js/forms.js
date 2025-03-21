// Form Validation Rules
const ValidationRules = {
    required: {
        validate: value => value.trim().length > 0,
        message: field => `${field} is required`
    },
    email: {
        validate: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: () => 'Please enter a valid email address'
    },
    password: {
        validate: value => value.length >= 6 && /\d/.test(value),
        message: () => 'Password must be at least 6 characters and contain at least one number'
    },
    confirmPassword: {
        validate: (value, formData) => value === formData.password,
        message: () => 'Passwords do not match'
    },
    amount: {
        validate: value => !isNaN(value) && parseFloat(value) > 0,
        message: () => 'Please enter a valid amount'
    },
    date: {
        validate: value => !isNaN(new Date(value).getTime()),
        message: () => 'Please enter a valid date'
    },
    futureDate: {
        validate: value => new Date(value) > new Date(),
        message: () => 'Date must be in the future'
    },
    pastDate: {
        validate: value => new Date(value) < new Date(),
        message: () => 'Date must be in the past'
    }
};

// Form Validator Class
class FormValidator {
    constructor(form, rules = {}) {
        this.form = form;
        this.rules = rules;
        this.errors = new Map();
        this.setupValidation();
    }

    setupValidation() {
        // Real-time validation
        this.form.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => this.validateField(field));
        });

        // Form submission
        this.form.addEventListener('submit', e => {
            if (!this.validateForm()) {
                e.preventDefault();
                this.showErrors();
            }
        });
    }

    validateField(field) {
        const rules = this.rules[field.name];
        if (!rules) return true;

        const fieldRules = Array.isArray(rules) ? rules : [rules];
        const formData = Object.fromEntries(new FormData(this.form));

        for (const rule of fieldRules) {
            const validationRule = ValidationRules[rule];
            if (!validationRule.validate(field.value, formData)) {
                this.errors.set(field.name, validationRule.message(field.name));
                this.showFieldError(field);
                return false;
            }
        }

        this.errors.delete(field.name);
        this.clearFieldError(field);
        return true;
    }

    validateForm() {
        let isValid = true;
        this.errors.clear();

        this.form.querySelectorAll('input, select, textarea').forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    showFieldError(field) {
        this.clearFieldError(field);
        
        const errorMessage = this.errors.get(field.name);
        if (!errorMessage) return;

        field.classList.add('error');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message text-red-500 text-sm mt-1';
        errorElement.textContent = errorMessage;
        
        field.parentNode.appendChild(errorElement);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    showErrors() {
        this.errors.forEach((message, fieldName) => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                this.showFieldError(field);
            }
        });

        // Scroll to first error
        const firstError = this.form.querySelector('.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// Dynamic Form Handlers
const FormHandlers = {
    // Handle dependent fields
    setupDependentFields(form) {
        form.querySelectorAll('[data-depends-on]').forEach(field => {
            const dependsOn = field.dataset.dependsOn;
            const controller = form.querySelector(`[name="${dependsOn}"]`);
            
            if (controller) {
                controller.addEventListener('change', () => {
                    this.updateDependentField(controller, field);
                });
                // Initial state
                this.updateDependentField(controller, field);
            }
        });
    },

    updateDependentField(controller, dependent) {
        const showWhen = dependent.dataset.showWhen;
        if (controller.value === showWhen) {
            dependent.style.display = '';
            dependent.required = dependent.dataset.required === 'true';
        } else {
            dependent.style.display = 'none';
            dependent.required = false;
        }
    },

    // Handle dynamic form fields
    setupDynamicFields(container, addButton, template) {
        addButton.addEventListener('click', () => {
            const newField = template.cloneNode(true);
            newField.classList.remove('hidden');
            
            // Update field names and IDs
            const timestamp = Date.now();
            newField.querySelectorAll('[name], [id]').forEach(element => {
                if (element.name) {
                    element.name = element.name.replace('__INDEX__', timestamp);
                }
                if (element.id) {
                    element.id = element.id.replace('__INDEX__', timestamp);
                }
            });

            // Add remove button
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'remove-field text-red-600 hover:text-red-800';
            removeButton.innerHTML = '<i class="fas fa-times"></i>';
            removeButton.onclick = () => newField.remove();
            
            newField.appendChild(removeButton);
            container.appendChild(newField);
        });
    },

    // Handle file inputs
    setupFileInput(input) {
        const fileNameDisplay = document.createElement('div');
        fileNameDisplay.className = 'text-sm text-gray-500 mt-1';
        input.parentNode.appendChild(fileNameDisplay);

        input.addEventListener('change', () => {
            if (input.files.length > 0) {
                fileNameDisplay.textContent = Array.from(input.files)
                    .map(file => file.name)
                    .join(', ');
            } else {
                fileNameDisplay.textContent = '';
            }
        });
    }
};

// Form Data Handlers
const FormData = {
    // Serialize form data
    serialize(form) {
        const formData = new FormData(form);
        const data = {};

        formData.forEach((value, key) => {
            if (data[key]) {
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        });

        return data;
    },

    // Populate form with data
    populate(form, data) {
        Object.entries(data).forEach(([key, value]) => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                switch (field.type) {
                    case 'checkbox':
                        field.checked = value;
                        break;
                    case 'radio':
                        form.querySelector(`[name="${key}"][value="${value}"]`)?.checked = true;
                        break;
                    case 'select-multiple':
                        Array.from(field.options).forEach(option => {
                            option.selected = value.includes(option.value);
                        });
                        break;
                    default:
                        field.value = value;
                }
            }
        });
    }
};

// Export form utilities
window.FormValidator = FormValidator;
window.FormHandlers = FormHandlers;
window.FormData = FormData;