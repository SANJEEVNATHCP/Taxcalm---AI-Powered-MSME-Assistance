/**
 * GST Stress-Reducer AI Assistant
 * Provides instant answers to common GST questions
 */

// ==================== DOM Elements ====================
const chatWindow = document.getElementById('chatWindowSide');
const chatSidebar = document.getElementById('chatSidebar');
const chatClose = document.getElementById('chatClose');
const chatOpenBtn = document.getElementById('chatOpenBtn');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const voiceInputBtn = document.getElementById('voiceInputBtn');
const voiceOutputToggle = document.getElementById('voiceOutputToggle');

// ==================== Voice Recognition Setup ====================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const speechRecognizer = SpeechRecognition ? new SpeechRecognition() : null;

if (speechRecognizer) {
    speechRecognizer.continuous = false;
    speechRecognizer.interimResults = true;
    speechRecognizer.lang = 'en-IN'; // Indian English

    speechRecognizer.onstart = () => {
        voiceInputBtn.classList.add('bg-red-500', 'hover:bg-red-600');
        voiceInputBtn.classList.remove('bg-purple-500', 'hover:bg-purple-600');
        voiceInputBtn.textContent = '🎤 Listening...';
    };

    speechRecognizer.onresult = (event) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
                chatInput.value = transcript;

                if (window.voiceAgent) {
                    if (window.voiceAgent.isCalm(transcript)) {
                        window.voiceAgent.activateAgentMode();
                        chatInput.value = '';
                    } else if (window.voiceAgent.isAgentMode) {
                        window.voiceAgent.handleAgentCommand(transcript);
                        chatInput.value = '';
                    }
                }
            } else {
                interimTranscript += transcript;
            }
        }

        if (interimTranscript) {
            chatInput.placeholder = `Hearing: "${interimTranscript}"`;
        }
    };

    speechRecognizer.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        voiceInputBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
        voiceInputBtn.classList.add('bg-purple-500', 'hover:bg-purple-600');
        voiceInputBtn.textContent = '🎤';
        addMessage(`Sorry, I couldn't hear that. Please try again or type your question.`, 'assistant');
    };

    speechRecognizer.onend = () => {
        voiceInputBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
        voiceInputBtn.classList.add('bg-purple-500', 'hover:bg-purple-600');
        voiceInputBtn.textContent = '🎤';
        chatInput.placeholder = 'Ask your question...';
    };
}

// ==================== Event Listeners ====================
// Open Chat from Header Button
if (chatOpenBtn) {
    chatOpenBtn.addEventListener('click', () => {
        if (chatSidebar) {
            chatSidebar.classList.remove('hidden');
            chatOpenBtn.classList.add('active-chat');
            // Focus input
            setTimeout(() => {
                if (chatInput) chatInput.focus();
            }, 100);
        }
    });
}

// Close/Minimize Chat
if (chatClose) {
    chatClose.addEventListener('click', () => {
        if (chatSidebar) {
            chatSidebar.classList.add('hidden');
            if (chatOpenBtn) chatOpenBtn.classList.remove('active-chat');
        }
    });
}

if (chatForm) {
    chatForm.addEventListener('submit', handleSendMessage);
}

// Voice input button
if (speechRecognizer && voiceInputBtn) {
    voiceInputBtn.addEventListener('click', () => {
        if (speechRecognizer.abort) {
            speechRecognizer.abort();
        } else {
            speechRecognizer.start();
        }
    });
} else {
    if (voiceInputBtn) {
        voiceInputBtn.disabled = true;
        voiceInputBtn.title = 'Voice input not supported in your browser';
    }
}

// Close chat sidebar on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatWindow) {
        const chatSidebar = document.getElementById('chatSidebar');
        if (chatSidebar && chatSidebar.style.display !== 'none') {
            chatSidebar.style.display = 'none';
        }
    }
});

// ==================== Floating Action Button (FAB) Menu ====================
const mainFab = document.getElementById('mainFab');
const fabMenu = document.getElementById('fabMenu');
const fabIcon = document.getElementById('fabIcon');
let fabMenuOpen = false;

if (mainFab && fabMenu) {
    mainFab.addEventListener('click', () => {
        fabMenuOpen = !fabMenuOpen;
        
        if (fabMenuOpen) {
            fabMenu.classList.remove('fab-menu-hidden');
            mainFab.classList.add('open');
            fabIcon.textContent = '✕';
            
            // Animate menu items in
            const items = fabMenu.querySelectorAll('button');
            items.forEach((item, index) => {
                setTimeout(() => {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8) translateX(20px)';
                    setTimeout(() => {
                        item.style.transition = 'all 0.3s ease';
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1) translateX(0)';
                    }, 10);
                }, index * 50);
            });
        } else {
            mainFab.classList.remove('open');
            fabIcon.textContent = '✨';
            
            // Animate menu items out
            const items = fabMenu.querySelectorAll('button');
            items.forEach((item, index) => {
                setTimeout(() => {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8) translateX(20px)';
                }, index * 30);
            });
            
            setTimeout(() => {
                fabMenu.classList.add('fab-menu-hidden');
            }, items.length * 30 + 200);
        }
    });

    // Handle FAB action buttons
    const fabActions = fabMenu.querySelectorAll('.fab-action');
    fabActions.forEach(button => {
        button.addEventListener('click', (e) => {
            const action = button.getAttribute('data-action');
            
            // Close the FAB menu
            fabMenuOpen = false;
            mainFab.classList.remove('open');
            fabIcon.textContent = '✨';
            fabMenu.classList.add('fab-menu-hidden');
            
            // Handle each action
            switch(action) {
                case 'voice':
                    const voiceBtn = document.getElementById('voiceInputBtn');
                    if (voiceBtn) voiceBtn.click();
                    break;
                case 'knowledge':
                    const ragToggle = document.getElementById('toggleRagSection');
                    if (ragToggle) ragToggle.click();
                    break;
                case 'clear':
                    if (confirm('Clear all chat messages?')) {
                        const chatMessages = document.getElementById('chatMessages');
                        if (chatMessages) chatMessages.innerHTML = '';
                    }
                    break;
                case 'import':
                    window.importChatHistory();
                    break;
                case 'export':
                    window.exportChatHistory();
                    break;
            }
        });
    });
}

