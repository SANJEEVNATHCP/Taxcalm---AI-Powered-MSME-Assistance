/**
 * Bank Reconciliation Manager for TaxCalm
 * Handles bank statement upload, auto-matching, and manual reconciliation
 */

class ReconciliationManager {
    constructor() {
        this.bankAccounts = [];
        this.bankTransactions = [];
        this.bookTransactions = [];
        this.matches = [];
        this.selectedBankAccount = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadBankAccounts();
    }
    
    bindEvents() {
        // Bank statement upload
        document.getElementById('uploadStatementBtn')?.addEventListener('click', () => this.showUploadModal());
        document.getElementById('uploadFileBtn')?.addEventListener('click', () => this.uploadBankStatement());
        document.getElementById('cancelUploadBtn')?.addEventListener('click', () => this.hideUploadModal());
        
        // Reconciliation actions
        document.getElementById('runAutoMatchBtn')?.addEventListener('click', () => this.runAutoMatching());
        document.getElementById('refreshReconciliationBtn')?.addEventListener('click', () => this.loadReconciliationData());
        document.getElementById('acceptAllHighBtn')?.addEventListener('click', () => this.acceptAllHighConfidence());
        
        // Bank account selection
        document.getElementById('bankAccountSelect')?.addEventListener('change', (e) => {
            this.selectedBankAccount = e.target.value;
            if (this.selectedBankAccount) {
                this.loadReconciliationData();
            }
        });
    }
    
    // ==================== DATA LOADING ====================
    
    async loadBankAccounts() {
        try {
            const response = await fetch('/api/finance/bank-accounts');
            const result = await response.json();
            
            if (result.success) {
                this.bankAccounts = result.data;
                this.populateBankAccountSelect();
            }
        } catch (error) {
            console.error('Error loading bank accounts:', error);
            this.showToast('Failed to load bank accounts', 'error');
        }
    }
    
    async loadReconciliationData() {
        if (!this.selectedBankAccount) return;
        
        try {
            // Load summary
            await this.loadReconciliationSummary();
            
            // Load discrepancies
            await this.loadDiscrepancies();
            
        } catch (error) {
            console.error('Error loading reconciliation data:', error);
            this.showToast('Failed to load reconciliation data', 'error');
        }
    }
    
    async loadReconciliationSummary() {
        const response = await fetch(`/api/finance/reconciliation/summary?bank_account_id=${this.selectedBankAccount}`);
        const result = await response.json();
        
        if (result.success) {
            this.renderSummary(result.data);
        }
    }
    
    async loadDiscrepancies() {
        const response = await fetch(`/api/finance/reconciliation/discrepancies?bank_account_id=${this.selectedBankAccount}`);
        const result = await response.json();
        
        if (result.success) {
            this.bankTransactions = result.data.unmatched_bank_transactions;
            this.bookTransactions = result.data.unreconciled_book_transactions;
            
            this.renderBankTransactions();
            this.renderBookTransactions();
        }
    }
    
    // ==================== BANK STATEMENT UPLOAD ====================
    
    showUploadModal() {
        document.getElementById('uploadModal').classList.remove('hidden');
        document.getElementById('uploadBankAccount').value = this.selectedBankAccount || '';
    }
    
    hideUploadModal() {
        document.getElementById('uploadModal').classList.add('hidden');
        document.getElementById('uploadForm').reset();
    }
    
    async uploadBankStatement() {
        try {
            const form = document.getElementById('uploadForm');
            const formData = new FormData(form);
            
            const fileInput = document.getElementById('statementFile');
            if (!fileInput.files[0]) {
                this.showToast('Please select a file', 'error');
                return;
            }
            
            // Show loading
            const uploadBtn = document.getElementById('uploadFileBtn');
            const originalText = uploadBtn.innerHTML;
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>Uploading...';
            
            const response = await fetch('/api/finance/bank-statements/import', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = originalText;
            
            if (result.success) {
                this.showToast(`Bank statement imported: ${result.inserted_transactions} transactions added`, 'success');
                this.hideUploadModal();
                this.loadReconciliationData();
                
                // Show validation warnings if any
                if (result.validation && result.validation.warnings.length > 0) {
                    this.showValidationWarnings(result.validation.warnings);
                }
            } else {
                this.showToast(result.error || 'Failed to upload statement', 'error');
            }
        } catch (error) {
            console.error('Error uploading statement:', error);
            this.showToast('Failed to upload statement', 'error');
        }
    }
    
    // ==================== AUTO-MATCHING ====================
    
    async runAutoMatching() {
        if (!this.selectedBankAccount) {
            this.showToast('Please select a bank account', 'error');
            return;
        }
        
        try {
            const btn = document.getElementById('runAutoMatchBtn');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>Matching...';
            
            const response = await fetch('/api/finance/reconciliation/auto-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bank_account_id: this.selectedBankAccount,
                    date_range_days: 90
                })
            });
            
