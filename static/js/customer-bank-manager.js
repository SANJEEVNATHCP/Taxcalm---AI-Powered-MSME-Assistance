/**
 * Customer & Bank Account Management
 * Frontend functionality for managing customers and bank accounts
 */

// ==================== CUSTOMER MANAGEMENT ====================

class CustomerManager {
    constructor() {
        this.customers = [];
        this.currentCustomer = null;
    }

    async loadCustomers() {
        try {
            const response = await fetch('/api/finance/customers');
            const result = await response.json();
            
            if (result.success) {
                this.customers = result.data;
                this.renderCustomerList();
                return this.customers;
            } else {
                showToast('Error loading customers: ' + result.error, 'error');
                return [];
            }
        } catch (error) {
            console.error('Error loading customers:', error);
            showToast('Failed to load customers', 'error');
            return [];
        }
    }

    renderCustomerList() {
        const container = document.getElementById('customerList');
        if (!container) return;

        if (this.customers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No customers found. Add your first customer to get started!</p>
                    <button onclick="customerManager.showCustomerForm()" class="btn-primary">
                        Add Customer
                    </button>
                </div>
            `;
            return;
        }

        let html = `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Customer Code</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>GSTIN</th>
                            <th>Payment Terms</th>
                            <th>Balance</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        this.customers.forEach(customer => {
            html += `
                <tr>
                    <td>${customer.customer_code}</td>
                    <td><strong>${customer.name}</strong></td>
                    <td>${customer.email || '-'}</td>
                    <td>${customer.phone || '-'}</td>
                    <td>${customer.gstin || '-'}</td>
                    <td>${customer.payment_terms}</td>
                    <td>₹${parseFloat(customer.current_balance).toFixed(2)}</td>
                    <td><span class="badge ${customer.status === 'Active' ? 'bg-success' : 'bg-secondary'}">${customer.status}</span></td>
                    <td>
                        <button onclick="customerManager.viewCustomer(${customer.id})" class="btn-sm btn-info" title="View">👁️</button>
                        <button onclick="customerManager.editCustomer(${customer.id})" class="btn-sm btn-warning" title="Edit">✏️</button>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
    }

    showCustomerForm(customerId = null) {
        const isEdit = customerId !== null;
        const customer = isEdit ? this.customers.find(c => c.id === customerId) : null;

        const modalHtml = `
            <div class="modal-overlay" id="customerModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${isEdit ? 'Edit Customer' : 'Add New Customer'}</h3>
                        <button onclick="customerManager.closeModal()" class="btn-close">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="customerForm">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customerName">Customer Name <span class="required">*</span></label>
                                    <input type="text" id="customerName" required value="${customer?.name || ''}">
                                </div>
                                <div class="form-group">
                                    <label for="customerEmail">Email</label>
                                    <input type="email" id="customerEmail" value="${customer?.email || ''}">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customerPhone">Phone</label>
                                    <input type="tel" id="customerPhone" value="${customer?.phone || ''}">
                                </div>
                                <div class="form-group">
                                    <label for="customerGSTIN">GSTIN</label>
                                    <input type="text" id="customerGSTIN" placeholder="29ABCDE1234F1Z5" value="${customer?.gstin || ''}">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customerPAN">PAN Number</label>
                                    <input type="text" id="customerPAN" placeholder="ABCDE1234F" value="${customer?.pan_number || ''}">
                                </div>
                                <div class="form-group">
                                    <label for="customerPaymentTerms">Payment Terms</label>
                                    <select id="customerPaymentTerms">
                                        <option value="Net15" ${customer?.payment_terms === 'Net15' ? 'selected' : ''}>Net 15 Days</option>
                                        <option value="Net30" ${customer?.payment_terms === 'Net30' ? 'selected' : ''}>Net 30 Days</option>
                                        <option value="Net45" ${customer?.payment_terms === 'Net45' ? 'selected' : ''}>Net 45 Days</option>
                                        <option value="Net60" ${customer?.payment_terms === 'Net60' ? 'selected' : ''}>Net 60 Days</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="customerBillingAddress">Billing Address</label>
                                <textarea id="customerBillingAddress" rows="2">${customer?.billing_address || ''}</textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customerCity">City</label>
                                    <input type="text" id="customerCity" value="${customer?.city || ''}">
                                </div>
                                <div class="form-group">
                                    <label for="customerState">State</label>
                                    <input type="text" id="customerState" value="${customer?.state || ''}">
                                </div>
                                <div class="form-group">
                                    <label for="customerPincode">Pincode</label>
                                    <input type="text" id="customerPincode" value="${customer?.pincode || ''}">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customerCreditLimit">Credit Limit (₹)</label>
                                    <input type="number" id="customerCreditLimit" min="0" step="0.01" value="${customer?.credit_limit || 0}">
                                </div>
                                ${!isEdit ? `
                                <div class="form-group">
                                    <label for="customerOpeningBalance">Opening Balance (₹)</label>
                                    <input type="number" id="customerOpeningBalance" step="0.01" value="0">
                                </div>
                                ` : ''}
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button onclick="customerManager.closeModal()" class="btn-secondary">Cancel</button>
                        <button onclick="customerManager.saveCustomer(${customerId})" class="btn-primary">
                            ${isEdit ? 'Update' : 'Create'} Customer
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    async saveCustomer(customerId) {
        const data = {
            name: document.getElementById('customerName').value,
            email: document.getElementById('customerEmail').value,
            phone: document.getElementById('customerPhone').value,
            gstin: document.getElementById('customerGSTIN').value,
            pan_number: document.getElementById('customerPAN').value,
            payment_terms: document.getElementById('customerPaymentTerms').value,
            billing_address: document.getElementById('customerBillingAddress').value,
            city: document.getElementById('customerCity').value,
            state: document.getElementById('customerState').value,
            pincode: document.getElementById('customerPincode').value,
            credit_limit: parseFloat(document.getElementById('customerCreditLimit').value) || 0
        };

        if (!customerId) {
            data.opening_balance = parseFloat(document.getElementById('customerOpeningBalance').value) || 0;
        }

        try {
            const url = customerId 
                ? `/api/finance/customers/${customerId}` 
                : '/api/finance/customers';
            
            const method = customerId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                showToast(result.message, 'success');
                this.closeModal();
                this.loadCustomers();
            } else {
                showToast('Error: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error saving customer:', error);
            showToast('Failed to save customer', 'error');
        }
    }

    async viewCustomer(customerId) {
        try {
            const response = await fetch(`/api/finance/customers/${customerId}`);
            const result = await response.json();

            if (result.success) {
                const customer = result.data;
                const modalHtml = `
                    <div class="modal-overlay" id="customerViewModal">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3>Customer Details</h3>
                                <button onclick="customerManager.closeModal()" class="btn-close">×</button>
                            </div>
                            <div class="modal-body">
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <strong>Customer Code:</strong>
                                        <span>${customer.customer_code}</span>
                                    </div>
                                    <div class="detail-item">
                                        <strong>Name:</strong>
                                        <span>${customer.name}</span>
                                    </div>
                                    <div class="detail-item">
                                        <strong>Email:</strong>
                                        <span>${customer.email || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <strong>Phone:</strong>
                                        <span>${customer.phone || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <strong>GSTIN:</strong>
                                        <span>${customer.gstin || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <strong>PAN:</strong>
                                        <span>${customer.pan_number || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <strong>Payment Terms:</strong>
                                        <span>${customer.payment_terms}</span>
                                    </div>
                                    <div class="detail-item">
                                        <strong>Current Balance:</strong>
                                        <span>₹${parseFloat(customer.current_balance).toFixed(2)}</span>
                                    </div>
                                    <div class="detail-item">
                                        <strong>Pending Invoices:</strong>
                                        <span>${customer.invoice_count || 0}</span>
                                    </div>
                                    <div class="detail-item">
                                        <strong>Total Outstanding:</strong>
                                        <span>₹${parseFloat(customer.total_outstanding || 0).toFixed(2)}</span>
                                    </div>
                                    <div class="detail-item">
                                        <strong>Status:</strong>
                                        <span class="badge ${customer.status === 'Active' ? 'bg-success' : 'bg-secondary'}">${customer.status}</span>
                                    </div>
                                </div>
                                ${customer.billing_address ? `
                                <div class="detail-section">
                                    <h4>Billing Address</h4>
                                    <p>${customer.billing_address}<br>
                                    ${customer.city ? customer.city + ', ' : ''}${customer.state || ''} ${customer.pincode || ''}</p>
                                </div>
                                ` : ''}
                            </div>
                            <div class="modal-footer">
                                <button onclick="customerManager.editCustomer(${customerId})" class="btn-warning">Edit</button>
                                <button onclick="customerManager.closeModal()" class="btn-secondary">Close</button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', modalHtml);
            } else {
                showToast('Error: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error fetching customer:', error);
            showToast('Failed to load customer details', 'error');
        }
    }

    editCustomer(customerId) {
        this.closeModal();
        this.showCustomerForm(customerId);
    }

    closeModal() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
    }
}

// ==================== BANK ACCOUNT MANAGEMENT ====================

class BankAccountManager {
    constructor() {
        this.accounts = [];
    }

    async loadBankAccounts() {
        try {
            const response = await fetch('/api/finance/bank-accounts');
            const result = await response.json();
            
            if (result.success) {
                this.accounts = result.data;
                this.renderBankAccountList();
                return this.accounts;
            } else {
                showToast('Error loading bank accounts: ' + result.error, 'error');
                return [];
            }
        } catch (error) {
            console.error('Error loading bank accounts:', error);
            showToast('Failed to load bank accounts', 'error');
            return [];
        }
    }

    renderBankAccountList() {
        const container = document.getElementById('bankAccountList');
        if (!container) return;

        if (this.accounts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No bank accounts found. Add your first bank account!</p>
                    <button onclick="bankAccountManager.showBankAccountForm()" class="btn-primary">
                        Add Bank Account
                    </button>
                </div>
            `;
            return;
        }

        let html = `
            <div class="bank-accounts-grid">
        `;

        this.accounts.forEach(account => {
            html += `
                <div class="bank-account-card">
                    <div class="account-header">
                        <h4>${account.account_name}</h4>
                        <span class="badge ${account.status === 'Active' ? 'bg-success' : 'bg-secondary'}">${account.status}</span>
                    </div>
                    <div class="account-details">
                        <p><strong>Bank:</strong> ${account.bank_name}</p>
                        <p><strong>Account:</strong> ${account.account_number_masked || 'XXXX'}</p>
                        <p><strong>IFSC:</strong> ${account.ifsc_code || '-'}</p>
                        <p><strong>Type:</strong> ${account.account_type}</p>
                        <p class="account-balance"><strong>Balance:</strong> <span class="balance-amount">₹${parseFloat(account.current_balance).toFixed(2)}</span></p>
                    </div>
                    <div class="account-actions">
                        <button onclick="bankAccountManager.viewAccount(${account.id})" class="btn-sm btn-info">View Details</button>
                        <button onclick="bankAccountManager.editAccount(${account.id})" class="btn-sm btn-warning">Edit</button>
                    </div>
                </div>
            `;
        });

        html += `
            </div>
        `;

        container.innerHTML = html;
    }

    showBankAccountForm(accountId = null) {
        const isEdit = accountId !== null;
        const account = isEdit ? this.accounts.find(a => a.id === accountId) : null;

        const modalHtml = `
            <div class="modal-overlay" id="bankAccountModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${isEdit ? 'Edit Bank Account' : 'Add New Bank Account'}</h3>
                        <button onclick="bankAccountManager.closeModal()" class="btn-close">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="bankAccountForm">
                            <div class="form-group">
                                <label for="accountName">Account Name <span class="required">*</span></label>
                                <input type="text" id="accountName" required value="${account?.account_name || ''}" placeholder="e.g., Primary Current Account">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="bankName">Bank Name <span class="required">*</span></label>
                                    <select id="bankName" required>
                                        <option value="">Select Bank</option>
                                        <option value="State Bank of India" ${account?.bank_name === 'State Bank of India' ? 'selected' : ''}>State Bank of India</option>
                                        <option value="HDFC Bank" ${account?.bank_name === 'HDFC Bank' ? 'selected' : ''}>HDFC Bank</option>
                                        <option value="ICICI Bank" ${account?.bank_name === 'ICICI Bank' ? 'selected' : ''}>ICICI Bank</option>
                                        <option value="Axis Bank" ${account?.bank_name === 'Axis Bank' ? 'selected' : ''}>Axis Bank</option>
                                        <option value="Kotak Mahindra Bank" ${account?.bank_name === 'Kotak Mahindra Bank' ? 'selected' : ''}>Kotak Mahindra Bank</option>
                                        <option value="Punjab National Bank" ${account?.bank_name === 'Punjab National Bank' ? 'selected' : ''}>Punjab National Bank</option>
                                        <option value="Other" ${account?.bank_name && !['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank'].includes(account.bank_name) ? 'selected' : ''}>Other</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="accountType">Account Type</label>
                                    <select id="accountType">
                                        <option value="Current" ${account?.account_type === 'Current' ? 'selected' : ''}>Current Account</option>
                                        <option value="Savings" ${account?.account_type === 'Savings' ? 'selected' : ''}>Savings Account</option>
                                        <option value="Overdraft" ${account?.account_type === 'Overdraft' ? 'selected' : ''}>Overdraft Account</option>
                                        <option value="CreditCard" ${account?.account_type === 'CreditCard' ? 'selected' : ''}>Credit Card</option>
                                    </select>
                                </div>
                            </div>
                            ${!isEdit ? `
                            <div class="form-group">
                                <label for="accountNumber">Account Number <span class="required">*</span></label>
                                <input type="text" id="accountNumber" required placeholder="Enter account number">
                            </div>
                            ` : '<p class="info-text">⚠️ Account number cannot be changed</p>'}
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="ifscCode">IFSC Code</label>
                                    <input type="text" id="ifscCode" placeholder="e.g., SBIN0001234" value="${account?.ifsc_code || ''}">
                                </div>
                                <div class="form-group">
                                    <label for="branch">Branch</label>
                                    <input type="text" id="branch" value="${account?.branch || ''}">
                                </div>
                            </div>
                            ${!isEdit ? `
                            <div class="form-group">
                                <label for="openingBalance">Opening Balance (₹)</label>
                                <input type="number" id="openingBalance" step="0.01" value="0">
                                <small class="form-hint">Enter the current balance in this account</small>
                            </div>
                            ` : ''}
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button onclick="bankAccountManager.closeModal()" class="btn-secondary">Cancel</button>
                        <button onclick="bankAccountManager.saveBankAccount(${accountId})" class="btn-primary">
                            ${isEdit ? 'Update' : 'Create'} Account
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    async saveBankAccount(accountId) {
        const data = {
            account_name: document.getElementById('accountName').value,
            bank_name: document.getElementById('bankName').value,
            account_type: document.getElementById('accountType').value,
            ifsc_code: document.getElementById('ifscCode').value,
            branch: document.getElementById('branch').value
        };

        if (!accountId) {
            data.account_number = document.getElementById('accountNumber').value;
            data.opening_balance = parseFloat(document.getElementById('openingBalance').value) || 0;
        }

        try {
            const url = accountId 
                ? `/api/finance/bank-accounts/${accountId}` 
                : '/api/finance/bank-accounts';
            
            const method = accountId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                showToast(result.message, 'success');
                this.closeModal();
                this.loadBankAccounts();
            } else {
                showToast('Error: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error saving bank account:', error);
            showToast('Failed to save bank account', 'error');
        }
    }

    async viewAccount(accountId) {
        try {
            const response = await fetch(`/api/finance/bank-accounts/${accountId}`);
            const result = await response.json();

            if (result.success) {
                const account = result.data;
                const modalHtml = `
                    <div class="modal-overlay" id="accountViewModal">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3>Bank Account Details</h3>
                                <button onclick="bankAccountManager.closeModal()" class="btn-close">×</button>
                            </div>
                            <div class="modal-body">
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <strong>Account Name:</strong>
                                        <span>${account.account_name}</span>
                                    </div>
                                    <div class="detail-item">
                                        <strong>Bank:</strong>
                                        <span>${account.bank_name}</span>
                                    </div>
                                    <div class="detail-item">
                                        <strong>Account Type:</strong>
                                        <span>${account.account_type}</span>
                                    </div>
                                    <div class="detail-item">
                                        <strong>Account Number:</strong>
                                        <span>${account.account_number_masked}</span>
                                    </div>
                                    <div class="detail-item">
                                        <strong>IFSC Code:</strong>
                                        <span>${account.ifsc_code || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <strong>Branch:</strong>
                                        <span>${account.branch || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <strong>Current Balance:</strong>
                                        <span class="balance-amount">₹${parseFloat(account.current_balance).toFixed(2)}</span>
                                    </div>
                                    <div class="detail-item">
                                        <strong>Status:</strong>
                                        <span class="badge ${account.status === 'Active' ? 'bg-success' : 'bg-secondary'}">${account.status}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button onclick="bankAccountManager.editAccount(${accountId})" class="btn-warning">Edit</button>
                                <button onclick="bankAccountManager.closeModal()" class="btn-secondary">Close</button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', modalHtml);
            } else {
                showToast('Error: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error fetching account:', error);
            showToast('Failed to load account details', 'error');
        }
    }

    editAccount(accountId) {
        this.closeModal();
        this.showBankAccountForm(accountId);
    }

    closeModal() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
    }
}

// Helper function for toast notifications
function showToast(message, type = 'info') {
    // Use existing toast system if available, otherwise create simple alert
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        alert(message);
    }
}

// Initialize managers
const customerManager = new CustomerManager();
const bankAccountManager = new BankAccountManager();

// Make available globally
window.customerManager = customerManager;
window.bankAccountManager = bankAccountManager;