// Hidden file input for import
const importFileInput = document.createElement('input');
importFileInput.type = 'file';
importFileInput.accept = '.txt,.json';
importFileInput.style.display = 'none';
document.body.appendChild(importFileInput);

// Import Chat History Function
window.importChatHistory = function() {
    importFileInput.click();
};

importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target.result;
        const chatMessages = document.getElementById('chatMessages');
        
        if (!chatMessages) return;
        
        // Clear existing messages
        if (confirm('Import will replace current chat. Continue?')) {
            chatMessages.innerHTML = '';
            
            // Parse and display imported messages
            const lines = content.split('\n\n');
            lines.forEach(line => {
                const trimmed = line.trim();
                if (trimmed) {
                    // Determine if it's a user or assistant message
                    const isUser = trimmed.startsWith('You:') || trimmed.startsWith('User:');
                    const messageText = trimmed.replace(/^(You:|User:|Assistant:|AI:)\s*/, '');
                    
                    if (messageText) {
                        const messageDiv = document.createElement('div');
                        messageDiv.className = isUser ? 'chat-message chat-message-user' : 'chat-message chat-message-assistant';
                        messageDiv.textContent = messageText;
                        chatMessages.appendChild(messageDiv);
                    }
                }
            });
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            if (window.toast) {
                window.toast.success('Chat imported successfully!');
            }
        }
    };
    
    reader.readAsText(file);
    importFileInput.value = ''; // Reset input
});

// Export Chat History Function
window.exportChatHistory = function() {
    const messages = document.querySelectorAll('#chatMessages .chat-message, #chatMessages .glass');
    const chatHistory = [];
    
    messages.forEach(msg => {
        const text = msg.textContent.trim();
        if (text && text !== '' && !text.includes('Listening...')) {
            chatHistory.push(text);
        }
    });
    
    const chatContent = chatHistory.join('\n\n');
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TaxCalm_Chat_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success message
    if (window.toast) {
        window.toast.success('Chat exported successfully!');
    }
};

// ==================== RAG Knowledge Base Integration ====================
// Initialized in window.addEventListener('load') below

// ==================== Functions ====================

/**
 * Handle sending a message
 */
