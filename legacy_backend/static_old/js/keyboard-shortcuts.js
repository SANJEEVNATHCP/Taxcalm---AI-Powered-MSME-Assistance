/**
 * TaxClam Keyboard Shortcuts
 * Global keyboard shortcut manager and help panel
 */

class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.helpPanel = null;
        this.isHelpOpen = false;
        this.init();
    }

    init() {
        // Register default shortcuts
        this.register('?', () => this.toggleHelp(), 'Show keyboard shortcuts');
        this.register('Escape', () => this.closeHelp(), 'Close panels');
        this.register('Alt+V', () => this.triggerVoiceAgent(), 'Toggle voice control');
        this.register('Alt+S', () => this.focusSearch(), 'Focus search');
        this.register('Alt+1', () => this.navigateTab('home'), 'Go to Overview');
        this.register('Alt+2', () => this.navigateTab('calculator'), 'Go to Calculator');
        this.register('Alt+3', () => this.navigateTab('finance'), 'Go to Finance');
        this.register('Alt+4', () => this.navigateTab('compliance'), 'Go to Compliance');
        this.register('Alt+5', () => this.navigateTab('schemes'), 'Go to Schemes');
        this.register('Alt+6', () => this.navigateTab('knowledge'), 'Go to Knowledge Base');
        this.register('Ctrl+K', () => this.openCommandPalette(), 'Command palette');

        // Listen for keypresses
        document.addEventListener('keydown', (e) => this.handleKeypress(e));

        // Create help panel
        this.createHelpPanel();
    }

    /**
     * Register a keyboard shortcut
     * @param {string} key - Key combination (e.g., 'Ctrl+S', 'Alt+K')
     * @param {Function} callback - Function to execute
     * @param {string} description - Description for help panel
     * @param {string} category - Category for grouping (optional)
     */
    register(key, callback, description, category = 'General') {
        const normalizedKey = this.normalizeKey(key);
        this.shortcuts.set(normalizedKey, {
            callback,
            description,
            category,
            key: key
        });
    }

    normalizeKey(key) {
        return key.toLowerCase().replace(/\s+/g, '');
    }

    handleKeypress(e) {
        // Build key combination
        let combo = '';
        if (e.ctrlKey) combo += 'ctrl+';
        if (e.altKey) combo += 'alt+';
        if (e.shiftKey) combo += 'shift+';
        if (e.metaKey) combo += 'meta+';
        combo += e.key.toLowerCase();

        const normalized = this.normalizeKey(combo);
        const shortcut = this.shortcuts.get(normalized);

        if (shortcut) {
            e.preventDefault();
            shortcut.callback();
        }
    }

    createHelpPanel() {
        this.helpPanel = document.createElement('div');
        this.helpPanel.id = 'keyboard-shortcuts-panel';
        this.helpPanel.className = 'shortcuts-panel hidden';
        document.body.appendChild(this.helpPanel);

        this.renderHelpContent();
    }

    renderHelpContent() {
        // Group shortcuts by category
        const grouped = new Map();
        this.shortcuts.forEach((shortcut, key) => {
            if (!grouped.has(shortcut.category)) {
                grouped.set(shortcut.category, []);
            }
            grouped.get(shortcut.category).push(shortcut);
        });

        let html = `
            <div class="shortcuts-panel-overlay" onclick="window.keyboardShortcuts.closeHelp()"></div>
            <div class="shortcuts-panel-content">
                <div class="shortcuts-header">
                    <h2>Keyboard Shortcuts</h2>
                    <button class="shortcuts-close-btn" onclick="window.keyboardShortcuts.closeHelp()" aria-label="Close">
                        ${window.Icons?.close || '×'}
                    </button>
                </div>
                <div class="shortcuts-body">
        `;

        grouped.forEach((shortcuts, category) => {
            html += `
                <div class="shortcuts-category">
                    <h3 class="shortcuts-category-title">${category}</h3>
                    <div class="shortcuts-list">
            `;

            shortcuts.forEach(shortcut => {
                const keys = shortcut.key.split('+').map(k => 
                    `<kbd class="shortcut-key">${k.trim()}</kbd>`
                ).join('<span class="shortcut-plus">+</span>');

                html += `
                    <div class="shortcut-item">
                        <span class="shortcut-keys">${keys}</span>
                        <span class="shortcut-description">${shortcut.description}</span>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        html += `
                </div>
                <div class="shortcuts-footer">
                    <p class="text-sm text-gray-500">Press <kbd class="shortcut-key">?</kbd> to toggle this panel</p>
                </div>
            </div>
        `;

        this.helpPanel.innerHTML = html;
    }

    toggleHelp() {
        if (this.isHelpOpen) {
            this.closeHelp();
        } else {
            this.openHelp();
        }
    }

    openHelp() {
        this.helpPanel.classList.remove('hidden');
        this.isHelpOpen = true;
        document.body.style.overflow = 'hidden';
    }

    closeHelp() {
        this.helpPanel.classList.add('hidden');
        this.isHelpOpen = false;
        document.body.style.overflow = '';
    }

    // Utility methods for default shortcuts
    triggerVoiceAgent() {
        const voiceBtn = document.querySelector('.voice-agent-button');
        if (voiceBtn) {
            voiceBtn.click();
        } else if (window.voiceAgent) {
            window.voiceAgent.toggleListening();
        }
    }

    focusSearch() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    navigateTab(tabName) {
        const navItem = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
        if (navItem) {
            navItem.click();
        } else if (window.navigateToTab) {
            window.navigateToTab(tabName);
        }
    }

    openCommandPalette() {
        // Future feature: Command palette
        if (window.toast) {
            window.toast.info('Command palette coming soon! Use ? to see all shortcuts.');
        }
    }
}

// Create global instance
window.keyboardShortcuts = new KeyboardShortcuts();

// Register app-specific shortcuts
window.registerShortcut = (key, callback, description, category) => {
    window.keyboardShortcuts.register(key, callback, description, category);
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeyboardShortcuts;
}