            const result = await response.json();
            
            btn.disabled = false;
            btn.innerHTML = originalText;
            
            if (result.success) {
                this.matches = result.data.matches;
                this.showToast(`Found ${result.data.total_matches} potential matches`, 'success');
                this.renderMatchSuggestions();
            } else {
                this.showToast(result.error || 'Failed to run auto-matching', 'error');
            }
        } catch (error) {
            console.error('Error in auto-matching:', error);
            this.showToast('Failed to run auto-matching', 'error');
        }
    }
    
    async acceptMatch(bankTxnId, bookTxnId) {
        try {
            const response = await fetch('/api/finance/reconciliation/accept-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bank_transaction_id: bankTxnId,
                    book_transaction_id: bookTxnId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Match accepted successfully', 'success');
                this.loadReconciliationData();
                
                // Remove from matches list
                this.matches = this.matches.filter(m => m.bank_transaction_id !== bankTxnId);
                this.renderMatchSuggestions();
            } else {
                this.showToast(result.error || 'Failed to accept match', 'error');
            }
        } catch (error) {
            console.error('Error accepting match:', error);
            this.showToast('Failed to accept match', 'error');
        }
    }
    
    async acceptAllHighConfidence() {
        const highConfidenceMatches = this.matches.filter(m => m.confidence_score >= 95);
        
        if (highConfidenceMatches.length === 0) {
            this.showToast('No high confidence matches to accept', 'info');
            return;
        }
        
        if (!confirm(`Accept ${highConfidenceMatches.length} high confidence matches?`)) {
            return;
        }
        
        let accepted = 0;
        let failed = 0;
        
        for (const match of highConfidenceMatches) {
            try {
                const response = await fetch('/api/finance/reconciliation/accept-match', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        bank_transaction_id: match.bank_transaction_id,
                        book_transaction_id: match.book_transaction_id
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    accepted++;
                } else {
                    failed++;
                }
            } catch (error) {
                failed++;
            }
        }
        
        this.showToast(`Accepted ${accepted} matches${failed > 0 ? `, ${failed} failed` : ''}`, 'success');
        this.matches = [];
        this.renderMatchSuggestions();
        this.loadReconciliationData();
    }
    
    async unmatchTransaction(bankTxnId) {
        if (!confirm('Unmatch this transaction?')) return;
        
        try {
            const response = await fetch(`/api/finance/reconciliation/unmatch/${bankTxnId}`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Transaction unmatched successfully', 'success');
                this.loadReconciliationData();
            } else {
                this.showToast(result.error || 'Failed to unmatch', 'error');
            }
        } catch (error) {
            console.error('Error unmatching:', error);
            this.showToast('Failed to unmatch transaction', 'error');
        }
    }
    
    // ==================== RENDERING ====================
    
    renderSummary(summary) {
        const container = document.getElementById('reconciliationSummary');
        if (!container) return;
        
        const bankTxns = summary.bank_transactions;
        const bookTxns = summary.book_transactions;
        
        const html = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div class="text-sm text-gray-600 mb-1">Bank Transactions</div>
                    <div class="text-2xl font-bold text-gray-900">${bankTxns.total || 0}</div>
                    <div class="text-xs text-gray-500 mt-1">
                        ${bankTxns.matched || 0} matched, ${bankTxns.unmatched || 0} unmatched
                    </div>
                </div>
                
                <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div class="text-sm text-gray-600 mb-1">Book Transactions</div>
                    <div class="text-2xl font-bold text-gray-900">${bookTxns.total || 0}</div>
                    <div class="text-xs text-gray-500 mt-1">
                        ${bookTxns.reconciled || 0} reconciled, ${bookTxns.unreconciled || 0} unreconciled
                    </div>
                </div>
                
                <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div class="text-sm text-gray-600 mb-1">Reconciliation Status</div>
                    <div class="text-2xl font-bold text-green-600">${summary.reconciliation_percentage || 0}%</div>
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div class="bg-green-600 h-2 rounded-full" style="width: ${summary.reconciliation_percentage || 0}%"></div>
                    </div>
                </div>
                
                <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div class="text-sm text-gray-600 mb-1">Discrepancies</div>
                    <div class="text-2xl font-bold text-orange-600">${summary.unmatched_bank_count + summary.unreconciled_book_count}</div>
                    <div class="text-xs text-gray-500 mt-1">
                        Need attention
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    renderBankTransactions() {
        const container = document.getElementById('bankTransactionsList');
        if (!container) return;
        
        if (this.bankTransactions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <svg class="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="mt-2">All bank transactions are matched!</p>
                </div>
            `;
            return;
        }
        
        const html = `
            <div class="text-sm font-semibold text-gray-700 mb-3 px-3">
                Unmatched Bank Transactions (${this.bankTransactions.length})
            </div>
            <div class="space-y-2">
                ${this.bankTransactions.map(txn => this.renderBankTransactionCard(txn)).join('')}
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    renderBankTransactionCard(txn) {
        const typeColor = txn.transaction_type === 'Credit' ? 'text-green-600' : 'text-red-600';
        const typeBg = txn.transaction_type === 'Credit' ? 'bg-green-50' : 'bg-red-50';
        
        return `
            <div class="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-md transition cursor-pointer"
                 data-bank-txn-id="${txn.id}"
                 draggable="true"
                 ondragstart="reconciliationManager.onDragStart(event, 'bank', ${txn.id})">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="text-sm font-medium text-gray-900 mb-1">${txn.description}</div>
                        <div class="text-xs text-gray-500">
                            ${this.formatDate(txn.transaction_date)}
                            ${txn.reference_number ? `• Ref: ${txn.reference_number}` : ''}
                        </div>
                    </div>
                    <div class="${typeColor} font-semibold text-right">
                        ${this.formatCurrency(txn.amount)}
                        <div class="text-xs ${typeBg} px-2 py-1 rounded mt-1">
                            ${txn.transaction_type}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderBookTransactions() {
        const container = document.getElementById('bookTransactionsList');
        if (!container) return;
        
        if (this.bookTransactions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <svg class="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="mt-2">All book transactions are reconciled!</p>
                </div>
            `;
            return;
        }
        
        const html = `
            <div class="text-sm font-semibold text-gray-700 mb-3 px-3">
                Unreconciled Book Transactions (${this.bookTransactions.length})
            </div>
            <div class="space-y-2"
                 ondrop="reconciliationManager.onDrop(event)"
                 ondragover="reconciliationManager.onDragOver(event)">
                ${this.bookTransactions.map(txn => this.renderBookTransactionCard(txn)).join('')}
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    renderBookTransactionCard(txn) {
        const typeColor = txn.type === 'Income' ? 'text-green-600' : 'text-red-600';
        const typeBg = txn.type === 'Income' ? 'bg-green-50' : 'bg-red-50';
        
        return `
            <div class="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-md transition"
                 data-book-txn-id="${txn.id}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="text-sm font-medium text-gray-900 mb-1">${txn.description}</div>
                        <div class="text-xs text-gray-500">
                            ${this.formatDate(txn.transaction_date)} • ${txn.category || 'Uncategorized'}
                            ${txn.payment_mode ? `• ${txn.payment_mode}` : ''}
                        </div>
                    </div>
                    <div class="${typeColor} font-semibold text-right">
                        ${this.formatCurrency(txn.amount)}
                        <div class="text-xs ${typeBg} px-2 py-1 rounded mt-1">
                            ${txn.type}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderMatchSuggestions() {
        const container = document.getElementById('matchSuggestions');
        if (!container) return;
        
        if (this.matches.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <svg class="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <p class="mt-2">No matches found. Click "Run Auto-Match" to find matches.</p>
                </div>
            `;
            return;
        }
        
        const highConfidence = this.matches.filter(m => m.confidence_score >= 95);
        const mediumConfidence = this.matches.filter(m => m.confidence_score >= 75 && m.confidence_score < 95);
        
        const html = `
            ${highConfidence.length > 0 ? `
                <div class="mb-4">
                    <div class="flex justify-between items-center mb-2">
                        <div class="text-sm font-semibold text-gray-700">High Confidence (${highConfidence.length})</div>
                        <button onclick="reconciliationManager.acceptAllHighConfidence()" 
                                class="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                            Accept All
                        </button>
                    </div>
                    <div class="space-y-2">
                        ${highConfidence.map(match => this.renderMatchCard(match, 'high')).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${mediumConfidence.length > 0 ? `
                <div class="mb-4">
                    <div class="text-sm font-semibold text-gray-700 mb-2">Medium Confidence (${mediumConfidence.length})</div>
                    <div class="space-y2">
                        ${mediumConfidence.map(match => this.renderMatchCard(match, 'medium')).join('')}
                    </div>
                </div>
            ` : ''}
        `;
        
        container.innerHTML = html;
    }
    
    renderMatchCard(match, confidenceLevel) {
        const badgeColor = confidenceLevel === 'high' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
        
        return `
            <div class="border border-gray-200 rounded-lg p-3 bg-white">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex-1">
                        <span class="inline-block px-2 py-1 text-xs font-medium ${badgeColor} rounded">${match.confidence_score}%</span>
                        <span class="text-xs text-gray-500 ml-2">${match.match_reason}</span>
                    </div>
                    <button onclick="reconciliationManager.acceptMatch(${match.bank_transaction_id}, ${match.book_transaction_id})"
                            class="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                        Accept
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-3 text-xs">
                    <div class="bg-blue-50 p-2 rounded">
                        <div class="font-medium text-gray-700 mb-1">Bank</div>
                        <div class="text-gray-600">${match.bank_description.substring(0, 50)}...</div>
                        <div class="text-gray-500 mt-1">${this.formatDate(match.bank_date)} • ${this.formatCurrency(match.bank_amount)}</div>
                    </div>
                    <div class="bg-green-50 p-2 rounded">
                        <div class="font-medium text-gray-700 mb-1">Book</div>
                        <div class="text-gray-600">${match.book_description.substring(0, 50)}...</div>
                        <div class="text-gray-500 mt-1">${this.formatDate(match.book_date)} • ${this.formatCurrency(match.book_amount)}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ==================== DRAG & DROP ====================
    
    onDragStart(event, type, txnId) {
        event.dataTransfer.setData('type', type);
        event.dataTransfer.setData('txnId', txnId);
        event.dataTransfer.effectAllowed = 'move';
    }
    
    onDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }
    
    async onDrop(event) {
        event.preventDefault();
        
        const dragType = event.dataTransfer.getData('type');
        const dragTxnId = event.dataTransfer.getData('txnId');
        
        // Find where it was dropped (find nearest book transaction card)
        const target = event.target.closest('[data-book-txn-id]');
        
        if (!target || dragType !== 'bank') return;
        
        const bookTxnId = target.getAttribute('data-book-txn-id');
        
        if (confirm('Manually match these transactions?')) {
            await this.manualMatch(dragTxnId, bookTxnId);
        }
    }
    
    async manualMatch(bankTxnId, bookTxnId) {
        try {
            const response = await fetch('/api/finance/reconciliation/manual-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bank_transaction_id: bankTxnId,
                    book_transaction_id: bookTxnId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Transactions matched successfully', 'success');
                this.loadReconciliationData();
            } else {
                this.showToast(result.error || 'Failed to match', 'error');
            }
        } catch (error) {
            console.error('Error in manual matching:', error);
            this.showToast('Failed to match transactions', 'error');
        }
    }
    
    // ==================== UTILITIES ====================
    
    populateBankAccountSelect() {
        const select = document.getElementById('bankAccountSelect');
        const uploadSelect = document.getElementById('uploadBankAccount');
        
        if (!select) return;
        
        const options = '<option value="">Select Bank Account</option>' +
            this.bankAccounts.map(b => `<option value="${b.id}">${b.bank_name} - ${b.account_number.slice(-4)}</option>`).join('');
        
        select.innerHTML = options;
        if (uploadSelect) uploadSelect.innerHTML = options;
    }
    
    showValidationWarnings(warnings) {
        if (warnings.length === 0) return;
        
        const warningText = warnings.slice(0, 3).join('\n');
        alert(`Validation Warnings:\n\n${warningText}${warnings.length > 3 ? '\n\n...and more' : ''}`);
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    }
    
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`[${type}] ${message}`);
            alert(message);
        }
    }
}

// Initialize on page load
let reconciliationManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        reconciliationManager = new ReconciliationManager();
    });
} else {
    reconciliationManager = new ReconciliationManager();
}