async function handleSendMessage(e) {
    e.preventDefault();

    const question = chatInput.value.trim();
    if (!question) return;

    console.log('📤 Sending message:', question);

    // Get current language
    const currentLang = localStorage.getItem('preferred_language') || 'en';
    
    // Translate user input to English if needed (for AI processing)
    let questionForAI = question;
    if (currentLang !== 'en' && window.translator) {
        try {
            questionForAI = await window.translator.translateUserInput(question, currentLang);
            console.log('🔄 User input translated to English:', questionForAI);
        } catch (error) {
            console.warn('Translation error, using original input:', error);
        }
    }

    // Add user message to chat (show original message)
    addMessage(question, 'user');
    chatInput.value = '';

    // Show typing indicator
    showTypingIndicator();

    try {
        let responseData = null;
        let sources = null;

        // Try using AI enhanced chat first
        if (window.aiAssistant) {
            try {
                console.log('🤖 Using AI Assistant');
                responseData = await window.aiAssistant.chat(questionForAI); // Use translated question
                console.log('✅ AI response received:', responseData);

                // Translate AI response to user's language if needed
                if (currentLang !== 'en' && responseData.message && window.translator) {
                    try {
                        responseData.message = await window.translator.translateAIResponse(responseData.message, currentLang);
                        console.log('🔄 AI response translated to:', currentLang);
                    } catch (error) {
                        console.warn('Response translation error:', error);
                    }
                }

                // Handle different response types
                if (responseData.response_type === 'action') {
                    // Navigation or Finance Action
                    removeTypingIndicator();
                    handleActionResponse(responseData);
                    return;
                } else if (responseData.response_type === 'navigation') {
                    // Navigation to different tab
                    removeTypingIndicator();
                    addMessage(responseData.message, 'assistant');
                    navigateToTab(responseData.navigation_tab);
                    return;
                } else if (responseData.response_type === 'action_executed') {
                    // Action was auto-executed
                    removeTypingIndicator();
                    displayActionResult(responseData);
                    return;
                } else if (responseData.response_type === 'text' || responseData.message) {
                    // Regular text response
                    removeTypingIndicator();
                    addMessage(responseData.message, 'assistant', sources);
                    return;
                } else if (responseData.response_type === 'error') {
                    throw new Error(responseData.message);
                }
            } catch (aiError) {
                console.warn('⚠️ AI chat failed, falling back to basic endpoint:', aiError);
                responseData = null;
            }
        } else {
            console.warn('⚠️ AI Assistant not available');
        }

        // Fallback to basic GST endpoint if AI failed
        if (!responseData || !responseData.success) {
            console.log('🔄 Falling back to basic GST endpoint');
            const context = getCalculatorContext();
            const response = await fetch('/ask-gst', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: questionForAI, // Use translated question
                    context: context
                })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            
            // Translate response to user's language if needed
            if (currentLang !== 'en' && data.message && window.translator) {
                try {
                    data.message = await window.translator.translateAIResponse(data.message, currentLang);
                } catch (error) {
                    console.warn('Response translation error:', error);
                }
            }
            
            removeTypingIndicator();

            // Handle navigation responses
            if (data.response_type === 'navigation' && data.navigation_tab) {
                addMessage(data.message, 'assistant');
                navigateToTab(data.navigation_tab);
                console.log('✅ Navigation response received');
            } else {
                addMessage(data.message || data.answer || "No response received", 'assistant', data.sources);
                console.log('✅ GST endpoint response received');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
        removeTypingIndicator();
        addMessage(
            "Sorry, I had trouble understanding that. Try asking about registration, filing, rates, invoicing, or refunds.",
            'assistant'
        );
    }
}

/**
 * Handle action responses (navigation, finance operations)
 */
function handleActionResponse(data) {
    const { intent, action, target, params, requires_confirmation, action_category } = data;

    console.log('🎬 Handling action:', { intent, action, target });

    // Navigation action
    if (intent === 'navigation' && action === 'navigate' && target) {
        if (window.financeNavigator) {
            window.financeNavigator.navigate(target);
            addMessage(`✅ Navigating to ${target}...`, 'assistant');
        } else {
            addMessage(`Navigation to ${target} requested, but navigator not available.`, 'assistant');
        }
        return;
    }

    // Finance action requiring confirmation
    if (intent === 'finance_action' && requires_confirmation) {
        showActionConfirmation(data);
        return;
    }

    // Other actions
    addMessage(`Action recognized: ${action}. Implementation pending.`, 'assistant');
}

/**
 * Display result of an auto-executed action
 */
function displayActionResult(data) {
    const { result, action } = data;

    if (result && result.success) {
        // Success - show data if available
        let message = result.message || `✅ Action ${action} completed successfully`;

        // Add structured data display if present
        if (result.data) {
            addMessage(message, 'assistant');
            displayStructuredData(result.data, action);
        } else {
            addMessage(message, 'assistant');
        }
    } else {
        // Error
        addMessage(`❌ Action failed: ${result?.message || 'Unknown error'}`, 'assistant');
    }
}

/**
 * Navigate to a specific tab in the application
 */
function navigateToTab(tabName) {
    try {
        console.log('🔄 Attempting navigation to:', tabName);

        // Get all tab elements
        const allTabs = document.querySelectorAll('[id^="tab-"]');
        console.log('Found tabs:', allTabs.length, Array.from(allTabs).map(t => t.id));

        // Hide all tabs
        allTabs.forEach(tab => {
            if (tab.classList.contains('tab-content')) {
                tab.classList.add('hidden');
            }
        });

        // Show selected tab
        const tabElement = document.getElementById('tab-' + tabName);
        console.log('Looking for tab element with id: tab-' + tabName, 'Found:', !!tabElement);

        if (tabElement) {
            tabElement.classList.remove('hidden');
            // Scroll to top of content area
            const contentArea = document.getElementById('contentArea');
            if (contentArea) {
                contentArea.scrollTop = 0;
            }
            console.log('✅ Successfully navigated to tab:', tabName);
            return true;
        } else {
            console.warn('⚠️ Tab element not found with id: tab-' + tabName);

            // Try alternative approach - look for tab by data attribute
            const altTab = document.querySelector(`[data-tab-id="${tabName}"]`);
            if (altTab) {
                altTab.classList.remove('hidden');
                console.log('✅ Found tab via alternative selector');
                return true;
            }
        }

        // Update button highlight
        document.querySelectorAll('.tab-nav').forEach(btn => {
            btn.classList.remove('bg-emerald-600');
            btn.classList.add('text-emerald-300');
        });

        // Find and highlight the active button
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('bg-emerald-600');
            activeBtn.classList.remove('text-emerald-300');
            console.log('✅ Highlighted button for tab:', tabName);
        }

        return false;
    } catch (e) {
        console.error('❌ Error navigating to tab:', e);
        return false;
    }
}

/**
 * Display structured financial data (tables, summaries)
 */
