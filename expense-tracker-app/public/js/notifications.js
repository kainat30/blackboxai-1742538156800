// Notification System
const NotificationSystem = {
    // Container for notifications
    container: null,

    // Initialize notification system
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'fixed top-4 right-4 z-50 space-y-4';
            document.body.appendChild(this.container);
        }
    },

    // Show notification
    show(message, type = 'info', duration = 5000) {
        this.init();

        const notification = document.createElement('div');
        notification.className = `
            notification
            max-w-sm
            w-full
            bg-white
            shadow-lg
            rounded-lg
            pointer-events-auto
            overflow-hidden
            transform
            transition-all
            duration-300
            ease-in-out
            translate-x-0
            ${this.getTypeClasses(type)}
        `;

        notification.innerHTML = `
            <div class="p-4">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        ${this.getTypeIcon(type)}
                    </div>
                    <div class="ml-3 w-0 flex-1">
                        <p class="text-sm font-medium text-gray-900">
                            ${message}
                        </p>
                    </div>
                    <div class="ml-4 flex-shrink-0 flex">
                        <button class="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none">
                            <span class="sr-only">Close</span>
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="notification-progress" style="animation-duration: ${duration}ms"></div>
        `;

        // Add close button functionality
        const closeButton = notification.querySelector('button');
        closeButton.addEventListener('click', () => this.dismiss(notification));

        // Add to container
        this.container.appendChild(notification);

        // Trigger entrance animation
        requestAnimationFrame(() => {
            notification.classList.add('translate-x-0');
            notification.classList.remove('translate-x-full');
        });

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => this.dismiss(notification), duration);
        }

        return notification;
    },

    // Show success notification
    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    },

    // Show error notification
    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    },

    // Show warning notification
    warning(message, duration = 5000) {
        return this.show(message, 'warning', duration);
    },

    // Show info notification
    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    },

    // Dismiss notification
    dismiss(notification) {
        notification.classList.add('translate-x-full');
        notification.classList.add('opacity-0');
        
        setTimeout(() => {
            notification.remove();
            
            // Remove container if empty
            if (this.container && !this.container.hasChildNodes()) {
                this.container.remove();
                this.container = null;
            }
        }, 300);
    },

    // Get classes for notification type
    getTypeClasses(type) {
        switch (type) {
            case 'success':
                return 'border-l-4 border-green-500';
            case 'error':
                return 'border-l-4 border-red-500';
            case 'warning':
                return 'border-l-4 border-yellow-500';
            default:
                return 'border-l-4 border-blue-500';
        }
    },

    // Get icon for notification type
    getTypeIcon(type) {
        switch (type) {
            case 'success':
                return '<i class="fas fa-check-circle text-green-500"></i>';
            case 'error':
                return '<i class="fas fa-exclamation-circle text-red-500"></i>';
            case 'warning':
                return '<i class="fas fa-exclamation-triangle text-yellow-500"></i>';
            default:
                return '<i class="fas fa-info-circle text-blue-500"></i>';
        }
    }
};

// Alert Dialog System
const AlertDialog = {
    // Show confirmation dialog
    confirm(options = {}) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = `
                fixed
                inset-0
                z-50
                overflow-y-auto
                flex
                items-center
                justify-center
                min-h-screen
                p-4
                text-center
            `;

            dialog.innerHTML = `
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
                <div class="relative bg-white rounded-lg max-w-sm w-full p-6 text-left shadow-xl">
                    <div class="text-center">
                        ${options.icon ? `
                            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full ${options.iconClass || 'bg-yellow-100'}">
                                <i class="${options.icon} ${options.iconColor || 'text-yellow-600'} text-xl"></i>
                            </div>
                        ` : ''}
                        <h3 class="text-lg font-medium text-gray-900 mt-4">
                            ${options.title || 'Confirm Action'}
                        </h3>
                        <p class="text-sm text-gray-500 mt-2">
                            ${options.message || 'Are you sure you want to perform this action?'}
                        </p>
                    </div>
                    <div class="mt-6 flex justify-end space-x-3">
                        <button type="button" class="cancel-button px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            ${options.cancelText || 'Cancel'}
                        </button>
                        <button type="button" class="confirm-button px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700">
                            ${options.confirmText || 'Confirm'}
                        </button>
                    </div>
                </div>
            `;

            // Add to body
            document.body.appendChild(dialog);

            // Handle button clicks
            dialog.querySelector('.cancel-button').addEventListener('click', () => {
                dialog.remove();
                resolve(false);
            });

            dialog.querySelector('.confirm-button').addEventListener('click', () => {
                dialog.remove();
                resolve(true);
            });

            // Handle click outside
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) {
                    dialog.remove();
                    resolve(false);
                }
            });

            // Handle escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    dialog.remove();
                    resolve(false);
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    },

    // Show alert dialog
    alert(options = {}) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = `
                fixed
                inset-0
                z-50
                overflow-y-auto
                flex
                items-center
                justify-center
                min-h-screen
                p-4
                text-center
            `;

            dialog.innerHTML = `
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
                <div class="relative bg-white rounded-lg max-w-sm w-full p-6 text-left shadow-xl">
                    <div class="text-center">
                        ${options.icon ? `
                            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full ${options.iconClass || 'bg-blue-100'}">
                                <i class="${options.icon} ${options.iconColor || 'text-blue-600'} text-xl"></i>
                            </div>
                        ` : ''}
                        <h3 class="text-lg font-medium text-gray-900 mt-4">
                            ${options.title || 'Alert'}
                        </h3>
                        <p class="text-sm text-gray-500 mt-2">
                            ${options.message}
                        </p>
                    </div>
                    <div class="mt-6 flex justify-center">
                        <button type="button" class="ok-button px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
                            ${options.okText || 'OK'}
                        </button>
                    </div>
                </div>
            `;

            // Add to body
            document.body.appendChild(dialog);

            // Handle button click
            dialog.querySelector('.ok-button').addEventListener('click', () => {
                dialog.remove();
                resolve(true);
            });

            // Handle click outside
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) {
                    dialog.remove();
                    resolve(true);
                }
            });

            // Handle escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    dialog.remove();
                    resolve(true);
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    }
};

// Export notification utilities
window.NotificationSystem = NotificationSystem;
window.AlertDialog = AlertDialog;