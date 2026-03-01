/**
 * Google Translate Integration
 * Provides automatic translation using Google Cloud Translation API
 * and Google Translate Widget for MSME Compliance Assistant
 */

class GoogleTranslateService {
    constructor() {
        this.apiKey = null;
        this.apiEndpoint = 'https://translation.googleapis.com/language/translate/v2';
        this.supportedLanguages = [
            { code: 'en', name: 'English', nativeName: 'English' },
            { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
            { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
            { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
            { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
            { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
            { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
            { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
            { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
            { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
            { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
            { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' }
        ];
        this.cache = new Map();
        this.widgetLoaded = false;
        this.useWidget = true; // Use Google Translate Widget by default
        this.loadAPIKey();
    }

    /**
     * Load API key from localStorage or config
     */
    loadAPIKey() {
        const storedKey = localStorage.getItem('google_translate_api_key');
        if (storedKey) {
            this.apiKey = storedKey;
        }
    }

    /**
     * Set Google Cloud Translation API key
     * @param {string} key - API key from Google Cloud Console
     */
    setAPIKey(key) {
        this.apiKey = key;
        localStorage.setItem('google_translate_api_key', key);
        console.log('✅ Google Translate API key configured');
    }

    /**
     * Initialize Google Translate Widget
     * This provides the visual translation dropdown
     */
    initWidget() {
        if (this.widgetLoaded) {
            console.log('Google Translate Widget already loaded');
            return;
        }

        console.log('🔄 Loading Google Translate Widget...');

        // Store reference to this instance
        const self = this;

        // Create initialization function FIRST (must exist before script loads)
        window.googleTranslateElementInit = () => {
            try {
                if (typeof google === 'undefined' || !google.translate) {
                    console.error('❌ Google Translate library not loaded');
                    return;
                }

                new google.translate.TranslateElement({
                    pageLanguage: 'en',
                    includedLanguages: 'en,hi,ta,te,mr,gu,kn,ml,pa,bn,or,as',
                    layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false,
                    multilanguagePage: true
                }, 'google_translate_element');
                
                self.widgetLoaded = true;
                console.log('✅ Google Translate Widget initialized successfully');
                
                // Sync with existing i18n system
                self.syncWithI18n();
            } catch (error) {
                console.error('❌ Error initializing Google Translate:', error);
            }
        };

        // Add Google Translate script
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        script.onerror = () => {
            console.error('❌ Failed to load Google Translate script');
            console.error('💡 Check your internet connection or firewall settings');
        };
        script.onload = () => {
            console.log('📥 Google Translate script loaded from server');
        };
        document.head.appendChild(script);
    }

    /**
     * Sync Google Translate Widget with existing i18n system
     */
    syncWithI18n() {
        if (window.i18n) {
            // Listen to i18n language changes
            const originalSetLanguage = window.i18n.setLanguage.bind(window.i18n);
            window.i18n.setLanguage = (lang) => {
                originalSetLanguage(lang);
                this.setWidgetLanguage(lang);
            };
        }
    }

    /**
     * Set Google Translate Widget language programmatically
     * @param {string} langCode - Language code (en, hi, ta, etc.)
     */
    setWidgetLanguage(langCode) {
        if (!this.widgetLoaded) {
            console.warn('⚠️ Google Translate Widget not loaded yet, will retry...');
            // Retry after a short delay
            setTimeout(() => this.setWidgetLanguage(langCode), 500);
            return;
        }

        // Find Google Translate combo element
        const selectElement = document.querySelector('.goog-te-combo');
        if (selectElement) {
            // Change the language
            selectElement.value = langCode;
            
            // Trigger change event multiple ways to ensure it fires
            const changeEvent = new Event('change', { bubbles: true });
            selectElement.dispatchEvent(changeEvent);
            
            // Also try click event
            selectElement.click();
            
            console.log(`✅ Google Translate set to: ${langCode}`);
        } else {
            console.warn('⚠️ Google Translate dropdown not found, retrying...');
            // Retry if element not found
            setTimeout(() => this.setWidgetLanguage(langCode), 1000);
        }
    }

    /**
     * Translate text using Google Cloud Translation API
     * @param {string} text - Text to translate
     * @param {string} targetLang - Target language code
     * @param {string} sourceLang - Source language code (default: 'en')
     * @returns {Promise<string>} - Translated text
     */
    async translateText(text, targetLang, sourceLang = 'en') {
        if (!text) return '';
        if (targetLang === sourceLang) return text;

        // Check cache
        const cacheKey = `${sourceLang}:${targetLang}:${text}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // If using widget mode, return original (widget handles translation)
        if (this.useWidget && this.widgetLoaded) {
            return text;
        }

        // Check if API key is available
        if (!this.apiKey) {
            console.warn('⚠️ Google Translate API key not configured. Using widget mode.');
            return text;
        }

        try {
            const url = `${this.apiEndpoint}?key=${this.apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: text,
                    source: sourceLang,
                    target: targetLang,
                    format: 'text'
                })
            });

            if (!response.ok) {
                throw new Error(`Translation API error: ${response.status}`);
            }

            const data = await response.json();
            const translatedText = data.data.translations[0].translatedText;
            
            // Cache the result
            this.cache.set(cacheKey, translatedText);
            
            return translatedText;
        } catch (error) {
            console.error('Translation error:', error);
            return text; // Return original text on error
        }
    }

    /**
     * Translate multiple texts in batch
     * @param {Array<string>} texts - Array of texts to translate
     * @param {string} targetLang - Target language code
     * @param {string} sourceLang - Source language code (default: 'en')
     * @returns {Promise<Array<string>>} - Array of translated texts
     */
    async translateBatch(texts, targetLang, sourceLang = 'en') {
        if (!this.apiKey) {
            console.warn('⚠️ Google Translate API key not configured');
            return texts;
        }

        try {
            const url = `${this.apiEndpoint}?key=${this.apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: texts,
                    source: sourceLang,
                    target: targetLang,
                    format: 'text'
                })
            });

            if (!response.ok) {
                throw new Error(`Translation API error: ${response.status}`);
            }

            const data = await response.json();
            return data.data.translations.map(t => t.translatedText);
        } catch (error) {
            console.error('Batch translation error:', error);
            return texts;
        }
    }

    /**
     * Detect language of given text
     * @param {string} text - Text to detect language
     * @returns {Promise<string>} - Detected language code
     */
    async detectLanguage(text) {
        if (!this.apiKey) {
            console.warn('⚠️ Google Translate API key not configured');
            return 'en';
        }

        try {
            const url = `https://translation.googleapis.com/language/translate/v2/detect?key=${this.apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: text
                })
            });

            if (!response.ok) {
                throw new Error(`Language detection error: ${response.status}`);
            }

            const data = await response.json();
            const detectedLang = data.data.detections[0][0].language;
            console.log(`🔍 Detected language: ${detectedLang}`);
            return detectedLang;
        } catch (error) {
            console.error('Language detection error:', error);
            return 'en';
        }
    }

    /**
     * Translate all page content with data-translate attribute
     * @param {string} targetLang - Target language code
     */
    async translatePage(targetLang) {
        const elements = document.querySelectorAll('[data-translate]');
        const texts = Array.from(elements).map(el => el.textContent.trim());
        
        if (texts.length === 0) return;

        try {
            const translations = await this.translateBatch(texts, targetLang);
            elements.forEach((el, index) => {
                if (translations[index]) {
                    el.textContent = translations[index];
                }
            });
            console.log(`✅ Page translated to ${targetLang}`);
        } catch (error) {
            console.error('Page translation error:', error);
        }
    }

    /**
     * Get list of supported languages
     * @returns {Array} - Array of language objects
     */
    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    /**
     * Toggle between Widget mode and API mode
     * @param {boolean} useWidget - True for Widget mode, False for API mode
     */
    setMode(useWidget) {
        this.useWidget = useWidget;
        console.log(`Translation mode: ${useWidget ? 'Widget' : 'API'}`);
    }

    /**
     * Clear translation cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Translation cache cleared');
    }

    /**
     * Get cache statistics
     * @returns {Object} - Cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }

    /**
     * Translate AI assistant responses
     * @param {string} text - AI response text
     * @param {string} targetLang - Target language
     * @returns {Promise<string>} - Translated response
     */
    async translateAIResponse(text, targetLang) {
        if (targetLang === 'en') return text;
        
        try {
            const translated = await this.translateText(text, targetLang, 'en');
            return translated;
        } catch (error) {
            console.error('AI response translation error:', error);
            return text;
        }
    }

    /**
     * Translate user input from local language to English for AI
     * @param {string} text - User input
     * @param {string} sourceLang - Source language
     * @returns {Promise<string>} - Translated to English
     */
    async translateUserInput(text, sourceLang) {
        if (sourceLang === 'en') return text;
        
        try {
            const translated = await this.translateText(text, 'en', sourceLang);
            console.log(`🔄 User input translated: ${sourceLang} → en`);
            return translated;
        } catch (error) {
            console.error('User input translation error:', error);
            return text;
        }
    }
}

// Initialize Google Translate Service
window.googleTranslate = new GoogleTranslateService();

// Auto-initialize widget on page load with timeout
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🌐 Initializing Google Translate on DOM ready...');
        window.googleTranslate.initWidget();
        
        // Check if widget loaded after 5 seconds
        setTimeout(() => {
            if (!window.googleTranslate.widgetLoaded) {
                console.warn('⚠️ Google Translate widget failed to load after 5s');
                console.warn('💡 Translation will work through i18n system only');
            }
        }, 5000);
    });
} else {
    console.log('🌐 Initializing Google Translate immediately...');
    window.googleTranslate.initWidget();
    
    // Check if widget loaded after 5 seconds
    setTimeout(() => {
        if (!window.googleTranslate.widgetLoaded) {
            console.warn('⚠️ Google Translate widget failed to load after 5s');
            console.warn('💡 Translation will work through i18n system only');
        }
    }, 5000);
}

console.log('✅ Google Translate Service loaded');