function displayStructuredData(data, actionType) {
    // Create custom message element for structured data
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant-message';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    // Format based on action type
    if (actionType.includes('view_transactions') && data.transactions) {
        contentDiv.innerHTML = formatTransactionTable(data);
    } else if (actionType.includes('profit_loss') && data.net_profit !== undefined) {
        contentDiv.innerHTML = formatProfitLoss(data);
    } else if (actionType.includes('dashboard') || actionType.includes('summary')) {
        contentDiv.innerHTML = formatDashboard(data);
    } else {
        // Generic JSON display
        contentDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Format transaction table
 */
function formatTransactionTable(data) {
    const { transactions, total_income, total_expense, net } = data;

    let html = `
        <div style="font-size: 0.9em;">
            <strong>Transaction Summary:</strong><br>
            💰 Total Income: ₹${total_income || 0}<br>
            💸 Total Expenses: ₹${total_expense || 0}<br>
            📊 Net: ₹${net || 0}<br><br>
    `;

    if (transactions && transactions.length > 0) {
        html += '<strong>Recent Transactions:</strong><br>';
        html += '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">';
        html += '<tr style="background: #f0f0f0;"><th>Date</th><th>Type</th><th>Category</th><th>Amount</th></tr>';

        transactions.slice(0, 10).forEach(t => {
            const typeIcon = t.type === 'Income' ? '💰' : '💸';
            html += `<tr style="border-bottom: 1px solid #ddd;">
                <td>${t.transaction_date || t.date}</td>
                <td>${typeIcon} ${t.type}</td>
                <td>${t.category}</td>
                <td>₹${t.amount}</td>
            </tr>`;
        });

        html += '</table>';
    }

    html += '</div>';
    return html;
}

/**
 * Format P&L statement
 */
function formatProfitLoss(data) {
    return `
        <div style="font-size: 0.9em;">
            <strong>📊 Profit & Los Statement:</strong><br>
            Total Revenue: ₹${data.total_income || 0}<br>
            Total Expenses: ₹${data.total_expenses || 0}<br>
            <strong>Net Profit: ₹${data.net_profit || 0}</strong>
        </div>
    `;
}

/**
 * Format dashboard summary
 */
function formatDashboard(data) {
    return `
        <div style="font-size: 0.9em;">
            <strong>📊 Finance Dashboard:</strong><br>
            ${JSON.stringify(data, null, 2).replace(/[{}"]/g, '').replace(/,/g, '<br>')}
        </div>
    `;
}

/**
 * Show confirmation dialog for finance actions (safe mode)
 */
function showActionConfirmation(actionData) {
    const { action, params, action_category, intent } = actionData;

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'action-confirmation-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;

    // Action icon based on category
    const icons = {
        transaction: '💰',
        gst: '📋',
        tax: '📊',
        payroll: '👥',
        report: '📈',
        navigation: '🧭'
    };
    const icon = icons[action_category] || '⚡';

    // Build parameter display
    let paramsHtml = '<div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin: 16px 0;">';
    for (const [key, value] of Object.entries(params || {})) {
        paramsHtml += `<div style="margin: 4px 0;"><strong>${key}:</strong> ${value}</div>`;
    }
    paramsHtml += '</div>';

    modal.innerHTML = `
        <div style="text-align: center; margin-bottom: 16px;">
            <div style="font-size: 48px; margin-bottom: 8px;">${icon}</div>
            <h3 style="margin: 0; color: #333;">Confirm Action</h3>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="margin: 8px 0; color: #666;">
                The AI wants to perform the following action:
            </p>
            <div style="background: #e8f5e9; padding: 12px; border-radius: 8px; margin: 12px 0;">
                <strong style="color: #2e7d32;">${action.replace(/_/g, ' ').toUpperCase()}</strong>
            </div>
            
            <p style="margin: 12px 0 4px 0; font-weight: bold; color: #333;">Parameters:</p>
            ${paramsHtml}
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button id="confirm-cancel-btn" style="
                padding: 10px 20px;
                border: 1px solid #ddd;
                background: white;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            ">Cancel</button>
            <button id="confirm-action-btn" style="
                padding: 10px 20px;
                border: none;
                background: #4CAF50;
                color: white;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
            ">✓ Confirm & Execute</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Handle cancel
    document.getElementById('confirm-cancel-btn').addEventListener('click', () => {
        overlay.remove();
        addMessage('❌ Action canceled by user.', 'assistant');
    });

    // Handle confirm - Re-send message with execute flag
    document.getElementById('confirm-action-btn').addEventListener('click', async () => {
        const confirmBtn = document.getElementById('confirm-action-btn');
        confirmBtn.disabled = true;
        confirmBtn.textContent = '⏳ Executing...';

        overlay.remove();
        addMessage('⏳ Executing action...', 'assistant');

        // Note: Actual execution would happen via backend call or finance agent
        // For now, just show success message
        setTimeout(() => {
            addMessage(`✅ Action would be executed: ${action} (implementation pending backend execution)`, 'assistant');
        }, 500);
    });
}

/**
 * Add message to chat
 */
function addMessage(text, sender, sources = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = sender === 'user'
        ? 'bg-blue-100 text-gray-800 rounded-lg p-3 self-end max-w-xs text-sm'
        : 'bg-white rounded-lg p-4 border-l-4 border-blue-500 text-sm';

    messageDiv.innerHTML = sender === 'user'
        ? `<p>${escapeHtml(text)}</p>`
        : `
            <p class="text-gray-800">${text}</p>
            ${sources && sources.length > 0 ? `
                <div class="mt-2 flex flex-wrap gap-1">
                    ${sources.map(source => `
                        <span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                            ${source}
                        </span>
                    `).join('')}
                </div>
            ` : ''}
            <p class="text-xs text-gray-500 mt-2">
                ⚠️ Consult a CA for official advice.
            </p>
        `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Speak the response if voice output is enabled
    if (sender === 'assistant' && voiceOutputToggle && voiceOutputToggle.checked) {
        speakText(text);
    }
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typingIndicator';
    typingDiv.className = 'flex gap-1 items-center p-3 bg-gray-100 rounded-lg';
    typingDiv.innerHTML = `
        <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
        <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></span>
        <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator() {
    const typingDiv = document.getElementById('typingIndicator');
    if (typingDiv) {
        typingDiv.remove();
    }
}

/**
 * Get calculator context if results are displayed
 */
function getCalculatorContext() {
    const resultsContainer = document.getElementById('resultsContainer');

    if (resultsContainer && !resultsContainer.classList.contains('hidden')) {
        const sales = document.getElementById('sales').value;
        const purchases = document.getElementById('purchases').value;
        const rate = document.getElementById('rate').value;
        const netGst = document.getElementById('netGst').textContent;

        return `I have sales of ₹${sales}, purchases of ₹${purchases}, GST rate ${rate}%, and my net GST is ${netGst}.`;
    }

    return null;
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
 * Text-to-Speech: Speak the response
 */
function speakText(text) {
    // Remove HTML tags if present
    const cleanText = text.replace(/<[^>]*>/g, '').substring(0, 500); // Limit to 500 chars

    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-IN'; // Indian English
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        window.speechSynthesis.speak(utterance);
    }
}

/**
 * Stop voice output
 */
function stopSpeaking() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

/**
 * Start voice input
 */
function startVoiceInput() {
    if (speechRecognizer) {
        try {
            speechRecognizer.start();
        } catch (e) {
            console.error('Error starting speech recognition:', e);
            addMessage('Voice input is not available in your browser. Please type your question.', 'assistant');
        }
    } else {
        addMessage('Voice input is not supported in your browser. Please type your question.', 'assistant');
    }
}

// ==================== Suggestions ====================

/**
 * Add quick suggestion buttons
 */
function addQuickSuggestions() {
    const suggestions = [
        'What is GST registration?',
        'How do I file GST returns?',
        'What is Input Tax Credit?',
        'What are the GST rates?'
    ];

    // This can be called after initial greeting to show quick suggestions
    // Implementation depends on UX preference
}

// ==================== Accessibility ====================

// ARIA labels for screen readers
if (chatOpenBtn) {
    chatOpenBtn.setAttribute('aria-label', 'Open AI Assistant Chat');
}
if (chatClose) {
    chatClose.setAttribute('aria-label', 'Close Chat');
}
if (chatForm) {
    chatForm.setAttribute('aria-label', 'Send message form');
}
if (voiceInputBtn) {
    voiceInputBtn.setAttribute('aria-label', 'Send voice message');
}
if (voiceOutputToggle) {
    voiceOutputToggle.setAttribute('aria-label', 'Toggle voice output');
}
if (chatMessages) {
    chatMessages.setAttribute('role', 'log');
    chatMessages.setAttribute('aria-live', 'polite');
}

// Stop speaking when page unloads
window.addEventListener('beforeunload', stopSpeaking);

// Stop speaking when closing chat
if (chatClose) {
    chatClose.addEventListener('click', stopSpeaking);
}

// ==================== AI FEATURE HANDLERS ====================

// Check AI Status on page load
async function initializeAIStatus() {
    try {
        if (window.aiAssistant && typeof window.aiAssistant.checkAIStatus === 'function') {
            const status = await window.aiAssistant.checkAIStatus();
            updateAIStatusIndicator(status.status === 'ok');
        }
    } catch (error) {
        console.warn('AI status check failed:', error);
        updateAIStatusIndicator(false);
    }
}

// Update AI status indicator
function updateAIStatusIndicator(isActive) {
    const statusBtn = document.getElementById('aiStatusBtn');
    const statusText = document.getElementById('aiStatusText');
    if (statusBtn) {
        if (isActive) {
            statusBtn.style.backgroundColor = '#10b981';
            statusText.textContent = 'AI Ready';
            statusBtn.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.5)';
        } else {
            statusBtn.style.backgroundColor = '#ef4444';
            statusText.textContent = 'AI Offline';
            statusBtn.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.5)';
        }
    }
}

// Get AI Compliance Suggestions
async function getAIComplianceSuggestions() {
    const btn = document.getElementById('getComplianceSuggestions');
    const box = document.getElementById('complianceSuggestionsBox');
    const text = document.getElementById('complianceSuggestionsText');

    if (!btn || !box || !text) return;

    btn.disabled = true;
    btn.textContent = '⏳ Generating...';

    // Fallback: Show helpful compliance tips instead
    setTimeout(() => {
        text.innerHTML = `
<strong>📋 Key Compliance Steps for MSME:</strong><br/><br/>
✓ <strong>GST Registration:</strong> Required if turnover > ₹40 lakhs/year<br/>
✓ <strong>Monthly Returns:</strong> File GSTR-1 (Sales) & GSTR-2 (Purchases) by 15th<br/>
✓ <strong>Quarterly Summary:</strong> File GSTR-3B by 20th of next month<br/>
✓ <strong>Record Keeping:</strong> Maintain invoices and bills for 6 years<br/>
✓ <strong>Payment:</strong> Pay GST before filing returns<br/><br/>
<em>For personalized advice, consult a Chartered Accountant.</em>
        `;
        box.style.display = 'block';
        btn.disabled = false;
        btn.textContent = '🎯 Get Compliance Tips';
    }, 500);
}

// Clear Compliance Cache
function clearComplianceCache() {
    const box = document.getElementById('complianceSuggestionsBox');
    if (box) box.style.display = 'none';
}

// Analyze GST with AI - WITH VISUALIZATION
async function analyzeGSTWithAI() {
    const btn = document.getElementById('analyzeGSTBtn');
    const box = document.getElementById('aiAnalysisBox');
    const text = document.getElementById('aiAnalysisText');

    if (!btn || !box || !text) return;

    btn.disabled = true;
    btn.textContent = '⏳ Generating...';

    // Get calculator values
    const sales = parseFloat(document.getElementById('sales')?.value || 0);
    const purchases = parseFloat(document.getElementById('purchases')?.value || 0);
    const gstRate = parseFloat(document.getElementById('rate')?.value || 18);

    // Calculate metrics
    const gstCollected = sales * (gstRate / 100);
    const gstPaid = purchases * (gstRate / 100);
    const netGST = gstCollected - gstPaid;
    const margin = sales > 0 ? ((sales - purchases) / sales * 100).toFixed(1) : 0;

    // Create visualization HTML
    const visualization = `
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px;">
    <!-- GST Collected Card -->
    <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 16px; border-radius: 8px; color: white; text-align: center;">
        <div style="font-size: 28px; font-weight: bold;">₹${gstCollected.toFixed(0)}</div>
        <div style="font-size: 12px; margin-top: 4px;">GST Collected</div>
    </div>
    
    <!-- GST Paid Card -->
    <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 16px; border-radius: 8px; color: white; text-align: center;">
        <div style="font-size: 28px; font-weight: bold;">₹${gstPaid.toFixed(0)}</div>
        <div style="font-size: 12px; margin-top: 4px;">GST Paid (ITC)</div>
    </div>
    
    <!-- Net GST Card -->
    <div style="background: linear-gradient(135deg, #3b82f6, #1e40af); padding: 16px; border-radius: 8px; color: white; text-align: center;">
        <div style="font-size: 28px; font-weight: bold;">₹${Math.abs(netGST).toFixed(0)}</div>
        <div style="font-size: 12px; margin-top: 4px;">${netGST >= 0 ? 'GST Payable' : 'Refund Due'}</div>
    </div>
    
    <!-- Margin Card -->
    <div style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); padding: 16px; border-radius: 8px; color: white; text-align: center;">
        <div style="font-size: 28px; font-weight: bold;">${margin}%</div>
        <div style="font-size: 12px; margin-top: 4px;">Profit Margin</div>
    </div>
</div>

<strong>📊 Analysis:</strong><br/>
✓ Sales Revenue: ₹${sales.toLocaleString()}<br/>
✓ Cost of Goods: ₹${purchases.toLocaleString()}<br/>
✓ GST Rate Applied: ${gstRate}%<br/>
✓ Net GST Status: ${netGST >= 0 ? '💳 ' + netGST.toFixed(2) + ' (Payment Due)' : '✅ ₹' + Math.abs(netGST).toFixed(2) + ' (Refund Expected)'}<br/><br/>

<strong>💡 Optimization Tips:</strong><br/>
✓ Maintain complete ITC documentation<br/>
✓ File returns on time to avoid interest<br/>
✓ Reconcile GSTR-1 and GSTR-2 regularly<br/>
✓ Update GST rate classifications<br/>
✓ Keep invoices organized by HSN codes<br/><br/>
<em>For detailed analysis, consult your CA.</em>
    `;

    setTimeout(() => {
        text.innerHTML = visualization;
        box.style.display = 'block';
        btn.disabled = false;
        btn.textContent = '🤖 AI Analysis & Optimization';
    }, 300);
}

// Get AI Business Advice
async function getAIBusinessAdvice() {
    const btn = document.getElementById('getBusinessAdviceBtn');
    const box = document.getElementById('businessAdviceBox');
    const text = document.getElementById('businessAdviceText');
    const businessType = document.getElementById('businessType')?.value;
    const adviceType = document.getElementById('adviceType')?.value;

    if (!btn || !box || !text) return;

    if (!businessType || !adviceType) {
        alert('Please select both business type and advice category');
        return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Generating...';

    // Show helpful advice based on selection
    setTimeout(() => {
        let adviceText = '';

        if (adviceType === 'scaling') {
            adviceText = `
<strong>📈 Tips for Scaling Your ${businessType} Business:</strong><br/>
✓ Optimize your supply chain and inventory<br/>
✓ Implement better accounting systems<br/>
✓ Consider hiring GST/accounting professionals<br/>
✓ Explore government MSME schemes<br/>
✓ Maintain compliance to avoid penalties<br/>
✓ Build strong vendor relationships<br/>
✓ Track KPIs regularly<br/><br/>
<em>Consult a business consultant for personalized growth strategy.</em>
            `;
        } else if (adviceType === 'tax_optimization') {
            adviceText = `
<strong>💰 Tax Optimization Strategies:</strong><br/>
✓ Claim all eligible ITC<br/>
✓ File returns on time to avoid interest<br/>
✓ Maintain proper documentation<br/>
✓ Use composition scheme if eligible<br/>
✓ Monitor turnover thresholds<br/>
✓ Deduct business expenses properly<br/>
✓ Keep separate personal & business accounts<br/><br/>
<em>Work with a CA for tax planning specific to your business.</em>
            `;
        } else if (adviceType === 'compliance') {
            adviceText = `
<strong>✅ Compliance Checklist:</strong><br/>
✓ GST registration (if applicable)<br/>
✓ Monthly GST filing (GSTR-1, GSTR-2)<br/>
✓ Quarterly summary (GSTR-3B)<br/>
✓ Annual return filing<br/>
✓ Income tax filing (ITR)<br/>
✓ PF/ESIC contributions<br/>
✓ TDS payments if applicable<br/>
✓ Labor law compliance<br/><br/>
<em>Missing deadlines can result in penalties up to 10-20% of tax.</em>
            `;
        } else if (adviceType === 'financial') {
            adviceText = `
<strong>📊 Financial Planning Tips:</strong><br/>
✓ Maintain 3-6 months cash reserve<br/>
✓ Use accounting software (Tally, Busy, etc.)<br/>
✓ Do monthly reconciliation<br/>
✓ Create quarterly profit & loss statements<br/>
✓ Monitor working capital<br/>
✓ Plan for seasonal variations<br/>
✓ Budget for tax payments in advance<br/><br/>
<em>Good financial records help in loan approvals and expansion.</em>
            `;
        } else {
            adviceText = `
<strong>🤔 General Business Advice:</strong><br/>
✓ Keep detailed records of all transactions<br/>
✓ Separate personal and business finances<br/>
✓ File GST and income tax returns on time<br/>
✓ Maintain proper invoicing system<br/>
✓ Stay updated with tax law changes<br/>
✓ Get professional guidance when needed<br/>
✓ Build strong business relationships<br/><br/>
<em>Success requires consistent compliance and record-keeping.</em>
            `;
        }

        text.innerHTML = adviceText;
        box.style.display = 'block';
        btn.disabled = false;
        btn.textContent = '💭 Get AI Advice';
    }, 500);
}

// Document Upload Handler - Info Display
function setupDocumentUpload() {
    const uploadArea = document.getElementById('documentUploadArea');
    const processBox = document.getElementById('processedDocBox');
    const processText = document.getElementById('processedDocText');

    if (!uploadArea) return;

    // Show information when clicking upload area
    uploadArea.addEventListener('click', () => {
        processText.innerHTML = `
<strong>📋 Document Types Supported:</strong><br/>
• Invoices (GST invoices)<br/>
• Bills<br/>
• Receipts<br/>
• Purchase Orders<br/><br/>
<strong>📊 Information Extracted:</strong><br/>
✓ Document Date<br/>
✓ Invoice/Bill Number<br/>
✓ Seller GSTIN<br/>
✓ Buyer GSTIN<br/>
✓ Item Details & HSN Codes<br/>
✓ Taxable Value<br/>
✓ GST Amount (5%, 12%, 18%, 28%)<br/>
✓ Total Amount<br/><br/>
<strong>💡 Tip:</strong> Use clear, high-resolution images or PDF files for best results.
        `;
        processBox.style.display = 'block';
    });

    // Show info on hover
    uploadArea.addEventListener('mouseenter', () => {
        uploadArea.style.backgroundColor = 'rgba(236,72,153,0.15)';
    });

    uploadArea.addEventListener('mouseleave', () => {
        uploadArea.style.backgroundColor = 'rgba(236,72,153,0.05)';
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDocumentUpload);
} else {
    setupDocumentUpload();
}

// ==================== ANALYTICS DASHBOARD ====================
let revenueChart = null;
let gstChart = null;

function updateAnalyticsDashboard() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.log('Chart.js not loaded yet');
        return;
    }

    const sales = parseFloat(document.getElementById('sales')?.value || 0);
    const purchases = parseFloat(document.getElementById('purchases')?.value || 0);
    const gstRate = parseFloat(document.getElementById('rate')?.value || 18);

    // Calculate metrics
    const gstCollected = sales * (gstRate / 100);
    const gstPaid = purchases * (gstRate / 100);
    const netGST = gstCollected - gstPaid;
    const margin = sales > 0 ? ((sales - purchases) / sales * 100) : 0;
    const efficiency = purchases > 0 ? ((sales - purchases) / purchases * 100) : 0;

    // Update stat cards safely
    const statTurnover = document.getElementById('statTurnover');
    const statGST = document.getElementById('statGST');
    const statMargin = document.getElementById('statMargin');
    const statEfficiency = document.getElementById('statEfficiency');

    if (statTurnover) statTurnover.textContent = '₹' + sales.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    if (statGST) statGST.textContent = '₹' + Math.abs(netGST).toLocaleString('en-IN', { maximumFractionDigits: 0 });
    if (statMargin) statMargin.textContent = margin.toFixed(1) + '%';
    if (statEfficiency) statEfficiency.textContent = efficiency.toFixed(1) + '%';

    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx && typeof Chart !== 'undefined') {
        try {
            if (revenueChart) {
                revenueChart.destroy();
            }

            revenueChart = new Chart(revenueCtx, {
                type: 'bar',
                data: {
                    labels: ['Revenue', 'Expenses'],
                    datasets: [{
                        label: 'Amount (₹)',
                        data: [sales, purchases],
                        backgroundColor: [
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(245, 158, 11, 0.8)'
                        ],
                        borderColor: [
                            '#10b981',
                            '#f59e0b'
                        ],
                        borderWidth: 2,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#e2e8f0',
                                font: { size: 12 }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: '#94a3b8',
                                callback: function (value) {
                                    return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
                                }
                            },
                            grid: {
                                color: 'rgba(148, 163, 184, 0.1)'
                            }
                        },
                        x: {
                            ticks: {
                                color: '#94a3b8'
                            },
                            grid: {
                                color: 'rgba(148, 163, 184, 0.1)'
                            }
                        }
                    }
                }
            });
        } catch (e) {
            console.error('Error creating revenue chart:', e);
        }
    }

    // GST Chart
    const gstCtx = document.getElementById('gstChart');
    if (gstCtx) {
        try {
            if (gstChart) {
                gstChart.destroy();
            }

            gstChart = new Chart(gstCtx, {
                type: 'doughnut',
                data: {
                    labels: ['GST Collected', 'GST Paid'],
                    datasets: [{
                        data: [gstCollected, gstPaid],
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(139, 92, 246, 0.8)'
                        ],
                        borderColor: [
                            '#3b82f6',
                            '#8b5cf6'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#e2e8f0',
                                font: { size: 12 }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return '₹' + context.parsed.toLocaleString('en-IN', { maximumFractionDigits: 0 });
                                }
                            }
                        }
                    }
                }
            });
        } catch (e) {
            console.error('Error creating GST chart:', e);
        }
    }
}

