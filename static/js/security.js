/**
 * Frontend Security Module
 * XSS Prevention, CSRF Protection, Input Validation
 */

class SecurityManager {
    constructor() {
        this.csrfToken = null;
        this.sessionToken = null;
        this.initCSRFProtection();
        this.setupInputValidation();
        this.setupXSSPrevention();
    }

    initCSRFProtection() {
        const csrf = document.querySelector('meta[name="csrf-token"]');
        if (csrf) {
            this.csrfToken = csrf.getAttribute('content');
        }
        
        this.csrfToken = this.csrfToken || this.getCSRFTokenFromCookie();
        
        this.setupCSRFInterceptor();
    }

    getCSRFTokenFromCookie() {
        const name = 'CSRF-TOKEN=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookieArray = decodedCookie.split(';');
        
        for (let cookie of cookieArray) {
            cookie = cookie.trim();
            if (cookie.indexOf(name) === 0) {
                return cookie.substring(name.length);
            }
        }
        return null;
    }

    setupCSRFInterceptor() {
        const originalFetch = window.fetch;
        const self = this;

        window.fetch = function(...args) {
            let [resource, config] = args;

            if (config === undefined) {
                config = {};
            }

            if (!config.method || ['GET', 'HEAD', 'OPTIONS'].includes(config.method.toUpperCase())) {
                return originalFetch.apply(this, args);
            }

            if (!config.headers) {
                config.headers = {};
            }

            if (self.csrfToken) {
                config.headers['X-CSRF-Token'] = self.csrfToken;
            }

            return originalFetch.apply(this, [resource, config]);
        };
    }

    setupInputValidation() {
        document.addEventListener('input', (e) => {
            if (e.target.dataset.validate) {
                this.validateInput(e.target);
            }
        });
    }

    validateInput(element) {
        const validationType = element.dataset.validate;
        const value = element.value;

        let isValid = true;
        let errorMsg = '';

        switch (validationType) {
            case 'email':
                isValid = this.validateEmail(value);
                errorMsg = 'Invalid email format';
                break;
            case 'phone':
                isValid = this.validatePhone(value);
                errorMsg = 'Invalid phone number';
                break;
            case 'gst':
                isValid = this.validateGST(value);
                errorMsg = 'Invalid GST number';
                break;
            case 'pan':
                isValid = this.validatePAN(value);
                errorMsg = 'Invalid PAN format';
                break;
            case 'password':
                isValid = this.validatePassword(value);
                errorMsg = 'Password does not meet requirements';
                break;
            case 'number':
                isValid = this.validateNumber(value);
                errorMsg = 'Invalid number';
                break;
            case 'percentage':
                isValid = this.validatePercentage(value);
                errorMsg = 'Value must be between 0-100';
                break;
        }

        if (!isValid && value) {
            element.classList.add('is-invalid');
            element.title = errorMsg;
        } else {
            element.classList.remove('is-invalid');
            element.title = '';
        }

        return isValid;
    }

    validateEmail(email) {
        const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return pattern.test(email);
    }

    validatePhone(phone) {
        const digits = phone.replace(/\D/g, '');
        return digits.length >= 10 && digits.length <= 15;
    }

    validateGST(gst) {
        const pattern = /^[0-9A-Za-z]{15}$/;
        return pattern.test(gst.toUpperCase());
    }

    validatePAN(pan) {
        const pattern = /^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/;
        return pattern.test(pan.toUpperCase());
    }

    validatePassword(password) {
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        const isLongEnough = password.length >= 12;

        return hasUppercase && hasLowercase && hasNumbers && hasSpecial && isLongEnough;
    }

    validateNumber(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    validatePercentage(value) {
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0 && num <= 100;
    }

    setupXSSPrevention() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        this.sanitizeElement(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['onclick', 'onerror', 'onload', 'onmouseover']
        });
    }

    sanitizeElement(element) {
        const dangerousAttrs = ['onclick', 'onerror', 'onload', 'onmouseover', 'oninput', 'onchange'];
        
        dangerousAttrs.forEach(attr => {
            if (element.hasAttribute(attr)) {
                element.removeAttribute(attr);
                console.warn(`Removed dangerous attribute: ${attr}`);
            }
        });

        if (element.tagName === 'SCRIPT') {
            element.remove();
            console.warn('Removed script tag');
        }
    }

    sanitizeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    sanitizeForAttribute(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    secureLocalStorage(key, value) {
        if (value === null) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, this.sanitizeHTML(value));
        }
    }

    getSecureLocalStorage(key) {
        return localStorage.getItem(key);
    }

    hashData(data) {
        if (!data) return null;
        
        return CryptoJS.SHA256(data).toString();
    }

    async makeSecureRequest(url, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...options.headers
            },
            ...options
        };

        if (this.csrfToken) {
            config.headers['X-CSRF-Token'] = this.csrfToken;
        }

        const token = this.getSecureLocalStorage('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                this.handleUnauthorized();
            }

            return response;
        } catch (error) {
            console.error('Secure request failed:', error);
            throw error;
        }
    }

    handleUnauthorized() {
        console.warn('Unauthorized access - clearing session');
        this.secureLocalStorage('access_token', null);
        this.secureLocalStorage('user_id', null);
        
        window.location.href = '/login';
    }

    setupPasswordStrengthIndicator() {
        const passwordInputs = document.querySelectorAll('input[data-validate="password"]');
        
        passwordInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const password = e.target.value;
                const strength = this.getPasswordStrength(password);
                
                const indicator = e.target.nextElementSibling;
                if (indicator && indicator.classList.contains('password-strength')) {
                    indicator.className = `password-strength strength-${strength.level}`;
                    indicator.textContent = strength.text;
                }
            });
        });
    }

    getPasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

        const levels = [
            { level: 'weak', text: 'Weak' },
            { level: 'fair', text: 'Fair' },
            { level: 'good', text: 'Good' },
            { level: 'strong', text: 'Strong' },
            { level: 'very-strong', text: 'Very Strong' }
        ];

        return levels[Math.min(strength, 4)];
    }

    logSecurityEvent(eventType, details = {}) {
        const event = {
            type: eventType,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            ...details
        };

        console.log('[SECURITY]', event);
        
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/security/log', JSON.stringify(event));
        }
    }

    setupSecurityHeaders() {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = `
            default-src 'self';
            script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net;
            style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com;
            font-src 'self' https://fonts.gstatic.com;
            img-src 'self' data: https:;
            connect-src 'self' https://api.openrouter.ai;
            frame-ancestors 'none';
        `.replace(/\n/g, '').replace(/\s+/g, ' ');
        
        document.head.appendChild(meta);
    }
}

const securityManager = new SecurityManager();
console.log('✅ Security Manager initialized');
