/**
 * Internationalization (i18n) System
 * Supports English, Hindi, and Tamil for MSME Compliance Assistant
 */

const translations = {
    en: {
        // Navigation
        'nav.dashboard': 'Dashboard',
        'nav.calculator': 'GST Calculator',
        'nav.compliance': 'Compliance',
        'nav.finance': 'Finance',
        'nav.schemes': 'Schemes',
        'nav.explainer': 'Knowledge Base',
        'nav.profile': 'Profile',
        
        // Dashboard
        'dashboard.title': 'Dashboard',
        'dashboard.welcome': 'Welcome to TaxCalm',
        'dashboard.subtitle': 'Your MSME Compliance Assistant',
        'dashboard.news': 'Latest Updates',
        'dashboard.refresh': 'Refresh News',
        
        // Calculator
        'calc.title': 'GST Calculator',
        'calc.sales': 'Total Sales',
        'calc.purchases': 'Total Purchases',
        'calc.rate': 'GST Rate',
        'calc.calculate': 'Calculate GST',
        'calc.clear': 'Clear',
        'calc.output': 'Output GST',
        'calc.input': 'Input GST',
        'calc.net': 'Net GST Payable',
        
        // Compliance
        'compliance.title': 'Compliance Tracker',
        'compliance.checklist': 'Checklist',
        'compliance.deadline': 'Next Deadline',
        'compliance.gst': 'GST Filing',
        'compliance.tax': 'Income Tax',
        'compliance.labor': 'Labor Law',
        
        // Finance
        'finance.title': 'Finance Management',
        'finance.income': 'Total Income',
        'finance.expenses': 'Total Expenses',
        'finance.assets': 'Total Assets',
        'finance.liabilities': 'Total Liabilities',
        
        // Profile
        'profile.personal': 'Personal Information',
        'profile.business': 'Business Information',
        'profile.security': 'Security',
        'profile.notifications': 'Notifications',
        'profile.save': 'Save Changes',
        'profile.cancel': 'Cancel',
        
        // Common
        'common.loading': 'Loading...',
        'common.error': 'Error occurred',
        'common.success': 'Success',
        'common.submit': 'Submit',
        'common.close': 'Close',
        'common.search': 'Search',
        'common.help': 'Help',
        
        // Penalties
        'penalty.title': 'Penalty Calculator',
        'penalty.late_gst': 'Late GST Filing Penalty',
        'penalty.late_tax': 'Late Income Tax Penalty',
        'penalty.calculate': 'Calculate Penalty',
        'penalty.days_late': 'Days Late',
        'penalty.tax_amount': 'Tax Amount',
        
        // AI Assistant
        'ai.title': 'AI Assistant',
        'ai.placeholder': 'Ask your compliance question...',
        'ai.send': 'Send',
        'ai.listening': 'Listening...',
        'ai.thinking': 'Thinking...',
    },
    
    hi: {
        // Navigation (Hindi)
        'nav.dashboard': 'डैशबोर्ड',
        'nav.calculator': 'जीएसटी कैलकुलेटर',
        'nav.compliance': 'अनुपालन',
        'nav.finance': 'वित्त',
        'nav.schemes': 'योजनाएं',
        'nav.explainer': 'ज्ञान आधार',
        'nav.profile': 'प्रोफ़ाइल',
        
        // Dashboard
        'dashboard.title': 'डैशबोर्ड',
        'dashboard.welcome': 'टैक्सक्लैम में आपका स्वागत है',
        'dashboard.subtitle': 'आपका एमएसएमई अनुपालन सहायक',
        'dashboard.news': 'नवीनतम अपडेट',
        'dashboard.refresh': 'समाचार ताज़ा करें',
        
        // Calculator
        'calc.title': 'जीएसटी कैलकुलेटर',
        'calc.sales': 'कुल बिक्री',
        'calc.purchases': 'कुल खरीद',
        'calc.rate': 'जीएसटी दर',
        'calc.calculate': 'जीएसटी की गणना करें',
        'calc.clear': 'साफ़ करें',
        'calc.output': 'आउटपुट जीएसटी',
        'calc.input': 'इनपुट जीएसटी',
        'calc.net': 'शुद्ध जीएसटी देय',
        
        // Compliance
        'compliance.title': 'अनुपालन ट्रैकर',
        'compliance.checklist': 'जाँच सूची',
        'compliance.deadline': 'अगली समय सीमा',
        'compliance.gst': 'जीएसटी फाइलिंग',
        'compliance.tax': 'आयकर',
        'compliance.labor': 'श्रम कानून',
        
        // Finance
        'finance.title': 'वित्त प्रबंधन',
        'finance.income': 'कुल आय',
        'finance.expenses': 'कुल व्यय',
        'finance.assets': 'कुल संपत्ति',
        'finance.liabilities': 'कुल देनदारियां',
        
        // Profile
        'profile.personal': 'व्यक्तिगत जानकारी',
        'profile.business': 'व्यवसाय जानकारी',
        'profile.security': 'सुरक्षा',
        'profile.notifications': 'सूचनाएं',
        'profile.save': 'परिवर्तन सहेजें',
        'profile.cancel': 'रद्द करें',
        
        // Common
        'common.loading': 'लोड हो रहा है...',
        'common.error': 'त्रुटि हुई',
        'common.success': 'सफलता',
        'common.submit': 'जमा करें',
        'common.close': 'बंद करें',
        'common.search': 'खोजें',
        'common.help': 'सहायता',
        
        // Penalties
        'penalty.title': 'जुर्माना कैलकुलेटर',
        'penalty.late_gst': 'विलंब जीएसटी फाइलिंग जुर्माना',
        'penalty.late_tax': 'विलंब आयकर जुर्माना',
        'penalty.calculate': 'जुर्माना की गणना करें',
        'penalty.days_late': 'विलंब दिन',
        'penalty.tax_amount': 'कर राशि',
        
        // AI Assistant
        'ai.title': 'एआई सहायक',
        'ai.placeholder': 'अपना अनुपालन प्रश्न पूछें...',
        'ai.send': 'भेजें',
        'ai.listening': 'सुन रहा है...',
        'ai.thinking': 'सोच रहा है...',
    },
    
    ta: {
        // Navigation (Tamil)
        'nav.dashboard': 'டாஷ்போர்டு',
        'nav.calculator': 'ஜிஎஸ்டி கால்குலேட்டர்',
        'nav.compliance': 'இணக்கம்',
        'nav.finance': 'நிதி',
        'nav.schemes': 'திட்டங்கள்',
        'nav.explainer': 'அறிவு தளம்',
        'nav.profile': 'சுயவிவரம்',
        
        // Dashboard
        'dashboard.title': 'டாஷ்போர்டு',
        'dashboard.welcome': 'டாக்ஸ்க்ளாமுக்கு வரவேற்கிறோம்',
        'dashboard.subtitle': 'உங்கள் எம்எஸ்எம்இ இணக்க உதவியாளர்',
        'dashboard.news': 'சமீபத்திய புதுப்பிப்புகள்',
        'dashboard.refresh': 'செய்திகளை புதுப்பிக்கவும்',
        
        // Calculator
        'calc.title': 'ஜிஎஸ்டி கால்குலேட்டர்',
        'calc.sales': 'மொத்த விற்பனை',
        'calc.purchases': 'மொத்த கொள்முதல்',
        'calc.rate': 'ஜிஎஸ்டி விகிதம்',
        'calc.calculate': 'ஜிஎஸ்டியை கணக்கிடுங்கள்',
        'calc.clear': 'அழி',
        'calc.output': 'வெளியீடு ஜிஎஸ்டி',
        'calc.input': 'உள்ளீடு ஜிஎஸ்டி',
        'calc.net': 'நிகர ஜிஎஸ்டி செலுத்த வேண்டியது',
        
        // Compliance
        'compliance.title': 'இணக்க கண்காணிப்பு',
        'compliance.checklist': 'சரிபார்ப்பு பட்டியல்',
        'compliance.deadline': 'அடுத்த காலக்கெடு',
        'compliance.gst': 'ஜிஎஸ்டி தாக்கல்',
        'compliance.tax': 'வருமான வரி',
        'compliance.labor': 'தொழிலாளர் சட்டம்',
        
        // Finance
        'finance.title': 'நிதி மேலாண்மை',
        'finance.income': 'மொத்த வருமானம்',
        'finance.expenses': 'மொத்த செலவுகள்',
        'finance.assets': 'மொத்த சொத்துக்கள்',
        'finance.liabilities': 'மொத்த பொறுப்புகள்',
        
        // Profile
        'profile.personal': 'தனிப்பட்ட தகவல்',
        'profile.business': 'வணிக தகவல்',
        'profile.security': 'பாதுகாப்பு',
        'profile.notifications': 'அறிவிப்புகள்',
        'profile.save': 'மாற்றங்களைச் சேமிக்கவும்',
        'profile.cancel': 'ரத்து செய்',
        
        // Common
        'common.loading': 'ஏற்றுகிறது...',
        'common.error': 'பிழை ஏற்பட்டது',
        'common.success': 'வெற்றி',
        'common.submit': 'சமர்ப்பிக்கவும்',
        'common.close': 'மூடு',
        'common.search': 'தேடு',
        'common.help': 'உதவி',
        
        // Penalties
        'penalty.title': 'அபராத கால்குலேட்டர்',
        'penalty.late_gst': 'தாமத ஜிஎஸ்டி தாக்கல் அபராதம்',
        'penalty.late_tax': 'தாமத வருமான வரி அபராதம்',
        'penalty.calculate': 'அபராதத்தை கணக்கிடுங்கள்',
        'penalty.days_late': 'தாமத நாட்கள்',
        'penalty.tax_amount': 'வரி தொகை',
        
        // AI Assistant
        'ai.title': 'AI உதவியாளர்',
        'ai.placeholder': 'உங்கள் இணக்க கேள்வியைக் கேளுங்கள்...',
        'ai.send': 'அனுப்பு',
        'ai.listening': 'கேட்கிறது...',
        'ai.thinking': 'யோசிக்கிறது...',
    }
};