// ==================== RAG Functions ====================

/**
 * Upload files to RAG knowledge base
 */
async function uploadRAGFiles(files) {
    const progressDiv = document.getElementById('ragUploadProgress');
    const statusSpan = document.getElementById('ragUploadStatus');

    if (!files || files.length === 0) return;

    // Show progress
    if (progressDiv) progressDiv.classList.remove('hidden');
    if (statusSpan) statusSpan.textContent = `Uploading ${files.length} file(s)...`;

    try {
        const formData = new FormData();
        for (let file of files) {
            formData.append('files', file);
        }

        const response = await fetch('/api/rag/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            if (statusSpan) statusSpan.textContent = `✅ ${data.message}`;
            addMessage(`📚 Uploaded ${files.length} document(s) to knowledge base`, 'assistant');

            // Refresh status
            setTimeout(() => {
                loadRAGStatus();
                if (progressDiv) progressDiv.classList.add('hidden');
            }, 2000);
        } else {
            throw new Error(data.message || 'Upload failed');
        }
    } catch (error) {
        console.error('RAG upload error:', error);
        if (statusSpan) statusSpan.textContent = `❌ ${error.message}`;
        addMessage(`Failed to upload documents: ${error.message}`, 'assistant');

        setTimeout(() => {
            if (progressDiv) progressDiv.classList.add('hidden');
        }, 3000);
    }
}

