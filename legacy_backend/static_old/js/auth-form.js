/**
 * auth-form.js
 * TaxClam — Sign In / Sign Up page logic
 * Handles: tab switching, conditional fields, validation, API calls
 */

/* ── Regex patterns ─────────────────────────────────────────── */
const PATTERNS = {
    email:    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    username: /^[a-zA-Z0-9_]{3,24}$/,
    gstin:    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    aadhar:   /^[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}$/,
    pan:      /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    password: /^.{8,}$/,
};

/* ── Toast ──────────────────────────────────────────────────── */
let toastTimer = null;
function showToast(msg, type = 'info', duration = 3500) {
    const el = document.getElementById('toast');
    el.textContent = '';
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    el.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    el.className = `show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        el.className = '';
    }, duration);
}

/* ── Tab switching ──────────────────────────────────────────── */
function switchTab(tab) {
    const signinPanel = document.getElementById('panel-signin');
    const signupPanel = document.getElementById('panel-signup');
    const tabSignin   = document.getElementById('tab-signin');
    const tabSignup   = document.getElementById('tab-signup');

    if (tab === 'signin') {
        signinPanel.classList.remove('hidden');
        signupPanel.classList.add('hidden');
        tabSignin.classList.add('active');
        tabSignup.classList.remove('active');
        // re-trigger animation
        signinPanel.classList.remove('form-panel');
        void signinPanel.offsetWidth;
        signinPanel.classList.add('form-panel');
    } else {
        signupPanel.classList.remove('hidden');
        signinPanel.classList.add('hidden');
        tabSignup.classList.add('active');
        tabSignin.classList.remove('active');
        signupPanel.classList.remove('form-panel');
        void signupPanel.offsetWidth;
        signupPanel.classList.add('form-panel');
    }
}

/* ── GST / Aadhaar-PAN toggle ───────────────────────────────── */
function handleGSTToggle() {
    const gstYes  = document.getElementById('gst-yes');
    const gstSec  = document.getElementById('gst-section');
    const aapSec  = document.getElementById('aadhar-pan-section');

    if (gstYes.checked) {
        gstSec.classList.add('open');
        aapSec.classList.remove('open');
        // Reset Aadhaar/PAN validation
        setFieldState('reg-aadhar', 'aadhar-status', 'aadhar-hint', null);
        setFieldState('reg-pan',    'pan-status',    'pan-hint',    null);
        clearInfoCard('identity-info-card', 'identity-info-content');
    } else {
        aapSec.classList.add('open');
        gstSec.classList.remove('open');
        // Reset GSTIN validation
        setFieldState('reg-gstin', 'gstin-status', 'gstin-hint', null,
            'Format: 2-digit state code + PAN + entity code (15 chars)');
        clearInfoCard('gst-info-card', 'gst-info-content');
    }
}

/* ── Field state helper ─────────────────────────────────────── */
/**
 * @param {string} inputId
 * @param {string} statusId
 * @param {string} hintId
 * @param {'valid'|'invalid'|null} state
 * @param {string} [hintMsg]
 */
function setFieldState(inputId, statusId, hintId, state, hintMsg) {
    const input  = document.getElementById(inputId);
    const status = document.getElementById(statusId);
    const hint   = document.getElementById(hintId);

    if (!input) return;

    // Remove previous classes
    input.classList.remove('valid', 'invalid');
    if (state === 'valid') {
        input.classList.add('valid');
        if (status) status.textContent = '✅';
    } else if (state === 'invalid') {
        input.classList.add('invalid');
        if (status) status.textContent = '❌';
    } else {
        if (status) status.textContent = '';
    }

    if (hint && hintMsg !== undefined) {
        hint.textContent = hintMsg;
        hint.className = 'field-hint' + (state === 'invalid' ? ' error' : state === 'valid' ? ' success' : '');
    }
}

/* ── Password strength ──────────────────────────────────────── */
function evalPasswordStrength(pw) {
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0–5
}

function updatePasswordStrength(pw) {
    const bar  = document.getElementById('pw-bar');
    const hint = document.getElementById('pw-hint');
    if (!bar) return;

    const score = evalPasswordStrength(pw);
    const pct   = pw.length === 0 ? 0 : Math.max(20, (score / 5) * 100);

    const colors = ['#ef4444', '#f97316', '#fbbf24', '#84cc16', '#22c55e'];
    const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

    bar.style.width      = pct + '%';
    bar.style.background = colors[Math.min(score - 1, 4)] || '#ef4444';

    if (hint) {
        hint.textContent = pw.length > 0 ? labels[Math.min(score - 1, 4)] || 'Too short' : '';
        hint.className = 'field-hint' + (score >= 4 ? ' success' : score >= 2 ? '' : ' error');
    }
}

/* ── GSTIN formatter (adds spaces visually, keeps raw) ────────── */
function formatAadhar(raw) {
    const digits = raw.replace(/\D/g, '').slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

/* ── Info card helper ───────────────────────────────────────── */
function showInfoCard(cardId, contentId, rows) {
    const card    = document.getElementById(cardId);
    const content = document.getElementById(contentId);
    if (!card || !content) return;
    content.innerHTML = rows.map(([k, v]) =>
        `<div class="ic-row"><span class="ic-key">${k}</span><span class="ic-val">${v}</span></div>`
    ).join('');
    card.classList.add('show');
}

function clearInfoCard(cardId, contentId) {
    const card = document.getElementById(cardId);
    if (card) card.classList.remove('show');
    const content = document.getElementById(contentId);
    if (content) content.innerHTML = '';
}

/* ── Simulate fetch button loading state ────────────────────── */
function setBtnLoading(btnId, loading, label) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.innerHTML = loading
        ? `<span class="btn-spinner" style="display:inline-block;width:14px;height:14px;border:2px solid rgba(147,197,253,.3);border-top-color:#93c5fd;border-radius:50%;animation:spin .7s linear infinite;margin-right:6px;vertical-align:middle"></span> Fetching…`
        : label;
}

/* ── API: Fetch GST details ─────────────────────────────────── */
async function fetchGSTDetails() {
    const gstin = document.getElementById('reg-gstin').value.trim().toUpperCase();

    if (!PATTERNS.gstin.test(gstin)) {
        setFieldState('reg-gstin', 'gstin-status', 'gstin-hint', 'invalid',
            'Invalid GSTIN format. Expected: 22AAAAA0000A1Z5');
        showToast('Please enter a valid 15-character GSTIN.', 'error');
        return;
    }

    setBtnLoading('fetch-gst-btn', true);

    try {
        const res = await fetch('/api/auth/fetch-gst', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ gstin }),
        });
        const data = await res.json();

        if (data.success) {
            setFieldState('reg-gstin', 'gstin-status', 'gstin-hint', 'valid', 'GSTIN verified ✓');
            showInfoCard('gst-info-card', 'gst-info-content', [
                ['Legal Name', data.legal_name],
                ['Trade Name', data.trade_name || '—'],
                ['Status',     data.status],
                ['Type',       data.business_type],
                ['State',      data.state],
            ]);
            showToast('Business details fetched successfully!', 'success');
        } else {
            setFieldState('reg-gstin', 'gstin-status', 'gstin-hint', 'invalid',
                data.error || 'Could not fetch GSTIN details.');
            showToast(data.error || 'GSTIN lookup failed.', 'error');
        }
    } catch (err) {
        console.error('fetchGSTDetails error:', err);
        showToast('Network error. Please try again.', 'error');
    } finally {
        setBtnLoading('fetch-gst-btn', false,
            '<span>🔍</span> Fetch Business Details');
    }
}

/* ── API: Verify Identity (Aadhaar + PAN) ───────────────────── */
async function verifyIdentity() {
    const aadharRaw = document.getElementById('reg-aadhar').value.trim();
    const pan       = document.getElementById('reg-pan').value.trim().toUpperCase();
    const aadhar    = aadharRaw.replace(/\s/g, '');

    let valid = true;

    if (!PATTERNS.aadhar.test(aadharRaw)) {
        setFieldState('reg-aadhar', 'aadhar-status', 'aadhar-hint', 'invalid',
            'Enter a valid 12-digit Aadhaar number.');
        valid = false;
    }

    if (!PATTERNS.pan.test(pan)) {
        setFieldState('reg-pan', 'pan-status', 'pan-hint', 'invalid',
            'Enter a valid PAN (e.g. ABCDE1234F).');
        valid = false;
    }

    if (!valid) {
        showToast('Please fix the highlighted fields.', 'error');
        return;
    }

    setBtnLoading('verify-identity-btn', true);

    try {
        const res = await fetch('/api/auth/verify-identity', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ aadhar, pan }),
        });
        const data = await res.json();

        if (data.success) {
            setFieldState('reg-aadhar', 'aadhar-status', 'aadhar-hint', 'valid', 'Aadhaar verified ✓');
            setFieldState('reg-pan',    'pan-status',    'pan-hint',    'valid', 'PAN verified ✓');
            showInfoCard('identity-info-card', 'identity-info-content', [
                ['Name',     data.name],
                ['Category', data.category],
                ['PAN Type', data.pan_type || '—'],
                ['Verified', '✅ Yes'],
            ]);
            showToast('Identity verified successfully!', 'success');
        } else {
            showToast(data.error || 'Identity verification failed.', 'error');
        }
    } catch (err) {
        console.error('verifyIdentity error:', err);
        showToast('Network error. Please try again.', 'error');
    } finally {
        setBtnLoading('verify-identity-btn', false,
            '<span>🔐</span> Verify Identity');
    }
}

/* ── Sign-In handler ────────────────────────────────────────── */
async function handleSignIn(e) {
    e.preventDefault();

    const username = document.getElementById('login-id').value.trim();
    const password = document.getElementById('login-pass').value;

    if (!username || !password) {
        showToast('Please fill in all fields.', 'error');
        return;
    }

    const btn = document.getElementById('signin-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-spinner"></span> Signing in…';

    try {
        const res = await fetch('/api/auth/signin', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ username, password }),
        });
        const data = await res.json();

        if (data.success) {
            // Persist session
            if (window.Auth) {
                window.Auth.setAuth(data.token || 'session-token', {
                    username,
                    role: data.role || 'User',
                });
            }
            showToast('Welcome back! Redirecting…', 'success');
            setTimeout(() => { window.location.href = data.redirect || '/'; }, 1200);
        } else {
            showToast(data.error || 'Invalid credentials.', 'error');
        }
    } catch (err) {
        console.error('SignIn error:', err);
        showToast('Could not reach server. Please try again.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Sign In';
    }
}

/* ── Sign-Up handler ────────────────────────────────────────── */
async function handleSignUp(e) {
    e.preventDefault();

    const username = document.getElementById('reg-user').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-pass').value;
    const has_gst  = document.getElementById('gst-yes').checked;

    // ── Validation ──────────────────────────────────────────
    let ok = true;

    if (!PATTERNS.username.test(username)) {
        setFieldState('reg-user', 'ru-status', null, 'invalid');
        showToast('Username must be 3–24 alphanumeric characters.', 'error');
        ok = false;
    }

    if (!PATTERNS.email.test(email)) {
        setFieldState('reg-email', 're-status', null, 'invalid');
        if (ok) showToast('Please enter a valid email address.', 'error');
        ok = false;
    }

    if (!PATTERNS.password.test(password)) {
        setFieldState('reg-pass', 'rp-status', null, 'invalid');
        if (ok) showToast('Password must be at least 8 characters.', 'error');
        ok = false;
    }

    let gstin  = null;
    let aadhar = null;
    let pan    = null;

    if (has_gst) {
        gstin = document.getElementById('reg-gstin').value.trim().toUpperCase();
        if (!PATTERNS.gstin.test(gstin)) {
            setFieldState('reg-gstin', 'gstin-status', 'gstin-hint', 'invalid',
                'Invalid GSTIN format.');
            if (ok) showToast('Please enter a valid GSTIN.', 'error');
            ok = false;
        }
    } else {
        aadhar = document.getElementById('reg-aadhar').value.replace(/\s/g, '');
        pan    = document.getElementById('reg-pan').value.trim().toUpperCase();

        if (!PATTERNS.aadhar.test(aadhar + ' ')) {
            // Validate raw digits
            if (!/^[0-9]{12}$/.test(aadhar)) {
                setFieldState('reg-aadhar', 'aadhar-status', 'aadhar-hint', 'invalid',
                    'Enter a valid 12-digit Aadhaar number.');
                if (ok) showToast('Please enter a valid Aadhaar number.', 'error');
                ok = false;
            }
        }

        if (!PATTERNS.pan.test(pan)) {
            setFieldState('reg-pan', 'pan-status', 'pan-hint', 'invalid',
                'Enter a valid PAN (e.g. ABCDE1234F).');
            if (ok) showToast('Please enter a valid PAN number.', 'error');
            ok = false;
        }
    }

    if (!ok) return;

    // ── Submit ───────────────────────────────────────────────
    const btn = document.getElementById('signup-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-spinner"></span> Creating account…';

    try {
        const res = await fetch('/api/auth/signup', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                username, email, password,
                has_gst, gstin, aadhar, pan,
            }),
        });
        const data = await res.json();

        if (data.success) {
            showToast('Account created! Please sign in.', 'success');
            setTimeout(() => switchTab('signin'), 1500);
        } else {
            showToast(data.error || 'Registration failed.', 'error');
        }
    } catch (err) {
        console.error('SignUp error:', err);
        showToast('Could not reach server. Please try again.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Create Account';
    }
}

/* ── Live validation bindings ───────────────────────────────── */
function bindLiveValidation() {
    // Sign-in
    document.getElementById('login-id').addEventListener('blur', () => {
        const v = document.getElementById('login-id').value.trim();
        setFieldState('login-id', 'li-status', null, v ? 'valid' : 'invalid');
    });
    document.getElementById('login-pass').addEventListener('blur', () => {
        const v = document.getElementById('login-pass').value;
        setFieldState('login-pass', 'lp-status', null, v.length >= 1 ? 'valid' : 'invalid');
    });

    // Username
    document.getElementById('reg-user').addEventListener('input', () => {
        const v = document.getElementById('reg-user').value.trim();
        if (v.length === 0) { setFieldState('reg-user', 'ru-status', null, null); return; }
        setFieldState('reg-user', 'ru-status', null,
            PATTERNS.username.test(v) ? 'valid' : 'invalid');
    });

    // Email
    document.getElementById('reg-email').addEventListener('input', () => {
        const v = document.getElementById('reg-email').value.trim();
        if (v.length === 0) { setFieldState('reg-email', 're-status', null, null); return; }
        setFieldState('reg-email', 're-status', null,
            PATTERNS.email.test(v) ? 'valid' : 'invalid');
    });

    // Password
    document.getElementById('reg-pass').addEventListener('input', () => {
        const v = document.getElementById('reg-pass').value;
        updatePasswordStrength(v);
        if (v.length === 0) { setFieldState('reg-pass', 'rp-status', null, null); return; }
        setFieldState('reg-pass', 'rp-status', null,
            PATTERNS.password.test(v) ? 'valid' : 'invalid');
    });

    // GSTIN — auto uppercase + validate on input
    document.getElementById('reg-gstin').addEventListener('input', function () {
        this.value = this.value.toUpperCase();
        const v = this.value.trim();
        if (v.length === 0) {
            setFieldState('reg-gstin', 'gstin-status', 'gstin-hint', null,
                'Format: 2-digit state code + PAN + entity code (15 chars)');
            return;
        }
        if (v.length < 15) {
            setFieldState('reg-gstin', 'gstin-status', 'gstin-hint', null,
                `${15 - v.length} more character(s) required`);
        } else {
            setFieldState('reg-gstin', 'gstin-status', 'gstin-hint',
                PATTERNS.gstin.test(v) ? 'valid' : 'invalid',
                PATTERNS.gstin.test(v) ? 'Valid GSTIN format ✓' : 'Invalid GSTIN format');
        }
    });

    // Aadhaar — auto-format with spaces
    document.getElementById('reg-aadhar').addEventListener('input', function () {
        const raw = this.value.replace(/\D/g, '').slice(0, 12);
        this.value = raw.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
        if (raw.length === 12) {
            setFieldState('reg-aadhar', 'aadhar-status', 'aadhar-hint', 'valid', 'Aadhaar format valid ✓');
        } else if (raw.length > 0) {
            setFieldState('reg-aadhar', 'aadhar-status', 'aadhar-hint', null,
                `${12 - raw.length} more digit(s) required`);
        } else {
            setFieldState('reg-aadhar', 'aadhar-status', 'aadhar-hint', null, '12-digit Aadhaar number');
        }
    });

    // PAN — auto uppercase
    document.getElementById('reg-pan').addEventListener('input', function () {
        this.value = this.value.toUpperCase();
        const v = this.value.trim();
        if (v.length === 0) {
            setFieldState('reg-pan', 'pan-status', 'pan-hint', null, '10-character PAN (e.g. ABCDE1234F)');
            return;
        }
        setFieldState('reg-pan', 'pan-status', 'pan-hint',
            PATTERNS.pan.test(v) ? 'valid' : (v.length < 10 ? null : 'invalid'),
            PATTERNS.pan.test(v) ? 'PAN format valid ✓' : (v.length < 10 ? `${10 - v.length} more char(s)` : 'Invalid PAN format'));
    });
}

/* ── Init ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    // Prevent Auth.checkAuth from redirecting (auth page is public)
    if (window.Auth) {
        window.Auth.checkAuth = () => {};
    }

    // Bind radio toggle
    document.getElementById('gst-yes').addEventListener('change', handleGSTToggle);
    document.getElementById('gst-no').addEventListener('change', handleGSTToggle);

    // Bind fetch / verify buttons
    document.getElementById('fetch-gst-btn').addEventListener('click', fetchGSTDetails);
    document.getElementById('verify-identity-btn').addEventListener('click', verifyIdentity);

    // Bind form submissions
    document.getElementById('signin-form').addEventListener('submit', handleSignIn);
    document.getElementById('signup-form').addEventListener('submit', handleSignUp);

    // Live validation
    bindLiveValidation();

    // Read initial tab from URL hash
    if (window.location.hash === '#signup') {
        switchTab('signup');
    }
});
