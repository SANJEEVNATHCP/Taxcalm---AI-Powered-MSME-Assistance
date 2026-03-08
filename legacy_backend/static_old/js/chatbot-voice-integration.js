/**
 * Chatbot Voice Integration
 * Connects Voice Agent with Chat Interface
 */

(function() {
    'use strict';

    let voiceAgent = null;
    let isVoiceMode = false;

    // Wait for DOM and Voice Agent to be ready
    function initVoiceIntegration() {
        // Wait for voice agent to be available
        const checkVoiceAgent = setInterval(() => {
            if (window.voiceAgent) {
                voiceAgent = window.voiceAgent;
                clearInterval(checkVoiceAgent);
                setupVoiceControls();
                console.log('✅ Chatbot voice integration ready');
            }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
            clearInterval(checkVoiceAgent);
            if (!voiceAgent) {
                console.warn('⚠️ Voice agent not available');
            }
        }, 5000);
    }

    /**
     * Setup voice controls in chat interface
     */
    function setupVoiceControls() {
        const voiceChatToggle = document.getElementById('voiceChatToggle');
        const voiceInputBtn = document.getElementById('voiceInputBtn');
        const stopVoiceMode = document.getElementById('stopVoiceMode');

        // Voice toggle in header
        if (voiceChatToggle) {
            voiceChatToggle.addEventListener('click', toggleVoiceMode);
        }

        // Voice input button in chat form
        if (voiceInputBtn) {
            voiceInputBtn.addEventListener('click', handleVoiceInput);
        }

        // Stop voice mode button
        if (stopVoiceMode) {
            stopVoiceMode.addEventListener('click', disableVoiceMode);
        }

        // Hook into voice agent events
        hookVoiceAgentEvents();
    }

    /**
     * Toggle voice mode on/off
     */
    function toggleVoiceMode() {
        if (isVoiceMode) {
            disableVoiceMode();
        } else {
            enableVoiceMode();
        }
    }

    /**
     * Enable voice mode
     */
    async function enableVoiceMode() {
        if (!voiceAgent) {
            addChatMessage('system', '❌ Voice recognition not available. Please check browser compatibility.');
            return;
        }

        if (!voiceAgent.recognition) {
            addChatMessage('system', '❌ Speech recognition not supported in your browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        // First, explicitly request microphone permission
        try {
            addChatMessage('system', '🎤 Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); // Stop the test stream
            addChatMessage('system', '✅ Microphone access granted! Starting voice mode...');
        } catch (error) {
            console.error('Microphone permission error:', error);
            let errorMsg = '❌ Microphone access denied. ';
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMsg += 'Please click the 🔒 lock icon in your address bar and allow microphone access, then try again.';
            } else if (error.name === 'NotFoundError') {
                errorMsg += 'No microphone found. Please connect a microphone and try again.';
            } else {
                errorMsg += 'Error: ' + error.message;
            }
            
            addChatMessage('system', errorMsg);
            addChatMessage('system', '💡 Need help? Visit: http://localhost:1000/static/microphone-setup.html');
            return;
        }

        isVoiceMode = true;
        voiceAgent.isVoiceMode = true; // Tell voice agent to keep listening
        const started = voiceAgent.startListening();

        if (!started && voiceAgent.isListening) {
            // Already listening, just update UI
        } else if (!started) {
            addChatMessage('system', '❌ Could not start voice recognition. Microphone may be in use by another application.');
            isVoiceMode = false;
            return;
        }

        // Update UI
        const voiceIcon = document.getElementById('voiceIcon');
        const voiceStatus = document.getElementById('voiceStatus');
        const voiceModeBanner = document.getElementById('voiceModeBanner');

        if (voiceIcon) voiceIcon.textContent = '🔴'; // Recording indicator
        if (voiceStatus) {
            voiceStatus.classList.remove('hidden');
            const statusText = document.getElementById('voiceStatusText');
            if (statusText) statusText.textContent = 'Listening...';
        }
        if (voiceModeBanner) voiceModeBanner.classList.remove('hidden');

        showListeningIndicator();
        addChatMessage('system', '🎤 Voice mode ON - I\'m listening! Just speak naturally and I\'ll respond.');
    }

    /**
     * Disable voice mode
     */
    function disableVoiceMode() {
        if (!voiceAgent) return;

        isVoiceMode = false;
        voiceAgent.isVoiceMode = false; // Tell voice agent to stop auto-restarting
        voiceAgent.stopListening();

        // Update UI
        const voiceIcon = document.getElementById('voiceIcon');
        const voiceStatus = document.getElementById('voiceStatus');
        const voiceModeBanner = document.getElementById('voiceModeBanner');

        if (voiceIcon) voiceIcon.textContent = '🎤';
        if (voiceStatus) voiceStatus.classList.add('hidden');
        if (voiceModeBanner) voiceModeBanner.classList.add('hidden');

        hideListeningIndicator();
    }

    /**
     * Handle single voice input (one-time listen)
     */
    function handleVoiceInput() {
        if (!voiceAgent || !voiceAgent.recognition) {
            addChatMessage('system', '❌ Voice input not available. Please check browser compatibility and permissions.');
            return;
        }

        // If already in voice mode, just show message
        if (isVoiceMode) {
            addChatMessage('system', '🎤 Already listening in voice mode. Speak your command.');
            return;
        }

        // Show listening state
        showListeningIndicator();
        addChatMessage('system', '🎤 Listening... Speak now.');

        // Start listening if not already
        if (!voiceAgent.isListening) {
            const started = voiceAgent.startListening();
            if (!started) {
                addChatMessage('system', '❌ Could not start listening. Please check microphone permissions.');
                hideListeningIndicator();
                return;
            }
        }

        // For single input mode, we let recognition run continuously
        // The user can click the button again or use voice mode toggle to stop
    }

    /**
     * Hook into voice agent events
     */
    function hookVoiceAgentEvents() {
        if (!voiceAgent || !voiceAgent.recognition) return;

        // Override the original showLiveTranscript method to display in UI
        const originalShowLiveTranscript = voiceAgent.showLiveTranscript;
        voiceAgent.showLiveTranscript = function(transcript) {
            updateLiveTranscript(transcript);
            if (originalShowLiveTranscript) {
                originalShowLiveTranscript.call(voiceAgent, transcript);
            }
        };

        // Override the original speak method to show in chat
        const originalSpeak = voiceAgent.speak;
        voiceAgent.speak = function(text) {
            addChatMessage('assistant', text);
            if (originalSpeak) {
                originalSpeak.call(voiceAgent, text);
            }
        };

        // Override handleFinalTranscript to show user's spoken text in chat
        const originalHandleFinalTranscript = voiceAgent.handleFinalTranscript;
        voiceAgent.handleFinalTranscript = function(transcript) {
            // Show what user said
            addChatMessage('user', transcript, true);
            
            // Clear live transcript
            updateLiveTranscript('');
            
            // Call original handler
            if (originalHandleFinalTranscript) {
                originalHandleFinalTranscript.call(voiceAgent, transcript);
            }
        };
    }

    /**
     * Show listening indicator
     */
    function showListeningIndicator() {
        const indicator = document.getElementById('voiceListeningIndicator');
        if (indicator) {
            indicator.classList.remove('hidden');
            // Scroll to show it
            indicator.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }

    /**
     * Hide listening indicator
     */
    function hideListeningIndicator() {
        const indicator = document.getElementById('voiceListeningIndicator');
        if (indicator) {
            indicator.classList.add('hidden');
        }
        updateLiveTranscript('');
    }

    /**
     * Update live transcript display
     */
    function updateLiveTranscript(text) {
        const liveTranscript = document.getElementById('liveTranscript');
        if (liveTranscript) {
            liveTranscript.textContent = text || 'Listening...';
        }
    }

    /**
     * Add message to chat
     */
    function addChatMessage(sender, message, isVoice = false) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'glass rounded-lg p-4 animate-fade-in';

        if (sender === 'user') {
            messageDiv.classList.add('bg-blue-600', 'bg-opacity-20', 'ml-8');
            const voiceIndicator = isVoice ? '<span class="text-xs">🎤</span> ' : '';
            messageDiv.innerHTML = `
                <div class="flex items-start gap-2">
                    <div class="flex-1">
                        <p class="text-sm text-white">${voiceIndicator}${escapeHtml(message)}</p>
                    </div>
                </div>
            `;
        } else if (sender === 'assistant') {
            messageDiv.classList.add('mr-8');
            messageDiv.innerHTML = `
                <div class="flex items-start gap-2">
                    <div class="text-2xl">🤖</div>
                    <div class="flex-1">
                        <p class="text-sm text-blue-200">${escapeHtml(message)}</p>
                    </div>
                </div>
            `;
        } else if (sender === 'system') {
            messageDiv.classList.add('bg-yellow-500', 'bg-opacity-10', 'border', 'border-yellow-500', 'border-opacity-30');
            messageDiv.innerHTML = `
                <p class="text-xs text-yellow-300 text-center">${escapeHtml(message)}</p>
            `;
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Add CSS for animations
     */
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
                animation: fade-in 0.3s ease-out;
            }
            #voiceIcon {
                display: inline-block;
                transition: transform 0.2s;
            }
            #voiceChatToggle:hover #voiceIcon {
                transform: scale(1.2);
            }
            @keyframes pulse-wave {
                0%, 100% { height: 1rem; }
                50% { height: 2rem; }
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            addStyles();
            initVoiceIntegration();
        });
    } else {
        addStyles();
        initVoiceIntegration();
    }

    // Make available globally
    window.chatbotVoiceIntegration = {
        addMessage: addChatMessage,
        toggleVoice: toggleVoiceMode,
        isActive: () => isVoiceMode
    };

})();