/**
 * Search in RAG knowledge base
 */
async function handleRAGSearch() {
    const searchInput = document.getElementById('ragSearchInput');
    if (!searchInput || !searchInput.value.trim()) return;

    const query = searchInput.value.trim();

    try {
        addMessage(`🔍 Searching knowledge base for: "${query}"`, 'user');
        showTypingIndicator();

        const response = await fetch('/api/rag/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, top_k: 3 })
        });

        const data = await response.json();

        removeTypingIndicator();

        if (data.success && data.results && data.results.length > 0) {
            let message = `Found ${data.results.length} relevant document(s):\n\n`;
            data.results.forEach((result, idx) => {
                message += `${idx + 1}. ${result.content.substring(0, 200)}...\n`;
                message += `   (Source: ${result.metadata?.source || 'Unknown'})\n\n`;
            });
            addMessage(message, 'assistant');
        } else {
            addMessage('No relevant documents found in knowledge base.', 'assistant');
        }

        searchInput.value = '';
    } catch (error) {
        console.error('RAG search error:', error);
        removeTypingIndicator();
        addMessage(`Search failed: ${error.message}`, 'assistant');
    }
}

/**
 * Load RAG status information
 */
async function loadRAGStatus() {
    try {
        const response = await fetch('/api/rag/status');
        const data = await response.json();

        const docCountSpan = document.getElementById('ragDocCount');
        if (docCountSpan && data.document_count !== undefined) {
            docCountSpan.textContent = `${data.document_count} document(s)`;
        }
    } catch (error) {
        console.error('Failed to load RAG status:', error);
    }
}

