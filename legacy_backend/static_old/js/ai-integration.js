/**
 * OpenRouter AI Integration - Frontend
 * Handles all interactions with the new AI-powered features
 */

class AIAssistant {
    constructor() {
        this.chatHistory = [];
        // API configuration - use current server origin
        this.apiBaseUrl = window.location.origin;
    }

    /**
     * Enhanced Chat with AI (supports agentic actions)
     */
    async chat(userMessage) {
        try {
            console.log('📨 Sending to /ai/enhanced-chat:', { message: userMessage, chatHistoryLen: this.chatHistory.length });
            
            const response = await fetch(`${this.apiBaseUrl}/api/ai/enhanced-chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: userMessage,
                    chat_history: this.chatHistory
                })
            });

            console.log('📥 Response status:', response.status, response.statusText);

            // Check if response is OK
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            // Get response text first to debug
            const responseText = await response.text();
            console.log('📦 Response text length:', responseText.length);
            
            if (!responseText) {
                throw new Error('Empty response from server');
            }

            const data = JSON.parse(responseText);
            console.log('✅ Parsed response:', { 
                success: data.success, 
                responseType: data.response_type, 
                intent: data.intent 
            });
            
            if (data.success) {
                // For text responses, maintain chat history as before
                if (data.response_type === 'text' || data.message) {
                    this.chatHistory.push({ role: 'user', content: userMessage });
                    if (data.message) {
                        this.chatHistory.push({ role: 'assistant', content: data.message });
                    }
                }
                
                // Return full response object for action handling
                return data;
            } else {
                return { 
                    success: false, 
                    response_type: 'error',
                    message: `Error: ${data.error || 'Failed to get response'}` 
                };
            }
        } catch (error) {
            console.error('❌ Chat error:', error.message, error.stack);
            return { 
                success: false, 
                response_type: 'error',
                message: `Connection error: ${error.message}` 
            };
        }
    }
    
    /**
     * Execute a finance action (after user confirmation)
     */
    async executeFinanceAction(action, params) {
        // This is called when user confirms an action in safe mode
        // We don't need to call the endpoint again - the action is already parsed
        // The execution will happen via finance agent in the backend
        console.log('💰 Executing finance action:', action, params);
        return { success: true, message: 'Action queued for execution' };
    }

    /**
     * Get Compliance Suggestions
     */
    async getComplianceSuggestions(businessType, turnover, employees = 0, recentIssues = null) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/ai/compliance-suggestions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    business_type: businessType,
                    turnover: turnover,
                    employees: employees,
                    recent_issues: recentIssues || []
                })
            });

            const data = await response.json();
            return data.success ? data.suggestions : { error: data.error };
        } catch (error) {
            console.error('Compliance suggestions error:', error);
            return { error: error.message };
        }
    }

    /**
     * Analyze GST Pattern
     */
    async analyzeGSTPattern(salesData, purchaseData, gstRate, period = 'monthly') {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/ai/gst-analysis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sales_data: salesData,
                    purchase_data: purchaseData,
                    gst_rate: gstRate,
                    period: period
                })
            });

            const data = await response.json();
            return data.success ? data.analysis : { error: data.error };
        } catch (error) {
            console.error('GST analysis error:', error);
            return { error: error.message };
        }
    }

    /**
     * Process Document (Invoice, Bill, Receipt)
     */
    async processDocument(documentText, documentType = 'invoice') {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/ai/process-document`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    document_text: documentText,
                    document_type: documentType
                })
            });

            const data = await response.json();
            return data.success ? data.extraction : { error: data.error };
        } catch (error) {
            console.error('Document processing error:', error);
            return { error: error.message };
        }
    }

    /**
     * Get Business Advice
     */
    async getBusinessAdvice(query, businessContext = null) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/ai/business-advice`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: query,
                    business_context: businessContext
                })
            });

            const data = await response.json();
            return data.success ? data.advice : { error: data.error };
        } catch (error) {
            console.error('Business advice error:', error);
            return { error: error.message };
        }
    }

    /**
     * Check AI Status
     */
    async checkAIStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/ai/status`);
            return await response.json();
        } catch (error) {
            console.error('AI status check error:', error);
            return { status: 'offline', error: error.message };
        }
    }

    /**
     * Clear Chat History
     */
    clearHistory() {
        this.chatHistory = [];
    }
}

// Global AI Assistant Instance
window.aiAssistant = new AIAssistant();

/**
 * Initialize AI Features on Page Load
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const status = await window.aiAssistant.checkAIStatus();
        console.log('AI Status:', status);
        
        if (status.status === 'operational') {
            console.log('✅ AI Features Ready:', status.features);
        }
    } catch (error) {
        console.warn('AI initialization warning:', error.message);
    }
});

/**
 * Example usage functions
 */

// Note: Enhanced Chat Widget Integration is handled by ai-assistant.js
// to avoid duplicate event listeners and conflicts

