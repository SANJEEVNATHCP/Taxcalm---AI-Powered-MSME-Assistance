/**
 * Google Translator - Client-side Integration
 * Uses server-side translation API to translate content
 * Works even when external Google services are blocked
 */

class Translator {
    constructor() {
        this.apiEndpoint = '/api/translate';
        this.batchEndpoint = '/api/translate/batch';
        this.languagesEndpoint = '/api/translate/languages';
        this.cache = new Map();
        this.currentLanguage = 'en';
        this.isTranslating = false;
        
        console.log('✅ Translator Service initialized');
    }

    /**
     * Set current language
     * @param {string} langCode - Language code (en, hi, ta, etc.)
     */
    setLanguage(langCode) {
        this.currentLanguage = langCode;
        localStorage.setItem('preferred_language', langCode);
        console.log(`🌐 Language set to: ${langCode}`);
    }

    /**
     * Get current language
     * @returns {string} Current language code
     */
    getLanguage() {
        return this.currentLanguage;
    }

    /**
     * Translate single text
     * @param {string} text - Text to translate
     * @param {string} targetLang - Target language code
     * @param {string} sourceLang - Source language code (default: 'en')
     * @returns {Promise<string>} Translated text
     */
    async translate(text, targetLang, sourceLang = 'en') {
        // Skip if same language
        if (targetLang === sourceLang || targetLang === 'en') {
            return text;
        }

        // Skip empty text
        if (!text || text.trim().length === 0) {
            return text;
        }

        // Check cache
        const cacheKey = `${sourceLang}_${targetLang}_${text}`;
        if (this.cache.has(cacheKey)) {
            console.log('📦 Cache hit:', text.substring(0, 30));
            return this.cache.get(cacheKey);
        }

        try {
            console.log(`🔄 Translating: "${text.substring(0, 50)}..." from ${sourceLang} to ${targetLang}`);
            
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    target_lang: targetLang,
                    source_lang: sourceLang
                })
            });

            if (!response.ok) {
                throw new Error(`Translation failed: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success && data.translated) {
                // Cache the result
                this.cache.set(cacheKey, data.translated);
                console.log(`✅ Translated to: "${data.translated.substring(0, 50)}..."`);
                return data.translated;
            }

            return text; // Return original on failure
        } catch (error) {
            console.error('❌ Translation error:', error);
            return text; // Return original text on error
        }
    }

    /**
     * Translate multiple texts at once
     * @param {Array<string>} texts - Array of texts to translate
     * @param {string} targetLang - Target language code
     * @param {string} sourceLang - Source language code (default: 'en')
     * @returns {Promise<Array<string>>} Array of translated texts
     */
    async translateBatch(texts, targetLang, sourceLang = 'en') {
        // Skip if same language
        if (targetLang === sourceLang || targetLang === 'en') {
            return texts;
        }

        try {
            const response = await fetch(this.batchEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    texts: texts,
                    target_lang: targetLang,
                    source_lang: sourceLang
                })
            });

            if (!response.ok) {
                throw new Error(`Batch translation failed: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success && data.translated) {
                return data.translated;
            }

            return texts; // Return original on failure
        } catch (error) {
            console.error('Batch translation error:', error);
            return texts; // Return original texts on error
        }
    }

    /**
     * Translate page content dynamically
     * @param {string} targetLang - Target language code  
     */
    async translatePage(targetLang) {
        if (this.isTranslating) {
            console.log('⏳ Translation already in progress...');
            return;
        }
        
        if (targetLang === 'en') {
            this.restoreOriginal();
            return;
        }

        this.isTranslating = true;
        console.log(`🔄 Starting page translation to: ${targetLang}`);

        try {
            // Find all text nodes to translate
            const elements = [];
            const texts = [];
            
            // Helper function to get all text content from an element
            const getDirectText = (el) => {
                let text = '';
                for (let node of el.childNodes) {
                    if (node.nodeType === 3) { // Text node
                        text += node.textContent;
                    }
                }
                return text.trim();
            };
            
            // Select all elements with text content
            const allElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, button, a, label, li, td, th');
            
            allElements.forEach(el => {
                // Get text content (including all child text nodes)
                const text = el.textContent.trim();
                
                if (!text || text.length < 2) return;
                
                // Skip script/style elements
                if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
                
                // Skip input/select/textarea and their children
                if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' || el.tagName === 'OPTION') return;
                if (el.closest('select, input, textarea, option')) return;
                
                // Skip language selector specifically
                if (el.id === 'languageSelector' || el.closest('#languageSelector')) return;
                
                // Skip header actions (contains language selector)
                if (el.closest('.header-actions')) return;
                
                // Skip notification icons, search bars, etc.
                if (el.closest('.header-icon')) return;
                
                // Skip elements that should never be translated
                if (el.hasAttribute('data-no-translate')) return;
                
                // Skip if element contains other translatable children (to avoid duplicates)
                const hasTranslatableChildren = Array.from(el.children).some(child => 
                    ['H1','H2','H3','H4','H5','H6','P','SPAN','DIV','BUTTON','A','LABEL'].includes(child.tagName)
                );
                if (hasTranslatableChildren && el.children.length > 0) {
                    // Only translate if it has its own direct text
                    const directText = getDirectText(el);
                    if (directText.length < 2) return;
                }
                
                // Skip numbers only, dates, emails, URLs
                if (/^[\d\s\-\/\.,\:]+$/.test(text)) return;
                if (/@|http|www\.|\.com|\.in/.test(text)) return;
                
                // Skip single emojis
                if (/^[\u{1F000}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u.test(text)) return;
                
                // Store original
                if (!el.dataset.originalText) {
                    el.dataset.originalText = text;
                }
                
                elements.push(el);
                texts.push(el.dataset.originalText);
            });

            if (texts.length === 0) {
                console.log('⚠️ No translatable elements found');
                this.isTranslating = false;
                return;
            }

            console.log(`📝 Found ${texts.length} elements to translate`);
            console.log(`📋 Sample texts:`, texts.slice(0, 5));

            // Translate in batches of 20
            const batchSize = 20;
            for (let i = 0; i < texts.length; i += batchSize) {
                const batchTexts = texts.slice(i, i + batchSize);
                const batchElements = elements.slice(i, i + batchSize);
                
                console.log(`🔄 Translating batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(texts.length/batchSize)}...`);
                
                const translated = await this.translateBatch(batchTexts, targetLang);
                
                // Update elements
                batchElements.forEach((el, idx) => {
                    if (translated[idx] && translated[idx] !== batchTexts[idx]) {
                        el.textContent = translated[idx];
                    }
                });
                
                // Small delay between batches to avoid overwhelming the server
                if (i + batchSize < texts.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            console.log(`✅ Page translation complete!`);
        } catch (error) {
            console.error('❌ Page translation error:', error);
            throw error;
        } finally {
            this.isTranslating = false;
        }
    }

    /**
     * Restore original language (English)
     */
    restoreOriginal() {
        document.querySelectorAll('[data-original-text]').forEach(el => {
            el.textContent = el.dataset.originalText;
        });
        console.log('✅ Original content restored');
    }

    /**
     * Translate AI response
     * @param {string} response - AI response text
     * @param {string} targetLang - Target language code
     * @returns {Promise<string>} Translated response
     */
    async translateAIResponse(response, targetLang) {
        if (targetLang === 'en') {
            return response;
        }
        return await this.translate(response, targetLang, 'en');
    }

    /**
     * Translate user input to English for AI
     * @param {string} input - User input text
     * @param {string} sourceLang - Source language code
     * @returns {Promise<string>} Translated input in English
     */
    async translateUserInput(input, sourceLang) {
        if (sourceLang === 'en') {
            return input;
        }
        return await this.translate(input, 'en', sourceLang);
    }

    /**
     * Get supported languages
     * @returns {Promise<Object>} Dictionary of supported languages
     */
    async getSupportedLanguages() {
        try {
            const response = await fetch(this.languagesEndpoint);
            const data = await response.json();
            
            if (data.success) {
                return data.languages;
            }
            
            return {};
        } catch (error) {
            console.error('Failed to fetch languages:', error);
            return {};
        }
    }

    /**
     * Clear translation cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Translation cache cleared');
    }
}

// Initialize global translator instance
window.translator = new Translator();

// Add global test function for debugging
window.testTranslation = async function(text, lang = 'hi') {
    console.log('🧪 Testing translation...');
    const result = await window.translator.translate(text, lang, 'en');
    console.log('📝 Original:', text);
    console.log('🌐 Translated:', result);
    return result;
};

// Add global function to manually trigger page translation
window.translatePageNow = async function(lang) {
    console.log('🔄 Manually triggering page translation to:', lang);
    await window.translator.translatePage(lang);
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const savedLang = localStorage.getItem('preferred_language') || 'en';
        window.translator.setLanguage(savedLang);
        console.log('✅ Translator ready. Test with: testTranslation("Hello", "hi")');
    });
} else {
    const savedLang = localStorage.getItem('preferred_language') || 'en';
    window.translator.setLanguage(savedLang);
    console.log('✅ Translator ready. Test with: testTranslation("Hello", "hi")');
}

console.log('✅ Google Translator Service loaded');
