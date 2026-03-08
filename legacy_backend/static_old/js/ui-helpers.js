/**
 * UI Helper Utilities
 * Contains: Icons, Toast Notifications, Keyboard Shortcuts
 */

// 1. Icons Registry (SVG Strings)
const Icons = {
    dashboard: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
    calculator: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line><path d="M16 10h.01"></path><path d="M12 10h.01"></path><path d="M8 10h.01"></path><path d="M12 14h.01"></path><path d="M8 14h.01"></path><path d="M12 18h.01"></path><path d="M8 18h.01"></path></svg>`,
    finance: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
    compliance: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    schemes: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="21" x2="21" y2="21"></line><line x1="5" y1="21" x2="5" y2="10"></line><line x1="19" y1="21" x2="19" y2="10"></line><polyline points="5 6 12 3 19 6"></polyline><line x1="9" y1="21" x2="9" y2="10"></line><line x1="15" y1="21" x2="15" y2="10"></line></svg>`,
    learning: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    alert: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
};

// 2. Toast Notification System
class ToastManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.body) {
            this.createContainer();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                this.createContainer();
            });
        }
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'default') {
        // Ensure container exists
        if (!this.container) {
            console.warn('ToastManager: Container not initialized yet');
            return;
        }

        const toast = document.createElement('div');
        toast.className = 'toast';

        let iconHtml = '';
        let iconClass = '';

        switch (type) {
            case 'success':
                iconHtml = Icons.check;
                iconClass = 'toast-icon-emerald';
                break;
            case 'error':
                iconHtml = Icons.alert;
                iconClass = 'toast-icon-red';
                break;
            case 'warning':
                iconHtml = Icons.alert;
                iconClass = 'toast-icon-amber';
                break;
            case 'info':
                iconHtml = Icons.info;
                iconClass = 'toast-icon-blue';
                break;
            default:
                iconHtml = Icons.info;
                iconClass = 'toast-icon-blue';
        }

        toast.innerHTML = `
            <div class="toast-icon ${iconClass}">
                ${iconHtml}
            </div>
            <div class="toast-content">
                <p class="toast-message">${message}</p>
            </div>
            <button class="toast-close" aria-label="Close">
                ${Icons.close}
            </button>
        `;

        this.container.appendChild(toast);

        // Animation in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Close on button click
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.dismiss(toast);
        });

        // Auto dismiss
        setTimeout(() => {
            if (document.body.contains(toast)) {
                this.dismiss(toast);
            }
        }, 5000);
    }

    dismiss(toast) {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.remove();
            }
        }, 300);
    }

    success(msg) { this.show(msg, 'success'); }
    error(msg) { this.show(msg, 'error'); }
    warning(msg) { this.show(msg, 'warning'); }
    info(msg) { this.show(msg, 'info'); }
}

// 3. Keyboard Shortcuts Manager
class ShortcutsManager {
    constructor() {
        this.shortcuts = [
            { key: '?', description: 'Show keyboard shortcuts' },
            { key: 'Esc', description: 'Close modals / Clear focus' },
            { key: 'h', description: 'Go to Dashboard' },
            { key: 'c', description: 'Go to Calculator' },
        ];
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.body) {
            this.createModal();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                this.createModal();
            });
        }
    }

    createModal() {
        // Create Modal HTML
        this.modal = document.createElement('div');
        this.modal.className = 'shortcuts-panel hidden';
        this.modal.innerHTML = `
            <div class="shortcuts-panel-overlay"></div>
            <div class="shortcuts-panel-content">
                <div class="shortcuts-header">
                    <h2>Keyboard Shortcuts</h2>
                    <button class="shortcuts-close-btn">${Icons.close}</button>
                </div>
                <div class="shortcuts-body">
                    <div class="shortcuts-list">
                        ${this.shortcuts.map(s => `
                            <div class="shortcut-item">
                                <span class="shortcut-description">${s.description}</span>
                                <div class="shortcut-keys">
                                    <kbd class="shortcut-key">${s.key}</kbd>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(this.modal);

        // Event Listeners
        document.addEventListener('keydown', (e) => this.handleKey(e));

        this.modal.querySelector('.shortcuts-close-btn').addEventListener('click', () => this.close());
        this.modal.querySelector('.shortcuts-panel-overlay').addEventListener('click', () => this.close());
    }

    handleKey(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            if (e.key === 'Escape') {
                e.target.blur();
                this.close();
            }
            return;
        }

        switch (e.key.toLowerCase()) {
            case '?':
                this.toggle();
                break;
            case 'escape':
                this.close();
                // Also close sidebar on mobile if open
                if (window.innerWidth < 768) {
                    const sidebar = document.getElementById('sidebar');
                    if (sidebar) sidebar.classList.remove('open');
                }
                break;
            case 'h':
                this.navigateTo('home');
                break;
            case 'c':
                this.navigateTo('calculator');
                break;
        }
    }

    navigateTo(tabId) {
        const tabBtn = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
        if (tabBtn) tabBtn.click();
    }

    toggle() {
        this.modal.classList.toggle('hidden');
    }

    openHelp() {
        this.modal.classList.remove('hidden');
    }

    close() {
        this.modal.classList.add('hidden');
    }
}

// Initialize Global Instances
window.toast = new ToastManager();
window.keyboardShortcuts = new ShortcutsManager();

// Expose Icons globally
window.Icons = Icons;
