/**
 * TaxClam Empty States
 * User-friendly empty state components with CTAs
 */

const EmptyStates = {
    /**
     * Show empty state in container
     * @param {string|HTMLElement} container - Container selector or element
     * @param {Object} options - Configuration object
     */
    show(container, options = {}) {
        const element = typeof container === 'string' ? document.querySelector(container) : container;
        if (!element) return;

        const config = {
            icon: options.icon || window.Icons?.inbox || '📭',
            title: options.title || 'No data yet',
            description: options.description || 'Get started by adding your first item.',
            actionText: options.actionText || null,
            actionCallback: options.actionCallback || null,
            secondaryActionText: options.secondaryActionText || null,
            secondaryActionCallback: options.secondaryActionCallback || null,
            ...options
        };

        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        
        const iconHtml = typeof config.icon === 'string' && config.icon.startsWith('<svg') 
            ? `<div class="empty-state-icon">${config.icon}</div>`
            : `<div class="empty-state-icon-text">${config.icon}</div>`;

        const actionsHtml = config.actionText ? `
            <div class="empty-state-actions">
                ${config.actionText ? `
                    <button class="btn btn-primary empty-state-action-btn">
                        ${config.actionText}
                    </button>
                ` : ''}
                ${config.secondaryActionText ? `
                    <button class="btn btn-secondary empty-state-secondary-btn">
                        ${config.secondaryActionText}
                    </button>
                ` : ''}
            </div>
        ` : '';

        emptyState.innerHTML = `
            ${iconHtml}
            <h3 class="empty-state-title">${config.title}</h3>
            <p class="empty-state-description">${config.description}</p>
            ${actionsHtml}
        `;

        // Attach event listeners
        if (config.actionText && config.actionCallback) {
            const actionBtn = emptyState.querySelector('.empty-state-action-btn');
            actionBtn.addEventListener('click', config.actionCallback);
        }

        if (config.secondaryActionText && config.secondaryActionCallback) {
            const secondaryBtn = emptyState.querySelector('.empty-state-secondary-btn');
            secondaryBtn.addEventListener('click', config.secondaryActionCallback);
        }

        element.innerHTML = '';
        element.appendChild(emptyState);
    },

    // Predefined empty states
    noDocuments(container) {
        this.show(container, {
            icon: window.Icons?.fileText || '📄',
            title: 'No documents uploaded',
            description: 'Upload your financial documents to get AI-powered insights and analysis.',
            actionText: 'Upload Document',
            actionCallback: () => {
                const uploadBtn = document.querySelector('#uploadFileBtn');
                if (uploadBtn) uploadBtn.click();
            }
        });
    },

    noTransactions(container) {
        this.show(container, {
            icon: window.Icons?.creditCard || '💳',
            title: 'No transactions recorded',
            description: 'Start tracking your business transactions to monitor cash flow and expenses.',
            actionText: 'Add Transaction',
            actionCallback: () => {
                // Navigate to finance tab
                if (window.navigateToTab) {
                    window.navigateToTab('finance');
                }
            }
        });
    },

    noCalculations(container) {
        this.show(container, {
            icon: window.Icons?.calculator || '🧮',
            title: 'No calculations yet',
            description: 'Use the GST calculator to quickly compute your tax liability and input credits.',
            actionText: 'Open Calculator',
            actionCallback: () => {
                if (window.navigateToTab) {
                    window.navigateToTab('calculator');
                }
            }
        });
    },

    noNotifications(container) {
        this.show(container, {
            icon: window.Icons?.bell || '🔔',
            title: 'All caught up!',
            description: 'You have no new notifications. We\'ll notify you when something important happens.',
            actionText: null
        });
    },

    noResults(container, searchTerm = '') {
        this.show(container, {
            icon: window.Icons?.search || '🔍',
            title: 'No results found',
            description: searchTerm 
                ? `We couldn't find anything matching "${searchTerm}". Try different keywords.`
                : 'No results match your search criteria. Try adjusting your filters.',
            actionText: 'Clear Search',
            actionCallback: () => {
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    searchInput.value = '';
                    searchInput.dispatchEvent(new Event('input'));
                }
            }
        });
    },

    errorState(container, errorMessage = '') {
        this.show(container, {
            icon: window.Icons?.alert || '⚠️',
            title: 'Something went wrong',
            description: errorMessage || 'We encountered an error loading this content. Please try again.',
            actionText: 'Retry',
            actionCallback: () => {
                window.location.reload();
            },
            secondaryActionText: 'Report Issue',
            secondaryActionCallback: () => {
                if (window.toast) {
                    window.toast.info('Please contact support at support@taxclam.com');
                }
            }
        });
    },

    comingSoon(container, featureName = '') {
        this.show(container, {
            icon: window.Icons?.zap || '⚡',
            title: 'Coming Soon',
            description: featureName 
                ? `${featureName} is currently under development. Stay tuned for updates!`
                : 'This feature is coming soon. We\'re working hard to bring it to you!',
            actionText: null
        });
    }
};

// Make globally available
window.EmptyStates = EmptyStates;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmptyStates;
}
