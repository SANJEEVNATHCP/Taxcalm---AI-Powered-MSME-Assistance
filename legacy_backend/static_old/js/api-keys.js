/**
 * API Key Management
 * Handles generation, listing, and revocation of API keys
 */

(function() {
    'use strict';

    const API_BASE_URL = window.location.origin;

    // ==================== INITIALIZATION ====================

    /**
     * Initialize API key management
     */
    function initAPIKeyManagement() {
        console.log('Initializing API Key Management...');
        
        // Load existing API keys
        loadAPIKeys();
        
        // Set up event listeners
        setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Listen for tab changes to reload keys when Integrations tab is shown
        const integrationsTab = document.querySelector('[data-profile-tab="integrations"]');
        if (integrationsTab) {
            integrationsTab.addEventListener('click', () => {
                setTimeout(loadAPIKeys, 100);
            });
        }
    }

    // ==================== LOAD API KEYS ====================

    /**
     * Load and display existing API keys
     */
    async function loadAPIKeys() {
        console.log('Loading API keys...');
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/keys/list?user_id=1`);
            
            if (response.ok) {
                const result = await response.json();
                console.log('API keys loaded:', result);
                
                if (result.success && result.keys && result.keys.length > 0) {
                    displayAPIKeys(result.keys);
                } else {
                    showEmptyState();
                }
            } else {
                console.error('Failed to load API keys');
                showEmptyState();
            }
        } catch (error) {
            console.error('Error loading API keys:', error);
            showEmptyState();
        }
    }

    /**
     * Display API keys in the UI
     * @param {Array} keys - Array of API key objects
     */
    function displayAPIKeys(keys) {
        const emptyState = document.getElementById('api-keys-empty');
        const listContainer = document.getElementById('api-keys-list');
        
        if (!emptyState || !listContainer) return;
        
        // Hide empty state, show list
        emptyState.classList.add('hidden');
        listContainer.classList.remove('hidden');
        
        // Clear existing keys
        listContainer.innerHTML = '';
        
        // Add each key
        keys.forEach(key => {
            const keyElement = createAPIKeyElement(key);
            listContainer.appendChild(keyElement);
        });
    }

    /**
     * Show empty state (no keys)
     */
    function showEmptyState() {
        const emptyState = document.getElementById('api-keys-empty');
        const listContainer = document.getElementById('api-keys-list');
        
        if (emptyState && listContainer) {
            emptyState.classList.remove('hidden');
            listContainer.classList.add('hidden');
        }
    }

    /**
     * Create an API key element for display
     * @param {Object} key - API key object
     * @returns {HTMLElement} - DOM element for the key
     */
    function createAPIKeyElement(key) {
        const div = document.createElement('div');
        div.className = 'p-4 border border-gray-200 rounded-xl hover:border-yellow-300 transition';
        
        const createdDate = new Date(key.created_at).toLocaleDateString();
        const lastUsed = key.last_used ? new Date(key.last_used).toLocaleDateString() : 'Never';
        const statusClass = key.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500';
        const statusText = key.is_active ? '🟢 Active' : '🔴 Revoked';
        
        div.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <p class="font-semibold text-gray-900 text-sm">${escapeHtml(key.name || 'API Key')}</p>
                        <span class="text-xs px-2 py-1 rounded-full ${statusClass}">${statusText}</span>
                    </div>
                    <div class="space-y-1">
                        <p class="text-xs text-gray-500">
                            <span class="font-mono bg-gray-100 px-2 py-1 rounded">${escapeHtml(key.prefix)}</span>
                        </p>
                        <p class="text-xs text-gray-400">Created: ${createdDate} • Last used: ${lastUsed}</p>
                    </div>
                </div>
                ${key.is_active ? `
                <button 
                    onclick="revokeAPIKey('${escapeHtml(key.key_id)}')"
                    class="ml-4 px-3 py-1.5 text-xs border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition font-medium">
                    Revoke
                </button>
                ` : ''}
            </div>
        `;
        
        return div;
    }

    // ==================== GENERATE NEW API KEY ====================

    /**
     * Generate a new API key
     */
    window.generateNewAPIKey = async function() {
        console.log('Generating new API key...');
        
        // Prompt for key name
        const keyName = prompt('Enter a name for this API key (e.g., "Mobile App", "Integration Service"):');
        
        if (!keyName) {
            return; // User cancelled
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/keys/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: keyName.trim()
                })
            });
            
            const result = await response.json();
            
            if (result.success && result.key) {
                // Show the API key in a modal (user needs to copy it)
                showAPIKeyModal(result.key, keyName);
                
                // Reload the keys list
                setTimeout(loadAPIKeys, 500);
            } else {
                showToast(result.message || 'Failed to generate API key', 'error');
            }
        } catch (error) {
            console.error('Error generating API key:', error);
            showToast('Failed to generate API key. Please try again.', 'error');
        }
    };

    /**
     * Show modal with newly generated API key
     * @param {string} apiKey - The generated API key
     * @param {string} keyName - Name of the key
     */
    function showAPIKeyModal(apiKey, keyName) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]';
        modal.innerHTML = `
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span class="text-3xl">🔑</span>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">API Key Generated!</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-300">Save this key now - you won't be able to see it again</p>
                </div>
                
                <div class="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
                    <p class="text-xs font-semibold text-yellow-800 mb-2">⚠️ IMPORTANT: Copy this key now!</p>
                    <p class="text-xs text-yellow-700">This is the only time you'll see the full API key. Store it securely.</p>
                </div>
                
                <div class="mb-6">
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Key Name</label>
                    <p class="text-gray-900 dark:text-white font-medium">${escapeHtml(keyName)}</p>
                </div>
                
                <div class="mb-6">
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">API Key</label>
                    <div class="flex gap-2">
                        <input type="text" 
                            id="generated-api-key" 
                            value="${escapeHtml(apiKey)}" 
                            readonly
                            class="flex-1 px-4 py-3 font-mono text-sm bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400">
                        <button 
                            onclick="copyAPIKey()"
                            class="px-4 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg transition">
                            📋 Copy
                        </button>
                    </div>
                </div>
                
                <div class="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 mb-6">
                    <p class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Usage Example:</p>
                    <pre class="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto"><code>curl -H "Authorization: Bearer ${escapeHtml(apiKey)}" \\
     ${API_BASE_URL}/api/your-endpoint</code></pre>
                </div>
                
                <button 
                    onclick="this.closest('.fixed').remove()"
                    class="w-full px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition">
                    I've Saved My Key
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Select the key text for easy copying
        setTimeout(() => {
            const input = document.getElementById('generated-api-key');
            if (input) input.select();
        }, 100);
    }

    /**
     * Copy API key to clipboard
     */
    window.copyAPIKey = function() {
        const input = document.getElementById('generated-api-key');
        if (!input) return;
        
        input.select();
        document.execCommand('copy');
        
        showToast('API key copied to clipboard! 🎉', 'success');
    };

    // ==================== REVOKE API KEY ====================

    /**
     * Revoke an API key
     * @param {string} keyId - ID of the key to revoke
     */
    window.revokeAPIKey = async function(keyId) {
        console.log('Revoking API key:', keyId);
        
        const confirmed = confirm('Are you sure you want to revoke this API key? This action cannot be undone.');
        
        if (!confirmed) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/keys/${keyId}?user_id=1`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast('API key revoked successfully', 'success');
                loadAPIKeys(); // Reload the list
            } else {
                showToast(result.message || 'Failed to revoke API key', 'error');
            }
        } catch (error) {
            console.error('Error revoking API key:', error);
            showToast('Failed to revoke API key. Please try again.', 'error');
        }
    };

    // ==================== UTILITY FUNCTIONS ====================

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type ('success', 'error', 'warning', 'info')
     */
    function showToast(message, type = 'info') {
        // Check if ui-helpers.js toast function exists
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            // Fallback to console and simple visual feedback
            console.log(`[${type.toUpperCase()}] ${message}`);
            
            const color = type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#F59E0B';
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${color};
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 10000;
                font-size: 14px;
                font-weight: 500;
                max-width: 400px;
            `;
            toast.textContent = message;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }

    // ==================== AUTO-INITIALIZE ====================

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAPIKeyManagement);
    } else {
        initAPIKeyManagement();
    }

    console.log('✓ API Key Management module loaded');

})();
