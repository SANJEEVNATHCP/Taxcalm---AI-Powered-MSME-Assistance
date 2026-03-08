/**
 * Invoice Manager for TaxCalm
 * Handles invoice creation, viewing, and payment management
 */

class InvoiceManager {
    constructor() {
        this.invoices = [];
        this.customers = [];
        this.bankAccounts = [];
        this.currentInvoice = null;
        this.editMode = false;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadCustomers();
        this.loadBankAccounts();
        this.loadInvoices();
    }
    
    bindEvents() {
        // Invoice list actions
        document.getElementById('createInvoiceBtn')?.addEventListener('click', () => this.showInvoiceForm());
        document.getElementById('refreshInvoicesBtn')?.addEventListener('click', () => this.loadInvoices());
        
        // Form actions
        document.getElementById('saveInvoiceBtn')?.addEventListener('click', () => this.saveInvoice());
        document.getElementById('cancelInvoiceBtn')?.addEventListener('click', () => this.hideInvoiceForm());
        document.getElementById('addItemBtn')?.addEventListener('click', () => this.addInvoiceItem());
        
        // Filter changes
        document.getElementById('statusFilter')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('paymentStatusFilter')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('searchInvoice')?.addEventListener('input', (e) => this.searchInvoices(e.target.value));
        
        // Payment modal
        document.getElementById('savePaymentBtn')?.addEventListener('click', () => this.recordPayment());
        document.getElementById('cancelPaymentBtn')?.addEventListener('click', () => this.hidePaymentModal());
    }
    
    // ==================== DATA LOADING ====================
    
    async loadCustomers() {
        try {
            const response = await fetch('/api/finance/customers');
            const result = await response.json();
            
            if (result.success) {
                this.customers = result.data;
                this.populateCustomerDropdown();
            }
        } catch (error) {
            console.error('Error loading customers:', error);
            this.showToast('Failed to load customers', 'error');
        }
    }
    
    async loadBankAccounts() {
        try {
            const response = await fetch('/api/finance/bank-accounts');
            const result = await response.json();
            
            if (result.success) {
                this.bankAccounts = result.data;
                this.populateBankAccountDropdown();
            }
        } catch (error) {
            console.error('Error loading bank accounts:', error);
        }
    }
    
    async loadInvoices(filters = {}) {
        try {
            const params = new URLSearchParams(filters);
            const response = await fetch(`/api/finance/invoices?${params}`);
            const result = await response.json();
            
            if (result.success) {
                this.invoices = result.data;
                this.renderInvoiceList();
            } else {
                this.showToast('Failed to load invoices', 'error');
            }
        } catch (error) {
            console.error('Error loading invoices:', error);
            this.showToast('Failed to load invoices', 'error');
        }
    }
    
    async loadInvoiceDetails(invoiceId) {
        try {
            const response = await fetch(`/api/finance/invoices/${invoiceId}`);
            const result = await response.json();
            
            if (result.success) {
                this.currentInvoice = result.data;
                this.showInvoiceDetails();
            } else {
                this.showToast('Failed to load invoice details', 'error');
            }
        } catch (error) {
            console.error('Error loading invoice:', error);
            this.showToast('Failed to load invoice', 'error');
        }
    }
    
    // ==================== RENDERING ====================
    