// Initialize AI on page load
window.addEventListener('load', function () {
    initializeAIStatus();
    updateAnalyticsDashboard();
    initializeRAG();
});

/**
 * Initialize RAG Knowledge Base UI
 */
function initializeRAG() {
    console.log('🚀 Initializing RAG UI...');

    // Toggle RAG section
    const toggleRagBtn = document.getElementById('toggleRagSection');
    const ragSection = document.getElementById('ragSection');

    console.log('Toggle button found:', !!toggleRagBtn);
    console.log('RAG section found:', !!ragSection);

    if (toggleRagBtn && ragSection) {
        toggleRagBtn.addEventListener('click', () => {
            console.log('📚 RAG button clicked!');
            ragSection.classList.toggle('hidden');
            console.log('RAG section hidden:', ragSection.classList.contains('hidden'));

            // Load status when opening
            if (!ragSection.classList.contains('hidden')) {
                loadRAGStatus();
            }
        });
        console.log('✅ RAG toggle button initialized');
    } else {
        console.error('❌ RAG initialization failed - button or section not found');
    }

    // RAG File Upload - Drag & Drop
    const ragDropZone = document.getElementById('ragDropZone');
    const ragFileInput = document.getElementById('ragFileInput');

    if (ragDropZone && ragFileInput) {
        // Click to upload
        ragDropZone.addEventListener('click', () => {
            ragFileInput.click();
        });

        // File selected
        ragFileInput.addEventListener('change', () => {
            if (ragFileInput.files && ragFileInput.files.length > 0) {
                uploadRAGFiles(ragFileInput.files);
            }
        });

        // Drag and drop
        ragDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            ragDropZone.classList.add('bg-slate-700', 'border-amber-400');
        });

        ragDropZone.addEventListener('dragleave', () => {
            ragDropZone.classList.remove('bg-slate-700', 'border-amber-400');
        });

        ragDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            ragDropZone.classList.remove('bg-slate-700', 'border-amber-400');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                uploadRAGFiles(e.dataTransfer.files);
            }
        });
    }

    // RAG Search
    const ragSearchBtn = document.getElementById('ragSearchBtn');
    const ragSearchInput = document.getElementById('ragSearchInput');

    if (ragSearchBtn && ragSearchInput) {
        ragSearchBtn.addEventListener('click', () => {
            handleRAGSearch();
        });

        ragSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleRAGSearch();
            }
        });
    }
}
