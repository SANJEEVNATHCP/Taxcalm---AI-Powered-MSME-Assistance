/**
 * TaxClam Onboarding Tour
 * Interactive product tour for new users
 */

class OnboardingTour {
    constructor() {
        this.currentStep = 0;
        this.steps = [];
        this.overlay = null;
        this.spotlight = null;
        this.tooltip = null;
        this.isActive = false;
    }

    /**
     * Define tour steps
     * @param {Array} steps - Array of step objects
     */
    setSteps(steps) {
        this.steps = steps;
        return this;
    }

    /**
     * Start the tour
     */
    start() {
        if (this.steps.length === 0) {
            console.warn('No tour steps defined');
            return;
        }

        this.isActive = true;
        this.currentStep = 0;
        this.createOverlay();
        this.showStep(0);
    }

    /**
     * Stop the tour
     */
    stop() {
        this.isActive = false;
        this.removeOverlay();
        localStorage.setItem('taxcalm_tour_completed', 'true');
    }

    /**
     * Skip the tour
     */
    skip() {
        this.stop();
        if (window.toast) {
            window.toast.info('Tour skipped. You can restart it from Settings.');
        }
    }

    createOverlay() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'tour-overlay';
        this.overlay.innerHTML = `
            <div class="tour-backdrop"></div>
            <div class="tour-spotlight"></div>
            <div class="tour-tooltip hidden"></div>
        `;
        document.body.appendChild(this.overlay);

        this.spotlight = this.overlay.querySelector('.tour-spotlight');
        this.tooltip = this.overlay.querySelector('.tour-tooltip');
    }

    removeOverlay() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
            this.spotlight = null;
            this.tooltip = null;
        }
    }

    showStep(index) {
        if (index < 0 || index >= this.steps.length) {
            this.stop();
            if (window.toast) {
                window.toast.success('Tour completed! You\'re all set to use TaxCalm.');
            }
            return;
        }

        this.currentStep = index;
        const step = this.steps[index];
        const targetElement = document.querySelector(step.target);

        if (!targetElement) {
            console.warn(`Tour target not found: ${step.target}`);
            this.next();
            return;
        }

        // Position spotlight
        const rect = targetElement.getBoundingClientRect();
        this.positionSpotlight(rect);

        // Show tooltip
        this.showTooltip(step, rect, index);

        // Scroll element into view
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    positionSpotlight(rect) {
        const padding = 8;
        this.spotlight.style.cssText = `
            top: ${rect.top - padding}px;
            left: ${rect.left - padding}px;
            width: ${rect.width + padding * 2}px;
            height: ${rect.height + padding * 2}px;
        `;
    }

    showTooltip(step, targetRect, index) {
        const totalSteps = this.steps.length;
        const isLastStep = index === totalSteps - 1;

        this.tooltip.innerHTML = `
            <div class="tour-tooltip-header">
                <span class="tour-step-counter">Step ${index + 1} of ${totalSteps}</span>
                <button class="tour-close-btn" aria-label="Close tour">
                    ${window.Icons?.close || '×'}
                </button>
            </div>
            <h3 class="tour-tooltip-title">${step.title}</h3>
            <p class="tour-tooltip-description">${step.description}</p>
            <div class="tour-tooltip-actions">
                ${index > 0 ? `
                    <button class="btn btn-secondary tour-btn-prev">Previous</button>
                ` : `
                    <button class="btn btn-secondary tour-btn-skip">Skip Tour</button>
                `}
                <button class="btn btn-primary tour-btn-next">
                    ${isLastStep ? 'Finish' : 'Next'}
                </button>
            </div>
        `;

        // Position tooltip
        this.positionTooltip(targetRect, step.position || 'bottom');

        // Show tooltip
        this.tooltip.classList.remove('hidden');

        // Attach event listeners
        const closeBtn = this.tooltip.querySelector('.tour-close-btn');
        const nextBtn = this.tooltip.querySelector('.tour-btn-next');
        const prevBtn = this.tooltip.querySelector('.tour-btn-prev');
        const skipBtn = this.tooltip.querySelector('.tour-btn-skip');

        closeBtn.addEventListener('click', () => this.skip());
        nextBtn.addEventListener('click', () => this.next());
        if (prevBtn) prevBtn.addEventListener('click', () => this.previous());
        if (skipBtn) skipBtn.addEventListener('click', () => this.skip());
    }

    positionTooltip(targetRect, position) {
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const spacing = 20;
        let top, left;

        switch (position) {
            case 'top':
                top = targetRect.top - tooltipRect.height - spacing;
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'bottom':
                top = targetRect.bottom + spacing;
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'left':
                top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                left = targetRect.left - tooltipRect.width - spacing;
                break;
            case 'right':
                top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                left = targetRect.right + spacing;
                break;
            default:
                top = targetRect.bottom + spacing;
                left = targetRect.left;
        }

        // Keep tooltip within viewport
        const maxTop = window.innerHeight - tooltipRect.height - 20;
        const maxLeft = window.innerWidth - tooltipRect.width - 20;
        top = Math.max(20, Math.min(top, maxTop));
        left = Math.max(20, Math.min(left, maxLeft));

        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.left = `${left}px`;
    }

    next() {
        this.showStep(this.currentStep + 1);
    }

    previous() {
        this.showStep(this.currentStep - 1);
    }

    /**
     * Check if user has completed tour
     */
    static hasCompleted() {
        return localStorage.getItem('taxcalm_tour_completed') === 'true';
    }

    /**
     * Reset tour completion status
     */
    static reset() {
        localStorage.removeItem('taxcalm_tour_completed');
    }
}

// Default TaxCalm tour steps
const defaultTourSteps = [
    {
        target: '.brand',
        title: 'Welcome to TaxCalm! 👋',
        description: 'Your all-in-one platform for GST calculation, compliance tracking, and financial management.',
        position: 'bottom'
    },
    {
        target: '.nav-item[data-tab="calculator"]',
        title: 'GST Calculator',
        description: 'Quickly calculate your GST liability with our smart calculator. It supports multiple business types and tax rates.',
        position: 'right'
    },
    {
        target: '.nav-item[data-tab="finance"]',
        title: 'Financial Management',
        description: 'Track expenses, manage transactions, and generate detailed financial reports.',
        position: 'right'
    },
    {
        target: '.nav-item[data-tab="knowledge"]',
        title: 'Knowledge Base',
        description: 'Upload documents and use our AI-powered RAG system to get instant answers about your finances.',
        position: 'right'
    },
    {
        target: '#voiceChatToggle',
        title: 'Voice Control',
        description: 'Use voice commands to navigate the app hands-free. Click the microphone in the chat or press Alt+V to start!',
        position: 'left'
    },
    {
        target: '.header-search',
        title: 'Quick Search',
        description: 'Search across all features, documents, and transactions instantly.',
        position: 'bottom'
    }
];

// Create global instance
window.OnboardingTour = OnboardingTour;
window.tourManager = new OnboardingTour();
window.tourManager.setSteps(defaultTourSteps);

// Auto-start tour for first-time users
document.addEventListener('DOMContentLoaded', () => {
    if (!OnboardingTour.hasCompleted()) {
        setTimeout(() => {
            if (confirm('Welcome to TaxCalm! Would you like a quick tour?')) {
                window.tourManager.start();
            } else {
                OnboardingTour.reset(); // Don't show again
            }
        }, 1500);
    }
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OnboardingTour;
}
