/**
 * TaxCalm Voice Agent - Browser Web Speech API
 * Comprehensive voice integration with Speech-to-Text, Text-to-Speech, and Voice Commands
 * Supports 12 Indian languages + English
 */
class VoiceAgent {
    constructor() {
        this.isListening = false;
        this.isSpeaking = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.currentLanguage = localStorage.getItem('taxcalm_voice_lang') || 'en-IN';
        this.voices = [];
        this.autoListen = false;
        this.commandMode = true;
        this.permissionChecked = false;
        this.permissionGranted = false;
        
        // Voice command patterns
        this.commands = {
            'open calculator': () => this.navigateTo('calculator'),
            'open dashboard': () => this.navigateTo('calculator'),
            'open home': () => this.navigateTo('calculator'),
            'open finance': () => this.navigateTo('finance'),
            'open accounting': () => this.navigateTo('finance'),
            'open reports': () => this.navigateTo('reports'),
            'open analytics': () => this.navigateTo('analytics'),
            'open profile': () => this.navigateTo('profile'),
            'open settings': () => this.navigateTo('settings'),
            'calculate gst': () => this.triggerGSTCalculation(),
            'calculate': () => this.triggerGSTCalculation(),
            'help': () => this.showHelp(),
            'stop listening': () => this.stopListening(),
            'stop': () => this.stopListening()
        };

        // Supported languages (all Indian languages + English)
        this.languages = {
            'en-IN': 'English (India)',
            'hi-IN': 'हिन्दी (Hindi)',
            'ta-IN': 'தமிழ் (Tamil)',
            'te-IN': 'తెలుగు (Telugu)',
            'bn-IN': 'বাংলা (Bengali)',
            'mr-IN': 'मराठी (Marathi)',
            'gu-IN': 'ગુજરાતી (Gujarati)',
            'kn-IN': 'ಕನ್ನಡ (Kannada)',
            'ml-IN': 'മലയാളം (Malayalam)',
            'pa-IN': 'ਪੰਜਾਬੀ (Punjabi)',
            'or-IN': 'ଓଡ଼ିଆ (Odia)',
            'as-IN': 'অসমীয়া (Assamese)'
        };

        this.initialize();
    }

    initialize() {
        // Check browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('⚠️ Web Speech API not supported in this browser');
            this.showNotification('Voice features require Chrome, Edge, or Safari', 'warning');
            return;
        }

        // Initialize Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = this.currentLanguage;
        this.recognition.maxAlternatives = 3;

        // Event handlers
        this.recognition.onstart = () => this.onRecognitionStart();
        this.recognition.onresult = (event) => this.onRecognitionResult(event);
        this.recognition.onerror = (event) => this.onRecognitionError(event);
        this.recognition.onend = () => this.onRecognitionEnd();

