/**
 * TaxClam Loading States & Skeleton Screens
 * Professional loading indicators
 */

const LoadingStates = {
    /**
     * Show spinner overlay on an element
     * @param {string|HTMLElement} target - Selector or element
     * @param {string} message - Optional loading message
     */
    showSpinner(target, message = '') {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        const existing = element.querySelector('.loading-overlay');
        if (existing) return; // Already has spinner

        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                ${message ? `<p class="loading-message">${message}</p>` : ''}
            </div>
        `;
        
        element.style.position = 'relative';
        element.appendChild(overlay);
    },

    /**
     * Hide spinner overlay
     * @param {string|HTMLElement} target - Selector or element
     */
    hideSpinner(target) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        const overlay = element.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    },

    /**
     * Show skeleton loader in element
     * @param {string|HTMLElement} target - Selector or element
     * @param {string} type - Skeleton type: 'card', 'list', 'text', 'table'
     * @param {number} count - Number of skeleton items
     */
    showSkeleton(target, type = 'card', count = 3) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        const skeletons = {
            card: this.createCardSkeleton,
            list: this.createListSkeleton,
            text: this.createTextSkeleton,
            table: this.createTableSkeleton
        };

        const createFn = skeletons[type] || skeletons.card;
        element.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            element.appendChild(createFn());
        }
    },

    createCardSkeleton() {
        const div = document.createElement('div');
        div.className = 'skeleton-card';
        div.innerHTML = `
            <div class="skeleton-header">
                <div class="skeleton skeleton-avatar"></div>
                <div class="skeleton-text-group">
                    <div class="skeleton skeleton-text skeleton-text-lg"></div>
                    <div class="skeleton skeleton-text skeleton-text-sm" style="width: 60%;"></div>
                </div>
            </div>
            <div class="skeleton-body">
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text" style="width: 90%;"></div>
                <div class "skeleton skeleton-text" style="width: 70%;"></div>
            </div>
        `;
        return div;
    },

    createListSkeleton() {
        const div = document.createElement('div');
        div.className = 'skeleton-list-item';
        div.innerHTML = `
            <div class="skeleton skeleton-circle"></div>
            <div class="skeleton-text-group flex-1">
                <div class="skeleton skeleton-text skeleton-text-md"></div>
                <div class="skeleton skeleton-text skeleton-text-sm" style="width: 50%;"></div>
            </div>
        `;
        return div;
    },

    createTextSkeleton() {
        const div = document.createElement('div');
        div.className = 'skeleton-text-block';
        div.innerHTML = `
            <div class="skeleton skeleton-text skeleton-text-lg mb-2"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text" style="width: 95%;"></div>
            <div class="skeleton skeleton-text" style="width: 85%;"></div>
        `;
        return div;
    },

    createTableSkeleton() {
        const div = document.createElement('div');
        div.className = 'skeleton-table';
        div.innerHTML = `
            <div class="skeleton-table-row">
                <div class="skeleton skeleton-text skeleton-text-sm"></div>
                <div class="skeleton skeleton-text skeleton-text-sm"></div>
                <div class="skeleton skeleton-text skeleton-text-sm"></div>
                <div class="skeleton skeleton-text skeleton-text-sm"></div>
            </div>
        `;
        return div;
    },

    /**
     * Show inline loader button state
     * @param {string|HTMLElement} button - Button selector or element
     * @param {string} loadingText - Text to show while loading
     */
    loadingButton(button, loadingText = 'Loading...') {
        const btn = typeof button === 'string' ? document.querySelector(button) : button;
        if (!btn) return;

        btn.disabled = true;
        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = `
            <span class="btn-spinner"></span>
            <span>${loadingText}</span>
        `;
        btn.classList.add('btn-loading');
    },

    /**
     * Reset button to normal state
     * @param {string|HTMLElement} button - Button selector or element
     */
    resetButton(button) {
        const btn = typeof button === 'string' ? document.querySelector(button) : button;
        if (!btn) return;

        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
        btn.classList.remove('btn-loading');
        delete btn.dataset.originalText;
    },

    /**
     * Show global page loader
     */
    showPageLoader() {
        let loader = document.getElementById('page-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'page-loader';
            loader.className = 'page-loader';
            loader.innerHTML = `
                <div class="page-loader-content">
                    <div class="page-loader-spinner"></div>
                    <p class="page-loader-text">Loading TaxCalm...</p>
                </div>
            `;
            document.body.appendChild(loader);
        }
        loader.classList.add('show');
    },

    /**
     * Hide global page loader
     */
    hidePageLoader() {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.classList.remove('show');
            setTimeout(() => loader.remove(), 300);
        }
    }
};

// Make globally available
window.LoadingStates = LoadingStates;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingStates;
}
