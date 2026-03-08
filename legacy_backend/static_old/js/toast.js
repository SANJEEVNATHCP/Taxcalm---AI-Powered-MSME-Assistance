/**
 * TaxClam Toast Notification System
 * Professional toast notifications with animations
 */

class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.init();
    }

    init() {
        // Create toast container
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - Type: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duration in ms (default: 5000)
     */
    show(message, type = 'info', duration = 5000) {
        const toast = this.createToast(message, type, duration);
        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => this.dismiss(toast), duration);
        }

        return toast;
    }

    createToast(message, type, duration) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const iconMap = {
            success: window.Icons?.check || '✓',
            error: window.Icons?.alert || '✕',
            warning: window.Icons?.alert || '⚠',
            info: window.Icons?.info || 'ℹ'
        };

        const colorMap = {
            success: 'emerald',
            error: 'red',
            warning: 'amber',
            info: 'blue'
        };

        const color = colorMap[type];
        const icon = iconMap[type];

        toast.innerHTML = `
            <div class="toast-icon toast-icon-${color}">
                ${typeof icon === 'string' && icon.startsWith('<svg') ? icon : `<span>${icon}</span>`}
            </div>
            <div class="toast-content">
                <p class="toast-message">${message}</p>
            </div>
            <button class="toast-close" aria-label="Close notification">
                ${window.Icons?.close || '×'}
            </button>
        `;

        // Close button handler
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.dismiss(toast));

        return toast;
    }

    dismiss(toast) {
        if (!toast) return;
        
        toast.classList.remove('show');
        toast.classList.add('hide');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            const index = this.toasts.indexOf(toast);
            if (index > -1) {
                this.toasts.splice(index, 1);
            }
        }, 300);
    }

    // Convenience methods
    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 7000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 6000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }

    dismissAll() {
        this.toasts.forEach(toast => this.dismiss(toast));
    }
}

// Create global toast instance
window.toast = new ToastManager();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToastManager;
}
