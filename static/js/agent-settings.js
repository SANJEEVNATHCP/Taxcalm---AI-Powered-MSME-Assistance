/**
 * AI Agent Settings UI Handler
 * Manages agent mode (safe/auto) preferences
 */

(function() {
    'use strict';

    // API configuration - use current server origin
    const API_BASE_URL = window.location.origin;

    const settingsButton = document.getElementById('chatSettings');
    const settingsModal = document.getElementById('agentSettingsModal');
    const settingsClose = document.getElementById('settingsClose');
    const saveButton = document.getElementById('saveSettings');
    const currentModeDisplay = document.getElementById('currentModeDisplay');
    
    let currentMode = 'safe';  // Default

    /**
     * Load current settings from server
     */
    async function loadSettings() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai/settings?user_id=1`);
            const data = await response.json();
            
            if (data.success && data.settings) {
                currentMode = data.settings.agent_mode || 'safe';
                updateUI(currentMode);
                console.log('✅ Settings loaded:', currentMode);
            }
        } catch (error) {
            console.error('❌ Failed to load settings:', error);
            currentMode = 'safe';
            updateUI('safe');
        }
    }

    /**
     * Save settings to server
     */
    async function saveSettings(mode) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: 1,
                    agent_mode: mode
                })
            });
            
            // Check if response is OK
            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
            
            // Check if response has content
            const text = await response.text();
            if (!text) {
                throw new Error('Empty response from server');
            }
            
            // Parse JSON
            const data = JSON.parse(text);
            
            if (data.success) {
                currentMode = mode;
                updateUI(mode);
                console.log('✅ Settings saved:', mode);
                
                // Show success message
                showSuccessMessage('Settings saved successfully!');
                
                // Close modal after short delay
                setTimeout(() => {
                    settingsModal.classList.add('hidden');
                }, 1000);
            } else {
                throw new Error(data.error || 'Failed to save settings');
            }
        } catch (error) {
            console.error('❌ Failed to save settings:', error);
            alert('Failed to save settings: ' + error.message);
        }
    }

    /**
     * Update UI to reflect current mode
     */
    function updateUI(mode) {
        // Update radio buttons
        const safeRadio = document.querySelector('input[name="agentMode"][value="safe"]');
        const autoRadio = document.querySelector('input[name="agentMode"][value="auto"]');
        
        if (safeRadio && autoRadio) {
            safeRadio.checked = (mode === 'safe');
            autoRadio.checked = (mode === 'auto');
        }
        
        // Update current mode display
        if (currentModeDisplay) {
            currentModeDisplay.textContent = mode === 'safe' ? '🛡️ Safe Mode' : '⚡ Auto Mode';
            currentModeDisplay.style.color = mode === 'safe' ? '#10b981' : '#f59e0b';
        }
        
        // Update option highlighting
        const safeModeOption = document.getElementById('safeModeOption');
        const autoModeOption = document.getElementById('autoModeOption');
        
        if (safeModeOption && autoModeOption) {
            if (mode === 'safe') {
                safeModeOption.style.borderColor = '#10b981';
                safeModeOption.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                autoModeOption.style.borderColor = '#e5e7eb';
                autoModeOption.style.backgroundColor = 'transparent';
            } else {
                autoModeOption.style.borderColor = '#f59e0b';
                autoModeOption.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
                safeModeOption.style.borderColor = '#e5e7eb';
                safeModeOption.style.backgroundColor = 'transparent';
            }
        }
    }

    /**
     * Show success message
     */
    function showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10001;
            animation: slideIn 0.3s ease;
        `;
        successDiv.textContent = '✓ ' + message;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => successDiv.remove(), 300);
        }, 2000);
    }

    // Event listeners
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            settingsModal.classList.remove('hidden');
            loadSettings();  // Refresh settings when opening
        });
    }

    if (settingsClose) {
        settingsClose.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
        });
    }

    if (settingsModal) {
        // Close on background click
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.add('hidden');
            }
        });
    }

    if (saveButton) {
        saveButton.addEventListener('click', () => {
            const selectedMode = document.querySelector('input[name="agentMode"]:checked')?.value || 'safe';
            saveSettings(selectedMode);
        });
    }

    // Handle radio button changes for visual feedback
    const modeRadios = document.querySelectorAll('input[name="agentMode"]');
    modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateUI(e.target.value);
        });
    });

    // Load initial settings on page load
    loadSettings();

    console.log('✅ Agent Settings UI initialized');
})();
