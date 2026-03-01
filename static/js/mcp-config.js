/**
 * MCP Configuration Management
 * Handles HuggingFace and Strom MCP configuration in UI
 */

(function() {
    'use strict';

    const API_BASE_URL = window.location.origin;

    // ==================== INITIALIZATION ====================

    /**
     * Initialize MCP configuration on page load
     */
    function initMCPConfig() {
        console.log('Initializing MCP configuration...');
        loadMCPConfigs();
        
        // Set up event listeners
        setupEventListeners();
    }

    /**
     * Setup event listeners for MCP configuration
     */
    function setupEventListeners() {
        // Listen for tab changes to reload config when Integrations tab is shown
        const integrationsTab = document.querySelector('[data-profile-tab="integrations"]');
        if (integrationsTab) {
            integrationsTab.addEventListener('click', () => {
                setTimeout(loadMCPConfigs, 100);
            });
        }
    }

    // ==================== LOAD CONFIGURATION ====================

    /**
     * Load MCP configurations from backend and localStorage
     */
    async function loadMCPConfigs() {
        console.log('Loading MCP configurations...');
        
        try {
            // Try to load from backend first
            const response = await fetch(`${API_BASE_URL}/api/mcp/config`);
            
            if (response.ok) {
                const config = await response.json();
                console.log('MCP config loaded from backend:', config);
                
                // Populate HuggingFace MCP
                if (config.huggingface) {
                    populateHFConfig(config.huggingface);
                }
                
                // Populate Strom MCP
                if (config.strom) {
                    populateStromConfig(config.strom);
                }
            } else {
                console.warn('Could not load MCP config from backend, loading from localStorage');
                loadFromLocalStorage();
            }
        } catch (error) {
            console.error('Error loading MCP configs:', error);
            // Fallback to localStorage
            loadFromLocalStorage();
        }
    }

    /**
     * Load configurations from localStorage as fallback
     */
    function loadFromLocalStorage() {
        // Load HuggingFace config
        const hfConfig = localStorage.getItem('mcp_huggingface_config');
        if (hfConfig) {
            try {
                const config = JSON.parse(hfConfig);
                document.getElementById('hf-mcp-endpoint').value = config.endpoint || '';
                document.getElementById('hf-mcp-key').value = config.api_key || '';
                updateStatus('hf-mcp-status', config.configured);
            } catch (error) {
                console.error('Error parsing HF MCP config from localStorage:', error);
            }
        }
        
        // Load Strom config
        const stromConfig = localStorage.getItem('mcp_strom_config');
        if (stromConfig) {
            try {
                const config = JSON.parse(stromConfig);
                document.getElementById('strom-mcp-endpoint').value = config.endpoint || '';
                document.getElementById('strom-mcp-key').value = config.api_key || '';
                updateStatus('strom-mcp-status', config.configured);
            } catch (error) {
                console.error('Error parsing Strom MCP config from localStorage:', error);
            }
        }
    }

    /**
     * Populate HuggingFace MCP configuration in UI
     */
    function populateHFConfig(config) {
        if (config.endpoint) {
            document.getElementById('hf-mcp-endpoint').value = config.endpoint;
        }
        
        // Don't populate API key if it's masked
        if (config.api_key && !config.api_key.includes('...')) {
            document.getElementById('hf-mcp-key').value = config.api_key;
        }
        
        updateStatus('hf-mcp-status', config.configured);
    }

    /**
     * Populate Strom MCP configuration in UI
     */
    function populateStromConfig(config) {
        if (config.endpoint) {
            document.getElementById('strom-mcp-endpoint').value = config.endpoint;
        }
        
        // Don't populate API key if it's masked
        if (config.api_key && !config.api_key.includes('...')) {
            document.getElementById('strom-mcp-key').value = config.api_key;
        }
        
        updateStatus('strom-mcp-status', config.configured);
    }

    /**
     * Update status indicator
     */
    function updateStatus(elementId, isConfigured) {
        const statusElement = document.getElementById(elementId);
        if (!statusElement) return;
        
        if (isConfigured) {
            statusElement.textContent = '🟢 Connected';
            statusElement.className = 'text-xs px-2 py-1 rounded-full bg-green-100 text-green-700';
        } else {
            statusElement.textContent = '🔴 Not Configured';
            statusElement.className = 'text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600';
        }
    }

    // ==================== SAVE CONFIGURATION ====================

    /**
     * Save MCP configuration
     * @param {string} provider - 'huggingface' or 'strom'
     */
    window.saveMCPConfig = async function(provider) {
        console.log(`Saving ${provider} MCP configuration...`);
        
        let endpoint, apiKey, statusId;
        
        if (provider === 'huggingface') {
            endpoint = document.getElementById('hf-mcp-endpoint').value.trim();
            apiKey = document.getElementById('hf-mcp-key').value.trim();
            statusId = 'hf-mcp-status';
        } else if (provider === 'strom') {
            endpoint = document.getElementById('strom-mcp-endpoint').value.trim();
            apiKey = document.getElementById('strom-mcp-key').value.trim();
            statusId = 'strom-mcp-status';
        } else {
            showToast('Invalid provider', 'error');
            return;
        }
        
        // Validation
        if (!endpoint) {
            showToast('Please enter an endpoint URL', 'error');
            return;
        }
        
        if (!apiKey) {
            showToast('Please enter an API key', 'error');
            return;
        }
        
        // Show loading state
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = '⏳ Saving...';
        button.disabled = true;
        
        try {
            const config = {
                endpoint: endpoint,
                api_key: apiKey,
                enabled: true
            };
            
            // Save to backend
            const response = await fetch(`${API_BASE_URL}/api/mcp/config/${provider}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Save to localStorage as backup
                localStorage.setItem(`mcp_${provider}_config`, JSON.stringify(config));
                
                // Update status
                updateStatus(statusId, true);
                
                showToast(`${provider === 'huggingface' ? 'HuggingFace' : 'Strom'} MCP configured successfully! 🎉`, 'success');
                
                // Show connection test result if available
                if (result.connection_test && result.connection_test.success) {
                    const latency = result.connection_test.latency_ms;
                    showToast(`Connection test passed! Latency: ${latency}ms`, 'success');
                } else if (result.connection_test && !result.connection_test.success) {
                    showToast(`Warning: ${result.connection_test.message}`, 'warning');
                }
            } else {
                showToast(`Error: ${result.error || 'Failed to save configuration'}`, 'error');
                updateStatus(statusId, false);
            }
        } catch (error) {
            console.error('Error saving MCP config:', error);
            showToast('Failed to save configuration. Please try again.', 'error');
            updateStatus(statusId, false);
        } finally {
            // Restore button state
            button.textContent = originalText;
            button.disabled = false;
        }
    };

    // ==================== TEST CONNECTION ====================

    /**
     * Test MCP connection
     * @param {string} provider - 'huggingface' or 'strom'
     */
    window.testMCPConnection = async function(provider) {
        console.log(`Testing ${provider} MCP connection...`);
        
        let endpoint, apiKey;
        
        if (provider === 'huggingface') {
            endpoint = document.getElementById('hf-mcp-endpoint').value.trim();
            apiKey = document.getElementById('hf-mcp-key').value.trim();
        } else if (provider === 'strom') {
            endpoint = document.getElementById('strom-mcp-endpoint').value.trim();
            apiKey = document.getElementById('strom-mcp-key').value.trim();
        } else {
            showToast('Invalid provider', 'error');
            return;
        }
        
        // Validation
        if (!endpoint) {
            showToast('Please enter an endpoint URL', 'error');
            return;
        }
        
        if (!apiKey) {
            showToast('Please enter an API key', 'error');
            return;
        }
        
        // Show loading state
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = '⏳ Testing...';
        button.disabled = true;
        
        try {
            // First save the config temporarily to backend
            const config = {
                endpoint: endpoint,
                api_key: apiKey,
                enabled: true
            };
            
            await fetch(`${API_BASE_URL}/api/mcp/config/${provider}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });
            
            // Test connection
            const response = await fetch(`${API_BASE_URL}/api/mcp/test-connection?provider=${provider}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                const latency = result.latency_ms ? ` (${result.latency_ms}ms)` : '';
                showToast(`✅ Connection successful!${latency}`, 'success');
                
                if (result.server_info) {
                    console.log('Server info:', result.server_info);
                }
            } else {
                showToast(`❌ Connection failed: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Error testing connection:', error);
            showToast('Failed to test connection. Please check your network.', 'error');
        } finally {
            // Restore button state
            button.textContent = originalText;
            button.disabled = false;
        }
    };

    // ==================== UTILITY FUNCTIONS ====================

    /**
     * Toggle password visibility
     * @param {string} inputId - ID of password input field
     */
    window.togglePasswordVisibility = function(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        if (input.type === 'password') {
            input.type = 'text';
        } else {
            input.type = 'password';
        }
    };

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
            // Fallback to console and alert
            console.log(`[${type.toUpperCase()}] ${message}`);
            
            // Simple visual feedback
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
        document.addEventListener('DOMContentLoaded', initMCPConfig);
    } else {
        initMCPConfig();
    }

    console.log('✓ MCP Configuration module loaded');

})();