class I18n {
    constructor() {
        this.currentLanguage = localStorage.getItem('preferred_language') || 'en';
        this.translations = translations;
    }
    
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            localStorage.setItem('preferred_language', lang);
            this.updatePage();
            
            // Update voice recognition language
            this.updateVoiceLanguage(lang);
            
            // Reload AI assistant if needed
            if (window.toast) {
                window.toast.success(this.t('common.success'));
            }
        }
    }
    
    updateVoiceLanguage(lang) {
        const langMap = {
            'en': 'en-IN',
            'hi': 'hi-IN',
            'ta': 'ta-IN'
        };
        
        if (window.speechRecognizer && langMap[lang]) {
            window.speechRecognizer.lang = langMap[lang];
        }
    }
    
    t(key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLanguage];
        
        for (const k of keys) {
            value = value?.[k];
            if (!value) break;
        }
        
        if (!value) {
            value = this.translations['en'];
            for (const k of keys) {
                value = value?.[k];
                if (!value) break;
            }
        }
        
        return value || key;
    }
    
    updatePage() {
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Update page title
        if (this.currentLanguage === 'hi') {
            document.title = 'टैक्सक्लैम - प्रीमियम एमएसएमई प्लेटफ़ॉर्म';
        } else if (this.currentLanguage === 'ta') {
            document.title = 'டாக்ஸ்க்ளாம் - பிரீமியம் எம்எஸ்எம்இ தளம்';
        } else {
            document.title = 'TaxCalm - Premium MSME Platform';
        }
        
        // Update HTML lang attribute
        document.documentElement.lang = this.currentLanguage;
    }
    
    getCurrentLanguage() {
        return this.currentLanguage;
    }
}

// Initialize i18n globally
window.i18n = new I18n();

// Apply translations on page load
document.addEventListener('DOMContentLoaded', () => {
    window.i18n.updatePage();
});