    renderInvoiceList() {
        const container = document.getElementById('invoiceList');
        if (!container) return;
        
        if (this.invoices.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p class="mt-2">No invoices found</p>
                    <button onclick="invoiceManager.showInvoiceForm()" class="mt-4 btn-primary">
                        Create First Invoice
                    </button>
                </div>
            `;
            return;
        }
        
        const html = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${this.invoices.map(inv => this.renderInvoiceRow(inv)).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    renderInvoiceRow(invoice) {
        const statusBadge = this.getStatusBadge(invoice.status);
        const paymentBadge = this.getPaymentStatusBadge(invoice.payment_status);
        
        return `
            <tr class="hover:bg-gray-50 cursor-pointer" onclick="invoiceManager.loadInvoiceDetails(${invoice.id})">
                <td class="px-4 py-3 text-sm font-medium text-blue-600">${invoice.invoice_number}</td>
                <td class="px-4 py-3 text-sm text-gray-900">${invoice.customer_name || 'N/A'}</td>
                <td class="px-4 py-3 text-sm text-gray-500">${this.formatDate(invoice.invoice_date)}</td>
                <td class="px-4 py-3 text-sm text-gray-500">
                    ${this.formatDate(invoice.due_date)}
                    ${invoice.days_overdue > 0 ? `<span class="text-red-600 text-xs ml-1">(${invoice.days_overdue}d overdue)</span>` : ''}
                </td>
                <td class="px-4 py-3 text-sm text-right text-gray-900 font-medium">${this.formatCurrency(invoice.grand_total)}</td>
                <td class="px-4 py-3 text-sm text-right ${invoice.balance_due > 0 ? 'text-orange-600' : 'text-green-600'} font-medium">
                    ${this.formatCurrency(invoice.balance_due)}
                </td>
                <td class="px-4 py-3 text-center">
                    ${statusBadge}
                    ${paymentBadge}
                </td>
                <td class="px-4 py-3 text-center">
                    <div class="flex justify-center space-x-2">
                        <button onclick="event.stopPropagation(); invoiceManager.downloadPDF(${invoice.id}, '${invoice.invoice_number}')" 
                                class="text-blue-600 hover:text-blue-800" title="Download PDF">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                            </svg>
                        </button>
                        ${invoice.payment_status !== 'Paid' ? `
                        <button onclick="event.stopPropagation(); invoiceManager.showPaymentModal(${invoice.id})" 
                                class="text-green-600 hover:text-green-800" title="Record Payment">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </button>
                        ` : ''}
                        ${invoice.status === 'Draft' ? `
                        <button onclick="event.stopPropagation(); invoiceManager.sendInvoice(${invoice.id})" 
                                class="text-purple-600 hover:text-purple-800" title="Mark as Sent">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }
    
    showInvoiceDetails() {
        const invoice = this.currentInvoice;
        const modal = document.getElementById('invoiceDetailsModal');
        if (!modal) return;
        
        const detailsHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-start">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">${invoice.invoice_number}</h2>
                        <p class="text-sm text-gray-500 mt-1">Invoice Date: ${this.formatDate(invoice.invoice_date)}</p>
                    </div>
                    <div class="text-right">
                        ${this.getStatusBadge(invoice.status)}
                        ${this.getPaymentStatusBadge(invoice.payment_status)}
                    </div>
                </div>
                
                <!-- Customer Info -->
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-gray-700 mb-2">Bill To:</h3>
                    <p class="text-gray-900 font-medium">${invoice.customer_name}</p>
                    ${invoice.customer_email ? `<p class="text-sm text-gray-600">${invoice.customer_email}</p>` : ''}
                    ${invoice.customer_phone ? `<p class="text-sm text-gray-600">${invoice.customer_phone}</p>` : ''}
                    ${invoice.customer_gstin ? `<p class="text-sm text-gray-600">GSTIN: ${invoice.customer_gstin}</p>` : ''}
                    ${invoice.billing_address ? `<p class="text-sm text-gray-600 mt-2">${invoice.billing_address}</p>` : ''}
                </div>
                
                <!-- Items -->
                <div>
                    <h3 class="font-semibold text-gray-700 mb-3">Items:</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">#</th>
                                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">Rate</th>
                                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">GST%</th>
                                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${invoice.items.map(item => `
                                    <tr>
                                        <td class="px-3 py-2 text-sm">${item.line_number}</td>
                                        <td class="px-3 py-2 text-sm">${item.item_description}</td>
                                        <td class="px-3 py-2 text-sm text-right">${item.quantity} ${item.unit_of_measure}</td>
                                        <td class="px-3 py-2 text-sm text-right">${this.formatCurrency(item.unit_price)}</td>
                                        <td class="px-3 py-2 text-sm text-right">${item.gst_rate}%</td>
                                        <td class="px-3 py-2 text-sm text-right font-medium">${this.formatCurrency(item.total_amount)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Totals -->
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Subtotal:</span>
                            <span class="text-gray-900">${this.formatCurrency(invoice.subtotal)}</span>
                        </div>
                        ${invoice.discount_amount > 0 ? `
                        <div class="flex justify-between">
                            <span class="text-gray-600">Discount:</span>
                            <span class="text-gray-900">- ${this.formatCurrency(invoice.discount_amount)}</span>
                        </div>
                        ` : ''}
                        ${invoice.cgst_amount > 0 ? `
                        <div class="flex justify-between">
                            <span class="text-gray-600">CGST:</span>
                            <span class="text-gray-900">${this.formatCurrency(invoice.cgst_amount)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">SGST:</span>
                            <span class="text-gray-900">${this.formatCurrency(invoice.sgst_amount)}</span>
                        </div>
                        ` : ''}
                        ${invoice.igst_amount > 0 ? `
                        <div class="flex justify-between">
                            <span class="text-gray-600">IGST:</span>
                            <span class="text-gray-900">${this.formatCurrency(invoice.igst_amount)}</span>
                        </div>
                        ` : ''}
                        <div class="flex justify-between pt-2 border-t border-gray-300">
                            <span class="font-semibold text-gray-900">Grand Total:</span>
                            <span class="font-bold text-lg text-gray-900">${this.formatCurrency(invoice.grand_total)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Amount Paid:</span>
                            <span class="text-green-600 font-medium">${this.formatCurrency(invoice.amount_paid)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-semibold text-gray-700">Balance Due:</span>
                            <span class="font-bold text-orange-600">${this.formatCurrency(invoice.balance_due)}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Payment History -->
                ${invoice.payments && invoice.payments.length > 0 ? `
                <div>
                    <h3 class="font-semibold text-gray-700 mb-3">Payment History:</h3>
                    <div class="space-y-2">
                        ${invoice.payments.map(payment => `
                            <div class="flex justify-between items-center p-3 bg-green-50 rounded">
                                <div>
                                    <p class="text-sm font-medium text-gray-900">${this.formatCurrency(payment.amount)}</p>
                                    <p class="text-xs text-gray-500">${this.formatDate(payment.payment_date)} - ${payment.payment_mode}</p>
                                    ${payment.reference_number ? `<p class="text-xs text-gray-400">Ref: ${payment.reference_number}</p>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Actions -->
                <div class="flex space-x-3">
                    <button onclick="invoiceManager.downloadPDF(${invoice.id}, '${invoice.invoice_number}')" class="btn-primary flex-1">
                        <svg class="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        Download PDF
                    </button>
                    ${invoice.payment_status !== 'Paid' ? `
                    <button onclick="invoiceManager.showPaymentModal(${invoice.id})" class="btn-success flex-1">
                        <svg class="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Record Payment
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.getElementById('invoiceDetailsContent').innerHTML = detailsHTML;
        modal.classList.remove('hidden');
    }
    
    // ==================== INVOICE FORM ====================
    
    showInvoiceForm(invoice = null) {
        this.currentInvoice = invoice;
        this.editMode = !!invoice;
        
        const form = document.getElementById('invoiceForm');
        if (!form) return;
        
        // Reset form
        form.reset();
        document.getElementById('invoiceItemsContainer').innerHTML = '';
        
        // Set default dates
        const today = new Date().toISOString().split('T')[0];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        
        document.getElementById('invoiceDate').value = today;
        document.getElementById('dueDate').value = dueDate.toISOString().split('T')[0];
        
        // Add one item row by default
        this.addInvoiceItem();
        
        // Show form
        document.getElementById('invoiceFormModal').classList.remove('hidden');
    }
    
    hideInvoiceForm() {
        document.getElementById('invoiceFormModal').classList.add('hidden');
        this.currentInvoice = null;
        this.editMode = false;
    }
    
    addInvoiceItem() {
        const container = document.getElementById('invoiceItemsContainer');
        const itemCount = container.children.length + 1;
        
        const itemHTML = `
            <div class="invoice-item p-4 border border-gray-200 rounded-lg mb-3 bg-gray-50" data-item-index="${itemCount}">
                <div class="flex justify-between items-center mb-3">
                    <h4 class="font-medium text-gray-700">Item #${itemCount}</h4>
                    <button type="button" onclick="this.closest('.invoice-item').remove(); invoiceManager.recalculateTotals()" 
                            class="text-red-600 hover:text-red-800">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div class="lg:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                        <input type="text" class="item-description form-input" required 
                               placeholder="Item description">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">HSN/SAC</label>
                        <input type="text" class="item-hsn form-input" placeholder="HSN/SAC code">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                        <input type="number" class="item-quantity form-input" required min="1" value="1" 
                               onchange="invoiceManager.recalculateTotals()">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Unit*</label>
                        <select class="item-unit form-input">
                            <option value="Nos">Nos</option>
                            <option value="Hrs">Hrs</option>
                            <option value="Days">Days</option>
                            <option value="Kg">Kg</option>
                            <option value="Ltrs">Ltrs</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Unit Price *</label>
                        <input type="number" class="item-price form-input" required min="0" step="0.01" 
                               onchange="invoiceManager.recalculateTotals()">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
                        <input type="number" class="item-discount form-input" min="0" max="100" step="0.01" value="0"
                               onchange="invoiceManager.recalculateTotals()">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">GST Rate % *</label>
                        <select class="item-gst-rate form-input" required onchange="invoiceManager.recalculateTotals()">
                            <option value="0">0%</option>
                            <option value="0.25">0.25%</option>
                            <option value="3">3%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18" selected>18%</option>
                            <option value="28">28%</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', itemHTML);
    }
    
    recalculateTotals() {
        const items = document.querySelectorAll('.invoice-item');
        let subtotal = 0;
        let totalDiscount = 0;
        let totalTax = 0;
        
        items.forEach(item => {
            const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0;
            const price = parseFloat(item.querySelector('.item-price').value) || 0;
            const discount = parseFloat(item.querySelector('.item-discount').value) || 0;
            const gstRate = parseFloat(item.querySelector('.item-gst-rate').value) || 0;
            
            const itemSubtotal = quantity * price;
            const itemDiscount = (itemSubtotal * discount) / 100;
            const taxable = itemSubtotal - itemDiscount;
            const itemTax = (taxable * gstRate) / 100;
            
            subtotal += taxable;
            totalDiscount += itemDiscount;
            totalTax += itemTax;
        });
        
        const grandTotal = subtotal + totalTax;
        
        // Update summary display
        document.getElementById('summarySubtotal').textContent = this.formatCurrency(subtotal);
        document.getElementById('summaryDiscount').textContent = this.formatCurrency(totalDiscount);
        document.getElementById('summaryTax').textContent = this.formatCurrency(totalTax);
        document.getElementById('summaryGrandTotal').textContent = this.formatCurrency(grandTotal);
    }
    
    async saveInvoice() {
        try {
            const form = document.getElementById('invoiceForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            // Collect form data
            const customerId = document.getElementById('customerId').value;
            const invoiceDate = document.getElementById('invoiceDate').value;
            const dueDate = document.getElementById('dueDate').value;
            const billingAddress = document.getElementById('billingAddress').value;
            const bankAccountId = document.getElementById('bankAccountId').value;
            const notes = document.getElementById('invoiceNotes').value;
            const termsConditions = document.getElementById('termsConditions').value;
            
            // Collect items
            const items = [];
            document.querySelectorAll('.invoice-item').forEach(itemEl => {
                const item = {
                    item_description: itemEl.querySelector('.item-description').value,
                    hsn_sac_code: itemEl.querySelector('.item-hsn').value,
                    quantity: parseFloat(itemEl.querySelector('.item-quantity').value),
                    unit_of_measure: itemEl.querySelector('.item-unit').value,
                    unit_price: parseFloat(itemEl.querySelector('.item-price').value),
                    discount_percent: parseFloat(itemEl.querySelector('.item-discount').value) || 0,
                    gst_rate: parseFloat(itemEl.querySelector('.item-gst-rate').value)
                };
                items.push(item);
            });
            
            if (items.length === 0) {
                this.showToast('Add at least one item', 'error');
                return;
            }
            
            const payload = {
                customer_id: customerId,
                invoice_date: invoiceDate,
                due_date: dueDate,
                billing_address: billingAddress,
                bank_account_id: bankAccountId || null,
                notes: notes,
                terms_conditions: termsConditions,
                items: items
            };
            
            const response = await fetch('/api/finance/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(`Invoice ${result.invoice_number} created successfully`, 'success');
                this.hideInvoiceForm();
                this.loadInvoices();
            } else {
                this.showToast(result.error || 'Failed to create invoice', 'error');
            }
        } catch (error) {
            console.error('Error saving invoice:', error);
            this.showToast('Failed to save invoice', 'error');
        }
    }
    
    // ==================== PAYMENT MODAL ====================
    
    showPaymentModal(invoiceId) {
        this.currentInvoice = { id: invoiceId };
        
        // Load invoice details to get balance due
        fetch(`/api/finance/invoices/${invoiceId}`)
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    const invoice = result.data;
                    document.getElementById('paymentInvoiceNumber').textContent = invoice.invoice_number;
                    document.getElementById('paymentBalanceDue').textContent = this.formatCurrency(invoice.balance_due);
                    document.getElementById('paymentAmount').setAttribute('max', invoice.balance_due);
                    document.getElementById('paymentAmount').value = invoice.balance_due;
                    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
                    
                    document.getElementById('paymentModal').classList.remove('hidden');
                }
            });
    }
    
    hidePaymentModal() {
        document.getElementById('paymentModal').classList.add('hidden');
    }
    
    async recordPayment() {
        try {
            const amount = parseFloat(document.getElementById('paymentAmount').value);
            const paymentDate = document.getElementById('paymentDate').value;
            const paymentMode = document.getElementById('paymentMode').value;
            const refNumber = document.getElementById('paymentReference').value;
            const paymentNotes = document.getElementById('paymentNotes').value;
            const bankAccountId = document.getElementById('paymentBankAccount').value;
            
            if (!amount || amount <= 0) {
                this.showToast('Enter valid payment amount', 'error');
                return;
            }
            
            const payload = {
                payment_date: paymentDate,
                amount: amount,
                payment_mode: paymentMode,
                reference_number: refNumber,
                notes: paymentNotes,
                bank_account_id: bankAccountId || null
            };
            
            const response = await fetch(`/api/finance/invoices/${this.currentInvoice.id}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(`Payment of ${this.formatCurrency(amount)} recorded successfully`, 'success');
                this.hidePaymentModal();
                this.loadInvoices();
                
                // Reload details if modal is open
                if (document.getElementById('invoiceDetailsModal').classList.contains('hidden') === false) {
                    this.loadInvoiceDetails(this.currentInvoice.id);
                }
            } else {
                this.showToast(result.error || 'Failed to record payment', 'error');
            }
        } catch (error) {
            console.error('Error recording payment:', error);
            this.showToast('Failed to record payment', 'error');
        }
    }
    
    // ==================== ACTIONS ====================
    
    async downloadPDF(invoiceId, invoiceNumber) {
        try {
            const response = await fetch(`/api/finance/invoices/${invoiceId}/pdf`);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${invoiceNumber}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                this.showToast('PDF downloaded successfully', 'success');
            } else {
                this.showToast('Failed to download PDF', 'error');
            }
        } catch (error) {
            console.error('Error downloading PDF:', error);
            this.showToast('Failed to download PDF', 'error');
        }
    }
    
    async sendInvoice(invoiceId) {
        if (!confirm('Mark this invoice as Sent?')) return;
        
        try {
            const response = await fetch(`/api/finance/invoices/${invoiceId}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Sent' })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Invoice marked as Sent', 'success');
                this.loadInvoices();
            } else {
                this.showToast(result.error || 'Failed to update status', 'error');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            this.showToast('Failed to update status', 'error');
        }
    }
    
    // ==================== FILTERS ====================
    
    applyFilters() {
        const status = document.getElementById('statusFilter')?.value;
        const paymentStatus = document.getElementById('paymentStatusFilter')?.value;
        
        const filters = {};
        if (status) filters.status = status;
        if (paymentStatus) filters.payment_status = paymentStatus;
        
        this.loadInvoices(filters);
    }
    
    searchInvoices(query) {
        if (query) {
            this.loadInvoices({ search: query });
        } else {
            this.applyFilters();
        }
    }
    
    // ==================== DROPDOWNS ====================
    
    populateCustomerDropdown() {
        const select = document.getElementById('customerId');
        if (!select) return;
        
        select.innerHTML = '<option value="">Select Customer</option>' +
            this.customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
    
    populateBankAccountDropdown() {
        const selects = document.querySelectorAll('#bankAccountId, #paymentBankAccount');
        
        const options = '<option value="">Select Bank Account</option>' +
            this.bankAccounts.map(b => `<option value="${b.id}">${b.bank_name} - ${b.account_number.slice(-4)}</option>`).join('');
        
        selects.forEach(select => {
            if (select) select.innerHTML = options;
        });
    }
    
    // ==================== UTILITIES ====================
    
    getStatusBadge(status) {
        const badges = {
            'Draft': '<span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">Draft</span>',
            'Sent': '<span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">Sent</span>',
            'Cancelled': '<span class="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">Cancelled</span>'
        };
        return badges[status] || status;
    }
    
    getPaymentStatusBadge(status) {
        const badges = {
            'Unpaid': '<span class="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded ml-1">Unpaid</span>',
            'PartiallyPaid': '<span class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded ml-1">Partially Paid</span>',
            'Paid': '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded ml-1">Paid</span>'
        };
        return badges[status] || status;
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
        // Use existing toast system or console
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`[${type}] ${message}`);
            alert(message);
        }
    }
}

// Initialize on page load
let invoiceManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        invoiceManager = new InvoiceManager();
    });
} else {
    invoiceManager = new InvoiceManager();
}
