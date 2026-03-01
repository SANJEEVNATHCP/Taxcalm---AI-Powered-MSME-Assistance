class ProfileManager {
    constructor() {
        this.storageKey = 'taxcalm_profile';
        this.defaultProfile = {
            personal: {
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane.doe@example.com',
                phone: '+91 98765 43210',
                address: '123 Business Park, Tech City, Karnataka'
            },
            business: {
                name: 'Doe Manufacturing Co.',
                gstin: '29AAAAA0000A1Z5',
                pan: 'AAAAA0000A',
                type: 'Partnership',
                industry: 'Manufacturing',
                turnover: '1.5 Crore'
            },
            notifications: {
                email: true,
                compliance: true,
                reports: false,
                updates: true
            },
            security: {
                twoFactor: false
            }
        };
        this.init();
    }

    init() {
        console.log('ProfileManager: Initializing...');
        this.loadProfile();
        this.setupEventListeners();
        this.setupTabSwitching();
        // Delay population slightly to ensure DOM is ready
        setTimeout(() => {
            this.populateForms();
            this.updateSidebarUI();
            console.log('ProfileManager: Ready');
        }, 100);
    }

    loadProfile() {
        const saved = localStorage.getItem(this.storageKey);
        const parsed = saved ? JSON.parse(saved) : {};

        // Merge with defaults but allow empty strings if they were explicitly saved
        this.profile = {
            personal: { ...this.defaultProfile.personal, ...(parsed.personal || {}) },
            business: { ...this.defaultProfile.business, ...(parsed.business || {}) },
            notifications: { ...this.defaultProfile.notifications, ...(parsed.notifications || {}) },
            security: { ...this.defaultProfile.security, ...(parsed.security || {}) }
        };
    }

    saveProfile() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.profile));
        this.updateSidebarUI();
        if (window.toast) {
            window.toast.success('Profile saved successfully!');
        }
    }

    setupTabSwitching() {
        const tabBtns = document.querySelectorAll('.profile-tab-btn');
        const tabContents = document.querySelectorAll('.profile-tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = btn.dataset.profileTab;

                // Update Button UI
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update Content UI
                tabContents.forEach(content => {
                    content.classList.add('hidden');
                    if (content.id === `profile-tab-${targetTab}`) {
                        content.classList.remove('hidden');
                        
                        // Smooth fade in animation
                        requestAnimationFrame(() => {
                            content.classList.add('animate-fade-in');
                        });
                        
                        // Ensure tabs are visible - scroll main content to top gently
                        const mainContent = document.querySelector('.main-content');
                        if (mainContent && mainContent.scrollTop > 100) {
                            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }
                });
            });
        });
    }

    setupEventListeners() {
        console.log('ProfileManager: Setting up event listeners...');
        
        // Profile Form (previously Personal)
        const profileForm = document.querySelector('#profile-tab-profile form');
        if (profileForm) {
            console.log('ProfileManager: Profile form found');
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('ProfileManager: Saving profile info...');
                this.savePersonalInfo();
            });
            profileForm.querySelector('button[type="button"]')?.addEventListener('click', () => this.populateForms());
        } else {
            console.warn('ProfileManager: Profile form NOT found');
        }

        // Account Form (previously Business)
        const accountForm = document.querySelector('#profile-tab-account form');
        if (accountForm) {
            console.log('ProfileManager: Account form found');
            accountForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveBusinessInfo();
            });
            accountForm.querySelector('button[type="button"]')?.addEventListener('click', () => this.populateForms());
        }

        // Notifications Form
        const notificationsForm = document.querySelector('#profile-tab-notifications form');
        if (notificationsForm) {
            console.log('ProfileManager: Notifications form found');
            notificationsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('ProfileManager: Saving notification preferences...');
                // Notification preferences are auto-saved via toggles, just show confirmation
                if (window.toast) {
                    window.toast.success('Notification preferences saved!');
                }
            });
            // Reset button
            const resetBtn = notificationsForm.querySelector('button[type="button"]');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.profile.notifications = { ...this.defaultProfile.notifications };
                    this.saveProfile();
                    this.populateForms();
                });
            }
        }

        // 2FA Toggle
        const tfaToggle = document.getElementById('profile-2fa-toggle');
        if (tfaToggle) {
            tfaToggle.addEventListener('change', () => {
                this.profile.security.twoFactor = tfaToggle.checked;
                this.saveProfile();
            });
        }

        // Notification Toggles
        ['email', 'compliance', 'reports', 'updates'].forEach(key => {
            const el = document.getElementById(`profile-notif-${key}`);
            if (el) {
                el.addEventListener('change', () => {
                    this.profile.notifications[key] = el.checked;
                    this.saveProfile();
                });
            }
        });

        // Avatar Upload
        const avatarUpload = document.getElementById('profile-avatar-upload');
        const avatarRemove = document.getElementById('profile-avatar-remove');
        const avatarImg = document.getElementById('profile-avatar-img');
        const avatarInitials = document.getElementById('profile-avatar-initials');
        
        if (avatarUpload) {
            avatarUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                        if (window.toast) window.toast.error('File too large! Max 5MB');
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const imageData = event.target.result;
                        if (avatarImg) {
                            avatarImg.src = imageData;
                            avatarImg.classList.remove('hidden');
                        }
                        if (avatarInitials) {
                            avatarInitials.classList.add('hidden');
                        }
                        // Save to localStorage
                        this.profile.personal.avatar = imageData;
                        this.saveProfile();
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        if (avatarRemove) {
            avatarRemove.addEventListener('click', () => {
                if (avatarImg) avatarImg.classList.add('hidden');
                if (avatarInitials) avatarInitials.classList.remove('hidden');
                delete this.profile.personal.avatar;
                this.saveProfile();
                if (avatarUpload) avatarUpload.value = '';
            });
        }

        // Delete Account
        const deleteBtn = document.getElementById('profile-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    localStorage.removeItem(this.storageKey);
                    if (window.toast) window.toast.success('Account data cleared. Refreshing...');
                    setTimeout(() => location.reload(), 1500);
                }
            });
        }
    }

    populateForms() {
        // Profile Info (Display Name, Username, Bio, Role, Social)
        const p = this.profile.personal;
        this.setVal('profile-display-name-input', p.firstName || 'Jane Doe');
        this.setVal('profile-username', p.username || '');
        this.setVal('profile-bio', p.bio || '');
        this.setVal('profile-role-input', p.role || 'MSME User');
        this.setVal('profile-website', p.website || '');
        this.setVal('profile-linkedin', p.linkedin || '');
        this.setVal('profile-twitter', p.twitter || '');
        
        // Load avatar if exists
        if (p.avatar) {
            const avatarImg = document.getElementById('profile-avatar-img');
            const avatarInitials = document.getElementById('profile-avatar-initials');
            if (avatarImg && avatarInitials) {
                avatarImg.src = p.avatar;
                avatarImg.classList.remove('hidden');
                avatarInitials.classList.add('hidden');
            }
        }

        // Account/Business Info
        const b = this.profile.business;
        this.setVal('profile-business-name', b.name || '');
        this.setVal('profile-email', b.email || '');
        this.setVal('profile-phone', b.phone || '');
        this.setVal('profile-address', b.address || '');
        this.setVal('profile-gstin', b.gstin || '');
        this.setVal('profile-pan', b.pan || '');
        this.setVal('profile-businessType', b.type);
        this.setVal('profile-industry', b.industry);
        this.setVal('profile-turnover', b.turnover);

        // Security & Notifications
        const tfaToggle = document.getElementById('profile-2fa-toggle');
        if (tfaToggle) tfaToggle.checked = !!this.profile.security.twoFactor;

        ['email', 'compliance', 'reports', 'updates'].forEach(key => {
            const el = document.getElementById(`profile-notif-${key}`);
            if (el) el.checked = !!this.profile.notifications[key];
        });

        // Sync Sidebar Stats
        this.updateComplianceScoreOnProfile();
    }

    setVal(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    }

    updateSidebarUI() {
        const p = this.profile.personal;
        const b = this.profile.business;
        const fullName = p.firstName || 'Jane Doe'; // firstName now contains full display name
        const role = p.role || 'MSME User';
        
        // Get initials from display name
        const nameParts = fullName.trim().split(' ');
        const initials = nameParts.length > 1 
            ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
            : (nameParts[0][0] + nameParts[0][1] || '').toUpperCase();

        // Profile Page Card
        const nameEl = document.getElementById('profile-display-name');
        const roleEl = document.getElementById('profile-display-role');
        const initEl = document.getElementById('profile-initials');

        if (nameEl) nameEl.textContent = fullName;
        if (roleEl) roleEl.textContent = role;
        if (initEl) initEl.textContent = initials;

        // Sidebar Sync
        const sideNameEl = document.getElementById('sidebar-user-name');
        const sideRoleEl = document.getElementById('sidebar-user-role');
        const sideInitEl = document.getElementById('sidebar-user-avatar');

        if (sideNameEl) sideNameEl.textContent = fullName;
        if (sideRoleEl) sideRoleEl.textContent = b.name || role;
        if (sideInitEl) sideInitEl.textContent = initials;
    }

    updateComplianceScoreOnProfile() {
        const score = localStorage.getItem('compliance_score') || '0';
        const scoreEl = document.getElementById('profile-compliance-score');
        const barEl = document.getElementById('profile-compliance-bar');

        if (scoreEl) scoreEl.textContent = score + '%';
        if (barEl) barEl.style.width = score + '%';
    }

    savePersonalInfo() {
        console.log('ProfileManager: Gathering profile info from form...');
        this.profile.personal = {
            ...this.profile.personal, // Keep avatar
            firstName: document.getElementById('profile-display-name-input')?.value || '',
            username: document.getElementById('profile-username')?.value || '',
            bio: document.getElementById('profile-bio')?.value || '',
            role: document.getElementById('profile-role-input')?.value || '',
            website: document.getElementById('profile-website')?.value || '',
            linkedin: document.getElementById('profile-linkedin')?.value || '',
            twitter: document.getElementById('profile-twitter')?.value || ''
        };
        console.log('ProfileManager: Profile info:', this.profile.personal);
        this.saveProfile();
    }

    saveBusinessInfo() {
        console.log('ProfileManager: Gathering account/business info from form...');
        this.profile.business = {
            name: document.getElementById('profile-business-name')?.value || '',
            email: document.getElementById('profile-email')?.value || '',
            phone: document.getElementById('profile-phone')?.value || '',
            address: document.getElementById('profile-address')?.value || '',
            gstin: document.getElementById('profile-gstin')?.value || '',
            pan: document.getElementById('profile-pan')?.value || '',
            type: document.getElementById('profile-businessType')?.value || '',
            industry: document.getElementById('profile-industry')?.value || '',
            companySize: document.getElementById('profile-company-size')?.value || ''
        };
        console.log('ProfileManager: Business info:', this.profile.business);
        this.saveProfile();
    }

    changePassword() {
        const pass1 = document.getElementById('profile-new-password')?.value;
        const pass2 = document.getElementById('profile-confirm-password')?.value;

        if (pass1 !== pass2) {
            if (window.toast) window.toast.error('Passwords do not match!');
            return;
        }

        if (pass1.length < 8) {
            if (window.toast) window.toast.error('Password must be at least 8 characters!');
            return;
        }

        if (window.toast) window.toast.success('Password updated successfully (Demo Mode)');

        // Clear fields
        document.getElementById('profile-current-password').value = '';
        document.getElementById('profile-new-password').value = '';
        document.getElementById('profile-confirm-password').value = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.profileManager = new ProfileManager();

    // ── Preferences form: save to localStorage ───────────────────────────────
    const preferencesForm = document.querySelector('#profile-tab-preferences form');
    if (preferencesForm) {
        // Load saved prefs
        const savedDefView = localStorage.getItem('taxcalm_defaultView') || 'overview';
        const defViewSelect = preferencesForm.querySelector('[name="defaultView"]');
        if (defViewSelect) defViewSelect.value = savedDefView;

        preferencesForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const defaultView = preferencesForm.querySelector('[name="defaultView"]')?.value || 'overview';
            localStorage.setItem('taxcalm_defaultView', defaultView);
            if (window.toast) window.toast.success('Preferences saved!');
        });
    }

    // ── Appearance form: apply theme / font-size on save ─────────────────────
    const appearanceForm = document.querySelector('#profile-tab-appearance form');
    if (appearanceForm) {
        // Load saved appearance on init
        const savedTheme = localStorage.getItem('taxcalm_theme') || 'light';
        const savedFont = localStorage.getItem('taxcalm_fontSize') || '14';
        const savedLang = localStorage.getItem('taxcalm_language') || 'en';
        const themeRadio = appearanceForm.querySelector(`[name="theme"][value="${savedTheme}"]`);
        if (themeRadio) themeRadio.checked = true;
        const fontRange = appearanceForm.querySelector('[name="fontSize"]');
        if (fontRange) fontRange.value = savedFont;
        const langSelect = document.getElementById('profile-language');
        if (langSelect) langSelect.value = savedLang;
        _applyTheme(savedTheme);
        document.documentElement.style.fontSize = savedFont + 'px';

        appearanceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const theme = appearanceForm.querySelector('[name="theme"]:checked')?.value || 'light';
            const fontSize = appearanceForm.querySelector('[name="fontSize"]')?.value || '14';
            const language = document.getElementById('profile-language')?.value || 'en';
            localStorage.setItem('taxcalm_theme', theme);
            localStorage.setItem('taxcalm_fontSize', fontSize);
            localStorage.setItem('taxcalm_language', language);
            _applyTheme(theme);
            document.documentElement.style.fontSize = fontSize + 'px';
            if (window.toast) window.toast.success('Appearance settings saved!');
        });
    }

    // ── Export all profile data ───────────────────────────────────────────────
    window._exportProfileData = function () {
        const data = {
            profile: JSON.parse(localStorage.getItem('taxcalm_profile') || '{}'),
            compliance_score: localStorage.getItem('compliance_score'),
            theme: localStorage.getItem('taxcalm_theme'),
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `taxcalm-data-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        if (window.toast) window.toast.success('Data exported successfully!');
    };

    // ── Delete all stored data ────────────────────────────────────────────────
    window._deleteAllData = function () {
        if (!confirm('⚠️ This will permanently delete ALL your profile data, compliance records and settings.\n\nThis cannot be undone. Continue?')) return;
        ['taxcalm_profile', 'taxcalm_theme', 'taxcalm_fontSize', 'taxcalm_language',
         'compliance_score', 'welcome_shown', 'taxcalm_visited'].forEach(k => localStorage.removeItem(k));
        if (window.toast) window.toast.success('All data deleted. Refreshing...');
        setTimeout(() => location.reload(), 1500);
    };

    // ── Reset appearance to defaults ─────────────────────────────────────────
    window._resetAppearance = function (form) {
        if (!form) return;
        const lightRadio = form.querySelector('[name="theme"][value="light"]');
        if (lightRadio) lightRadio.checked = true;
        const fontRange = form.querySelector('[name="fontSize"]');
        if (fontRange) fontRange.value = '14';
        const langSelect = document.getElementById('profile-language');
        if (langSelect) langSelect.value = 'en';
        localStorage.removeItem('taxcalm_theme');
        localStorage.removeItem('taxcalm_fontSize');
        localStorage.removeItem('taxcalm_language');
        _applyTheme('light');
        document.documentElement.style.fontSize = '';
        if (window.toast) window.toast.success('Appearance reset to defaults!');
    };

    // ── Internal: apply theme class to <html> ─────────────────────────────────
    function _applyTheme(theme) {
        const html = document.documentElement;
        html.classList.remove('dark', 'light');
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            html.classList.add(prefersDark ? 'dark' : 'light');
        } else {
            html.classList.add(theme);
        }
    }
});
