/**
 * Simple Voice Input for TaxCalm
 * Click mic to speak → text appears in chat → auto sends
 * Handles permission states: prompt / granted / denied
 */
(function () {
    'use strict';
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    var rec = null, listening = false;

    function getLang() {
        var map = { hi:'hi-IN', ta:'ta-IN', te:'te-IN', mr:'mr-IN', bn:'bn-IN' };
        return map[localStorage.getItem('taxcalm_language')] || 'en-IN';
    }

    function setUI(on) {
        listening = on;
        var icon   = document.getElementById('voiceIcon');
        var status = document.getElementById('voiceStatus');
        var banner = document.getElementById('voiceModeBanner');
        var btn    = document.getElementById('voiceChatToggle');
        if (icon)   icon.textContent = on ? '\uD83D\uDD34' : '\uD83C\uDF99\uFE0F';
        if (status) status.classList.toggle('hidden', !on);
        if (banner) banner.classList.toggle('hidden', !on);
        if (btn)    btn.title = on ? 'Stop listening' : 'Speak to chat';
    }

    function toast(html, color) {
        var existing = document.getElementById('_va_toast');
        if (existing) existing.remove();
        var d = document.createElement('div');
        d.id = '_va_toast';
        d.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:99999;' +
            'background:#1e293b;color:#f8fafc;border-radius:12px;padding:12px 18px;max-width:360px;' +
            'font-size:13px;line-height:1.6;box-shadow:0 8px 32px rgba(0,0,0,.6);text-align:center;' +
            'border-left:4px solid ' + (color || '#f59e0b');
        d.innerHTML = html + '<br><button onclick="document.getElementById(\'_va_toast\').remove()" ' +
            'style="margin-top:8px;background:#3b82f6;color:#fff;border:none;border-radius:6px;' +
            'padding:4px 14px;cursor:pointer;font-size:12px">OK</button>';
        document.body.appendChild(d);
        setTimeout(function () { if (d.parentNode) d.remove(); }, 9000);
    }
    function infoToast(html) { toast(html, '#22d3ee'); }
    function warnToast(html) { toast(html, '#f59e0b'); }

    function sendToChat(text) {
        if (!text) return;
        var input = document.getElementById('chatInput') || document.getElementById('userInput');
        if (input) input.value = text;
        var form = input && (input.closest('form') || document.getElementById('chatForm'));
        if (form) { form.dispatchEvent(new Event('submit', {bubbles:true,cancelable:true})); return; }
        var send = document.getElementById('sendBtn') || document.getElementById('chatSend');
        if (send) { send.click(); return; }
        if (input) input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:13,bubbles:true}));
    }

    function _doStart() {
        rec = new SR();
        rec.lang = getLang();
        rec.continuous = false;
        rec.interimResults = true;
        rec.onstart  = function() { setUI(true); };
        rec.onresult = function(e) {
            var input = document.getElementById('chatInput') || document.getElementById('userInput');
            var interim='', final='';
            for (var i=e.resultIndex; i<e.results.length; i++) {
                if (e.results[i].isFinal) final += e.results[i][0].transcript;
                else interim += e.results[i][0].transcript;
            }
            if (input) input.value = final || interim;
        };
        rec.onend = function() {
            setUI(false);
            var input = document.getElementById('chatInput') || document.getElementById('userInput');
            var text  = (input ? input.value : '').trim();
            if (text) sendToChat(text);
        };
        rec.onerror = function(e) {
            setUI(false);
            if (e.error==='not-allowed'||e.error==='permission-denied')
                warnToast('🎤 <b>Microphone blocked.</b><br>Click the <b>🔒 lock icon</b> in the address bar → Microphone → <b>Allow</b> → reload.');
            else if (e.error==='not-found')
                warnToast('🎤 No microphone found. Please connect one and try again.');
            else if (e.error!=='no-speech'&&e.error!=='aborted')
                console.warn('Voice error:', e.error);
        };
        try { rec.start(); } catch(err) { setUI(false); }
    }

    function startListening() {
        if (listening) return;
        if (!SR) { warnToast('🎤 Voice input needs <b>Chrome</b> or <b>Edge</b> browser.'); return; }
        // Check permission state before starting
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'microphone' }).then(function (result) {
                if (result.state === 'denied') {
                    warnToast(
                        '🎤 <b>Microphone is blocked for this site.</b><br>' +
                        'Click the <b>🔒 lock icon</b> in the address bar<br>' +
                        '→ Microphone → <b>Allow</b> → reload page.'
                    );
                } else if (result.state === 'prompt') {
                    infoToast('🎤 <b>Chrome will ask for microphone access.</b><br>Click <b>Allow</b> in the popup to start speaking.');
                    setTimeout(_doStart, 400);
                } else {
                    _doStart();
                }
            }).catch(function () { _doStart(); });
        } else {
            _doStart();
        }
    }

    function stopListening() {
        if (rec) { try { rec.stop(); } catch(_) {} }
        setUI(false);
    }

    function toggle() { listening ? stopListening() : startListening(); }

    function wire() {
        var btn  = document.getElementById('voiceChatToggle');
        var stop = document.getElementById('stopVoiceMode');
        if (btn)  btn.addEventListener('click', toggle);
        if (stop) stop.addEventListener('click', stopListening);
    }

    if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', wire);
    else wire();

    window.voiceAgent = { toggle:toggle, startListening:startListening, stopListening:stopListening, isListening:function(){ return listening; } };
    console.log('✅ Voice input ready');
})();