        // Load voices for TTS
        this.loadVoices();
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = () => this.loadVoices();
        }

        // Create voice control UI
        this.createVoiceUI();

        console.log('✅ Voice Agent initialized with Web Speech API');
    }

    loadVoices() {
        this.voices = this.synthesis.getVoices();
        
        // Prefer Indian voices
        const preferredVoices = this.voices.filter(voice => 
            voice.lang.includes('-IN') || voice.name.includes('Indian')
        );
        
        if (preferredVoices.length > 0) {
            this.voices = [...preferredVoices, ...this.voices];
        }
    }

    createVoiceUI() {
        // Check if UI already exists
        if (document.getElementById('voice-control-panel')) return;

        const voicePanel = document.createElement('div');
        voicePanel.id = 'voice-control-panel';
        voicePanel.className = 'fixed bottom-6 right-6 z-40';
        voicePanel.innerHTML = `
            <style>
                @keyframes voice-pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }
                
                @keyframes voice-ripple {
                    0% { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                
                .voice-active-pulse {
                    animation: voice-pulse 1.5s ease-in-out infinite;
                }
                
                .voice-listening::before {
                    content: '';
                    position: absolute;
                    inset: -4px;
                    border-radius: 50%;
                    background: linear-gradient(45deg, #FFD700, #FFA500);
                    animation: voice-ripple 1.5s ease-out infinite;
                    z-index: -1;
                }
                
                #voice-toggle-btn:hover {
                    transform: scale(1.05);
                }
                
                #voice-toggle-btn.listening {
                    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                    box-shadow: 0 8px 24px rgba(255, 165, 0, 0.4);
                }
            </style>
            
            <!-- Voice Button -->
            <button id="voice-toggle-btn" 
                    class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center text-white text-2xl relative group border-2 border-white/20"
                    title="Click to start voice input (Ctrl+Shift+V)"
                    style="backdrop-filter: blur(10px);">
                <span id="voice-icon" class="relative z-10">🎤</span>
                <div class="absolute -top-14 right-0 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-xs px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-gray-700">
                    <div class="font-semibold mb-0.5">Voice Assistant</div>
                    <div class="text-gray-400">Press Ctrl+Shift+V</div>
                </div>
            </button>

            <!-- Voice Status Indicator -->
            <div id="voice-status" class="hidden mt-3 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-2xl p-4 text-sm min-w-[240px] border border-gray-200 dark:border-gray-700"
                 style="backdrop-filter: blur(10px);">
                <div class="flex items-center gap-3 mb-2">
                    <div class="relative flex items-center">
                        <span class="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg"></span>
                        <span class="absolute w-3 h-3 bg-emerald-400 rounded-full animate-ping"></span>
                    </div>
                    <span id="voice-status-text" class="font-semibold text-gray-800 dark:text-gray-100">Listening...</span>
                </div>
                <div id="voice-transcript" class="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 text-xs italic min-h-[40px] border border-gray-200 dark:border-gray-600">
                    Speak now...
                </div>
                <div class="mt-2 flex gap-2">
                    <button id="voice-stop-btn" class="flex-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors">
                        Stop
                    </button>
                    <button id="voice-send-btn" class="flex-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors">
                        Send to Chat
                    </button>
                </div>
            </div>

            <!-- Language Selector Panel -->
            <div id="voice-lang-selector" class="hidden mt-3 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-2xl p-4 border border-gray-200 dark:border-gray-700"
                 style="backdrop-filter: blur(10px);">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <span>🌐</span> Voice Settings
                    </h3>
                    <button id="voice-settings-close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg">
                        ✕
                    </button>
                </div>
                
                <div class="space-y-3">
                    <div>
                        <label class="text-xs font-semibold mb-1.5 block text-gray-700 dark:text-gray-300">
                            Language:
                        </label>
                        <select id="voice-language-select" class="w-full text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 dark:text-gray-200 focus:border-blue-500 focus:outline-none transition-colors">
                            ${Object.entries(this.languages).map(([code, name]) => 
                                `<option value="${code}" ${code === this.currentLanguage ? 'selected' : ''}>${name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <label class="flex items-start gap-2 text-xs cursor-pointer">
                            <input type="checkbox" id="voice-commands-toggle" ${this.commandMode ? 'checked' : ''} class="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                            <div>
                                <div class="font-semibold text-gray-800 dark:text-gray-200">Voice Commands</div>
                                <div class="text-gray-600 dark:text-gray-400 mt-1">Enable navigation commands like "open calculator", "calculate GST"</div>
                            </div>
                        </label>
                    </div>
                    
                    <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                            <div class="font-semibold mb-1">💡 Quick Commands:</div>
                            <div class="space-y-0.5 text-[10px]">
                                <div>• "Open calculator" - Open GST calculator</div>
                                <div>• "Calculate GST" - Trigger calculation</div>
                                <div>• "Open finance" - Open finance tab</div>
                                <div>• "Help" - Show all commands</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Settings Button -->
            <button id="voice-settings-btn" 
                    class="mt-3 w-16 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-gray-700 dark:text-gray-300 text-xl border border-gray-300 dark:border-gray-600"
                    title="Voice settings">
                ⚙️
            </button>
        `;

        document.body.appendChild(voicePanel);

        // Event listeners
        document.getElementById('voice-toggle-btn').addEventListener('click', () => this.toggleListening());
        document.getElementById('voice-settings-btn').addEventListener('click', () => this.toggleSettings());
        document.getElementById('voice-language-select').addEventListener('change', (e) => this.changeLanguage(e.target.value));
        document.getElementById('voice-commands-toggle').addEventListener('change', (e) => {
            this.commandMode = e.target.checked;
            localStorage.setItem('taxcalm_voice_commands', this.commandMode);
        });
        
        // New button listeners
        document.getElementById('voice-stop-btn').addEventListener('click', () => this.stopListening());
        document.getElementById('voice-send-btn').addEventListener('click', () => this.sendTranscriptToChat());
        document.getElementById('voice-settings-close').addEventListener('click', () => {
            document.getElementById('voice-lang-selector').classList.add('hidden');
        });

        // Keyboard shortcut: Ctrl/Cmd + Shift + V
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                this.toggleListening();
            }
        });
    }

    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    startListening() {
        if (!this.recognition) {
            this.showNotification('Voice recognition not available in this browser', 'error');
            return;
        }

        if (this.isListening) return;

        // If permission was already denied, don't try again
        if (this.permissionChecked && !this.permissionGranted) {
            this.showNotification('🎤 Microphone access was denied. Please enable it in browser settings.', 'error');
            return;
        }

        // If permission was already granted, skip the check
        if (this.permissionGranted) {
            this._startRecognition();
            return;
        }

        // Only check permission the first time
        if (!this.permissionChecked) {
            this.permissionChecked = true;
            
            // Try to start recognition directly - browser will request permission if needed
            // This is better than navigator.permissions.query which may trigger repeated dialogs
            try {
                this._startRecognition();
                // Mark as granted - if denied, the error handler will update this
                this.permissionGranted = true;
            } catch (error) {
                console.error('Voice recognition error:', error);
                this.permissionGranted = false;
                this.showNotification('Could not start voice recognition', 'error');
            }
        } else {
            this._startRecognition();
        }
    }

    _startRecognition() {
        try {
            this.recognition.start();
            this.isListening = true;
        } catch (error) {
            console.error('Error starting recognition:', error);
            this.showNotification('Could not start voice recognition', 'error');
            this.isListening = false;
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.error('Error stopping recognition:', error);
            }
            this.isListening = false;
        }
    }

    onRecognitionStart() {
        console.log('🎤 Voice recognition started');
        // If recognition started, permission was granted
        this.permissionGranted = true;
        this.permissionChecked = true;
        this.updateUI('listening');
    }

    onRecognitionResult(event) {
        const results = event.results;
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < results.length; i++) {
            const transcript = results[i][0].transcript;
            if (results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        // Update UI with interim results
        const transcriptEl = document.getElementById('voice-transcript');
        if (transcriptEl) {
            transcriptEl.textContent = interimTranscript || finalTranscript || 'Speak now...';
        }

        // Process final transcript
        if (finalTranscript) {
            this.processTranscript(finalTranscript.trim());
        }
    }

    onRecognitionError(event) {
        console.error('❌ Recognition error:', event.error);
        
        // Handle permission denied
        if (event.error === 'not-allowed') {
            this.permissionGranted = false;
            this.permissionChecked = true;
        }
        
        const errorMessages = {
            'no-speech': 'No speech detected. Please try again.',
            'audio-capture': 'Microphone not accessible. Please check permissions.',
            'not-allowed': 'Microphone permission denied. Please enable it in browser settings.',
            'network': 'Network error. Check your internet connection.',
            'aborted': 'Recognition aborted.'
        };

        const message = errorMessages[event.error] || `Recognition error: ${event.error}`;
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
            this.showNotification(message, 'error');
        }
        this.updateUI('error');
    }

    onRecognitionEnd() {
        console.log('🎤 Voice recognition ended');
        this.isListening = false;
        this.updateUI('idle');

        // Auto-restart if enabled
        if (this.autoListen) {
            setTimeout(() => this.startListening(), 1000);
        }
    }

    processTranscript(transcript) {
        console.log('📝 Transcript:', transcript);

        const lowerTranscript = transcript.toLowerCase();

        // Check for voice commands if enabled
        if (this.commandMode) {
            let commandFound = false;
            for (const [command, action] of Object.entries(this.commands)) {
                if (lowerTranscript.includes(command)) {
                    this.speak(`${command.charAt(0).toUpperCase() + command.slice(1)}`);
                    action();
                    commandFound = true;
                    break;
                }
            }

            if (commandFound) return;
        }

        // If no command, send to chatbot
        this.sendToChatbot(transcript);
    }

    navigateTo(section) {
        console.log(`🧭 Navigating to: ${section}`);
        
        const tabMap = {
            'calculator': '[data-tab="calculator"]',
            'finance': '[data-tab="finance"]',
            'reports': '[data-tab="reports"]',
            'analytics': '[data-tab="analytics"]',
            'profile': '[data-tab="profile"]',
            'settings': '[data-tab="settings"]'
        };

        const selector = tabMap[section];
        if (selector) {
            const tabButton = document.querySelector(selector);
            if (tabButton) {
                tabButton.click();
            }
        }
    }

    triggerGSTCalculation() {
        console.log('🧮 Triggering GST calculation');
        const calculateBtn = document.getElementById('calculateBtn') || 
                           document.querySelector('[onclick*="calculate"]');
        if (calculateBtn) {
            calculateBtn.click();
        }
    }

    sendToChatbot(text) {
        console.log('💬 Sending to chatbot:', text);
        
        const chatInput = document.getElementById('chatInput') || 
                         document.getElementById('userInput') ||
                         document.querySelector('[name="chatInput"]');
        
        if (chatInput) {
            chatInput.value = text;
            
            // Try multiple ways to send
            const form = chatInput.closest('form');
            if (form) {
                form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                return;
            }
            
            const sendBtn = document.getElementById('sendBtn') || 
                          document.getElementById('chatSend') ||
                          document.querySelector('[onclick*="send"]');
            
            if (sendBtn) {
                sendBtn.click();
            } else {
                // Trigger enter key
                const enterEvent = new KeyboardEvent('keydown', { 
                    key: 'Enter', 
                    keyCode: 13, 
                    bubbles: true 
                });
                chatInput.dispatchEvent(enterEvent);
            }
        } else {
            this.showNotification('Chat interface not found', 'warning');
        }
    }

    speak(text, options = {}) {
        if (this.isSpeaking) {
            this.synthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = options.lang || this.currentLanguage;
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 0.8;

        // Select appropriate voice
        const voice = this.voices.find(v => v.lang === utterance.lang) || this.voices[0];
        if (voice) {
            utterance.voice = voice;
        }

        utterance.onstart = () => {
            this.isSpeaking = true;
            console.log('🔊 Speaking:', text);
        };

        utterance.onend = () => {
            this.isSpeaking = false;
        };

        utterance.onerror = (event) => {
            console.error('❌ Speech synthesis error:', event.error);
            this.isSpeaking = false;
        };

        this.synthesis.speak(utterance);
    }

    changeLanguage(langCode) {
        this.currentLanguage = langCode;
        if (this.recognition) {
            this.recognition.lang = langCode;
        }
        localStorage.setItem('taxcalm_voice_lang', langCode);
        console.log(`🌐 Language changed to: ${this.languages[langCode]}`);
        this.showNotification(`Language: ${this.languages[langCode]}`, 'success');
    }

    toggleSettings() {
        const settingsPanel = document.getElementById('voice-lang-selector');
        if (settingsPanel) {
            settingsPanel.classList.toggle('hidden');
        }
    }

    showHelp() {
        const helpText = `Voice Commands:\n• Open Calculator/Dashboard\n• Open Finance/Accounting\n• Open Reports\n• Open Analytics\n• Calculate GST\n• Help\n• Stop Listening\n\nOr ask any question!`;
        console.log(helpText);
        this.speak('Here are the available voice commands.');
        this.showNotification(helpText, 'info');
    }

    updateUI(state) {
        const voiceIcon = document.getElementById('voice-icon');
        const voiceStatus = document.getElementById('voice-status');
        const toggleBtn = document.getElementById('voice-toggle-btn');

        if (!voiceIcon || !toggleBtn) return;

        switch (state) {
            case 'listening':
                voiceIcon.textContent = '🎙️';
                toggleBtn.classList.add('listening', 'voice-listening', 'voice-active-pulse');
                voiceStatus.classList.remove('hidden');
                document.getElementById('voice-status-text').textContent = 'Listening...';
                document.getElementById('voice-transcript').textContent = 'Speak now...';
                break;
            
            case 'processing':
                voiceIcon.textContent = '⏳';
                toggleBtn.classList.remove('voice-active-pulse');
                document.getElementById('voice-status-text').textContent = 'Processing...';
                break;
            
            case 'error':
                voiceIcon.textContent = '❌';
                toggleBtn.classList.remove('listening', 'voice-listening', 'voice-active-pulse');
                document.getElementById('voice-status-text').textContent = 'Error';
                setTimeout(() => {
                    if (voiceIcon) voiceIcon.textContent = '🎤';
                }, 1500);
                break;
            
            case 'idle':
            default:
                voiceIcon.textContent = '🎤';
                toggleBtn.classList.remove('listening', 'voice-listening', 'voice-active-pulse');
                voiceStatus.classList.add('hidden');
                break;
        }
    }

    sendTranscriptToChat() {
        const transcript = document.getElementById('voice-transcript')?.textContent;
        if (transcript && transcript !== 'Speak now...' && transcript.trim()) {
            // Find chat input and send the transcript
            const chatInput = document.getElementById('chatInput');
            if (chatInput) {
                chatInput.value = transcript;
                // Trigger the chat form submission
                const chatForm = document.getElementById('chatForm');
                if (chatForm) {
                    chatForm.dispatchEvent(new Event('submit'));
                }
            }
            this.showNotification('Transcript sent to chat', 'success');
            this.stopListening();
        } else {
            this.showNotification('No transcript to send', 'warning');
        }
    }

    showNotification(message, type = 'info') {
        // Try to use existing toast system
        if (typeof showToast === 'function') {
            showToast(message, type);
            return;
        }

        // Fallback notification
        const notification = document.createElement('div');
        const colors = {
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            success: 'bg-green-500',
            info: 'bg-blue-500'
        };
        
        notification.className = `fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg max-w-sm ${colors[type] || colors.info} text-white text-sm`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    // Public API
    isAvailable() {
        return this.recognition !== null;
    }

    getAvailableLanguages() {
        return this.languages;
    }

    setAutoListen(enabled) {
        this.autoListen = enabled;
    }
}

// Global instance
let voiceAgent = null;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        voiceAgent = new VoiceAgent();
        window.voiceAgent = voiceAgent;
    });
} else {
    voiceAgent = new VoiceAgent();
    window.voiceAgent = voiceAgent;
}

console.log('✅ Voice Agent with Web Speech API loaded');
