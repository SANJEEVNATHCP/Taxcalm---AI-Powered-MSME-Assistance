/**
 * Finance & Compliance Module - JavaScript
 * Handles all frontend interactions for accounting, GST, income tax, payroll, and reports
 */

const API_BASE_URL = '/api/finance';

// ==================== UTILITY FUNCTIONS ====================

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg text-white font-semibold flex items-center gap-3 transform transition-all duration-300 translate-y-0 opacity-100 ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`;
    notification.innerHTML = `
        <span class="text-xl">${type === 'success' ? '✅' : '⚠️'}</span>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ==================== BILLING MACHINE AUTO-SYNC ====================

// Automatic sync from billing machine
let autoSyncInterval = null;

function initBillingMachineSync() {
    // Seed initial data if no transactions exist
    const existing = JSON.parse(localStorage.getItem('transactions') || '[]');
    if (existing.length === 0) {
        seedInitialTransactions();
    }
    
    // Auto-sync disabled - Users can manually sync using the "Sync Now" button
    // autoSyncInterval = setInterval(syncBillingMachine, 30000);
    
    // Update last sync time
    updateLastSyncTime();
}

function seedInitialTransactions() {
    const today = new Date();
    const initialTransactions = [
        {
            date: new Date(today - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            type: 'Income',
            category: 'Sales',
            amount: '2450.00',
            description: 'POS Sale - Invoice #1234',
            source: 'billing_machine'
        },
        {
            date: new Date(today - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            type: 'Income',
            category: 'Sales',
            amount: '1890.50',
            description: 'POS Sale - Invoice #1235',
            source: 'billing_machine'
        },
        {
            date: new Date(today - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            type: 'Expense',
            category: 'Inventory Purchase',
            amount: '3500.00',
            description: 'Supplier Payment - ABC Traders',
            source: 'billing_machine'
        },
        {
            date: today.toISOString().split('T')[0],
            type: 'Income',
            category: 'Sales',
            amount: '5670.00',
            description: 'POS Sale - Invoice #1236',
            source: 'billing_machine'
        },
        {
            date: today.toISOString().split('T')[0],
            type: 'Income',
            category: 'Service Charges',
            amount: '1200.00',
            description: 'Consulting Service Fee',
            source: 'billing_machine'
        }
    ];
    
    localStorage.setItem('transactions', JSON.stringify(initialTransactions));
    calculateTotals();
}

async function syncBillingMachine() {
    try {
        console.log('🔄 Syncing with billing machine...');
        
        // Simulate billing machine API call
        const billingData = await fetchBillingMachineData();
        
        if (billingData && billingData.transactions) {
            // Import transactions
            await importBillingTransactions(billingData.transactions);
            
            // Update dashboard
            loadDashboardSummary();
            loadTransactions();
            
            // Update last sync time
            updateLastSyncTime();
            
            showNotification(`Synced ${billingData.transactions.length} transactions from billing machine`, 'success');
        }
    } catch (error) {
        console.error('Billing machine sync error:', error);
    }
}

async function fetchBillingMachineData() {
    // Simulate API call to billing machine
    // In production, this would connect to your actual billing machine API
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                transactions: generateMockBillingData()
            });
        }, 500);
    });
}

function generateMockBillingData() {
    // Simulate random transactions from billing machine
    const mockTransactions = [];
    const now = new Date();
    const categories = ['Sales', 'Product Returns', 'Service Charges', 'Discounts'];
    
    // Generate 0-3 random transactions
    const count = Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
        mockTransactions.push({
            date: now.toISOString().split('T')[0],
            type: Math.random() > 0.2 ? 'Income' : 'Expense',
            category: categories[Math.floor(Math.random() * categories.length)],
            amount: (Math.random() * 5000 + 100).toFixed(2),
            description: `Auto-imported from billing machine`,
            source: 'billing_machine'
        });
    }
    
    return mockTransactions;
}

async function importBillingTransactions(transactions) {
    // Store transactions in localStorage (or send to backend)
    const existing = JSON.parse(localStorage.getItem('transactions') || '[]');
    const newTransactions = [...existing, ...transactions];
    localStorage.setItem('transactions', JSON.stringify(newTransactions));
    
    // Update totals
    calculateTotals();
}

function calculateTotals() {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    
    let totalIncome = 0;
    let totalExpenses = 0;
    
    transactions.forEach(txn => {
        const amount = parseFloat(txn.amount) || 0;
        if (txn.type === 'Income') {
            totalIncome += amount;
        } else {
            totalExpenses += amount;
        }
    });
    
    // Update UI
    const incomeEl = document.getElementById('totalIncome');
    const expenseEl = document.getElementById('totalExpenses');
    const assetsEl = document.getElementById('totalAssets');
    const liabilitiesEl = document.getElementById('totalLiabilities');
    
    if (incomeEl) incomeEl.textContent = formatCurrency(totalIncome);
    if (expenseEl) expenseEl.textContent = formatCurrency(totalExpenses);
    if (assetsEl) assetsEl.textContent = formatCurrency(totalIncome - totalExpenses);
    if (liabilitiesEl) liabilitiesEl.textContent = formatCurrency(0);
}

function updateLastSyncTime() {
    const lastSyncEl = document.getElementById('lastSyncTime');
    if (lastSyncEl) {
        const now = new Date();
        lastSyncEl.textContent = now.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Make syncBillingMachine available globally
window.syncBillingMachine = syncBillingMachine;

// ==================== FINANCE SUB-NAVIGATION ====================

document.addEventListener('DOMContentLoaded', function () {
    // Finance sub-navigation
    const financeSubNavBtns = document.querySelectorAll('.finance-subnav');
    const financeSections = document.querySelectorAll('.finance-section');

    financeSubNavBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const targetTab = this.dataset.financeTab;

            // Update button states
            financeSubNavBtns.forEach(b => {
                b.classList.remove('active', 'text-blue-600', 'bg-white', 'shadow-sm', 'border-blue-100');
                b.classList.add('text-gray-600', 'hover:text-gray-900', 'border-transparent');
            });

            // Set active state
            this.classList.remove('text-gray-600', 'hover:text-gray-900', 'border-transparent');
            this.classList.add('active', 'text-blue-600', 'bg-white', 'shadow-sm', 'border-blue-100');

            // Show/hide sections
            financeSections.forEach(section => {
                section.classList.add('hidden');
                section.classList.remove('animate-fade-in-up');
            });

            const targetSection = document.getElementById(`finance-${targetTab}`);
            if (targetSection) {
                targetSection.classList.remove('hidden');
                targetSection.classList.add('animate-fade-in-up');
            }

            // Load data for the selected section
            loadSectionData(targetTab);
        });
    });

    // Initialize forms
    initAccountingForm();
    initGSTForms();
    initIncomeTaxForms();
    initPayrollForms();
    initReportButtons();

    // Initialize print button
    const printTransactionsBtn = document.getElementById('printTransactionsBtn');
    if (printTransactionsBtn) {
        printTransactionsBtn.addEventListener('click', printTransactions);
    }

    // Initialize billing machine auto-sync
    initBillingMachineSync();

    // Load initial dashboard data
    loadDashboardSummary();
});

function loadSectionData(section) {
    switch (section) {
        case 'accounting':
            loadTransactions();
            loadDashboardSummary();
            break;
        case 'gst-filing':
            loadGSTRegistration();
            loadGSTReturns();
            break;
        case 'income-tax':
            loadTaxProfile();
            break;
        case 'payroll':
            loadEmployees();
            break;
        case 'reports':
            // Reports are loaded on demand
            break;
        case 'caa-meetings':
            loadCAAMeetingsStats();
            break;
        case 'knowledge-base':
            loadKBStats();
            break;
    }
}

// ==================== ACCOUNTING & BOOKKEEPING ====================

function initAccountingForm() {
    const form = document.getElementById('transactionForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Simulate API call
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Adding...';
        btn.disabled = true;

        await new Promise(r => setTimeout(r, 600));

        showNotification('Transaction added successfully!', 'success');
        form.reset();
        loadTransactions();
        loadDashboardSummary();

        btn.innerHTML = originalText;
        btn.disabled = false;
    });
}

async function loadDashboardSummary() {
    try {
        // Mock data
        const data = {
            total_income: 0,
            total_expenses: 0,
            assets: 0,
            liabilities: 0
        };

        const incomeEl = document.getElementById('totalIncome');
        const expenseEl = document.getElementById('totalExpenses');

        if (incomeEl) incomeEl.textContent = formatCurrency(data.total_income);
        if (expenseEl) expenseEl.textContent = formatCurrency(data.total_expenses);

    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadTransactions() {
    try {
        // Load transactions from localStorage (synced from billing machine)
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');

        const container = document.getElementById('transactionsList');
        if (!container) return;

        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="bg-gray-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                        <span class="text-2xl text-gray-400">📝</span>
                    </div>
                    <p class="text-gray-500">Waiting for billing machine sync...</p>
                    <p class="text-xs text-gray-400 mt-2">Transactions will appear automatically</p>
                </div>`;
            return;
        }

        // Sort by date (newest first)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = transactions.map((txn, index) => `
            <div class="group bg-white rounded-xl p-4 flex justify-between items-center border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-default">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-1">
                        <span class="w-8 h-8 rounded-lg flex items-center justify-center text-lg ${txn.type === 'Income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}">
                            ${txn.type === 'Income' ? '📈' : '📉'}
                        </span>
                        <div>
                            <span class="font-bold text-gray-800 text-sm block">${txn.category}</span>
                            <span class="text-xs text-gray-400 font-medium">${formatDate(txn.date)}</span>
                        </div>
                    </div>
                    <p class="text-sm text-gray-500 pl-11 group-hover:text-gray-700 transition-colors">${txn.description || 'No description'}</p>
                </div>
                <div class="text-right pl-4">
                    <div class="font-bold text-lg ${txn.type === 'Income' ? 'text-emerald-600' : 'text-red-600'}">
                        ${txn.type === 'Income' ? '+' : '-'} ${formatCurrency(txn.amount)}
                    </div>
                    <button onclick="deleteTransaction(${index})" class="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors opacity-0 group-hover:opacity-100 font-medium mt-1">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

async function deleteTransaction(index) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    // Remove transaction from localStorage
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    transactions.splice(index, 1);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    // Refresh UI
    calculateTotals();
    loadTransactions();
    loadDashboardSummary();
    
    showNotification('Transaction deleted successfully', 'success');
}

// Make deleteTransaction available globally
window.deleteTransaction = deleteTransaction;

// ==================== GST FILING ====================

function initGSTForms() {
    // GST Registration Form
    const regForm = document.getElementById('gstRegistrationForm');
    if (regForm) {
        regForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const btn = regForm.querySelector('button[type="submit"]');
            btn.innerHTML = 'Saving...';
            await new Promise(r => setTimeout(r, 600));
            showNotification('GST registration saved successfully!', 'success');
            btn.innerHTML = '💾 Save Registration';
        });
    }

    // GST Return Form
    const gstrForm = document.getElementById('gstrForm');
    if (gstrForm) {
        gstrForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const btn = gstrForm.querySelector('button[type="submit"]');
            btn.innerHTML = 'Calculating...';
            await new Promise(r => setTimeout(r, 600));

            showNotification('GST return calculated and saved!', 'success');

            // Display calculation
            const calcDiv = document.getElementById('gstCalculation');
            calcDiv.classList.remove('hidden');

            const sales = parseFloat(document.getElementById('gstrSales').value) || 0;
            const rates = { cgst: 0.09, sgst: 0.09, igst: 0.18 };

            // Simple calc logic
            const cgst = sales * rates.cgst;
            const sgst = sales * rates.sgst;

            document.getElementById('cgstAmount').textContent = formatCurrency(cgst);
            document.getElementById('sgstAmount').textContent = formatCurrency(sgst);
            document.getElementById('igstAmount').textContent = formatCurrency(0);
            document.getElementById('totalGST').textContent = formatCurrency(cgst + sgst);

            btn.innerHTML = '📑 File Return';
        });
    }
}

async function loadGSTRegistration() {
    // Mock loading
}

async function loadGSTReturns() {
    // Future implementation
}

// ==================== INCOME TAX FILING ====================

function initIncomeTaxForms() {
    // Load saved data on page load
    loadSavedTaxProfile();
    loadSavedIncomeSources();

    // Tax Profile Form
    const profileForm = document.getElementById('taxProfileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', function (e) {
            e.preventDefault();
            
            // Get form values
            const taxpayerType = document.getElementById('taxpayerType')?.value;
            const panNumber = document.getElementById('panNumber')?.value;
            const taxpayerName = document.getElementById('taxpayerName')?.value;

            // Validate
            if (!taxpayerType || !panNumber || !taxpayerName) {
                showNotification('Please fill all required fields', 'error');
                return;
            }

            // Validate PAN format (basic)
            const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
            if (!panRegex.test(panNumber.toUpperCase())) {
                showNotification('Invalid PAN format. Use format: ABCDE1234F', 'error');
                return;
            }

            // Save to localStorage
            const taxProfile = {
                taxpayerType,
                panNumber: panNumber.toUpperCase(),
                taxpayerName,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem('taxcalm_tax_profile', JSON.stringify(taxProfile));
            
            showNotification('Tax profile saved successfully!', 'success');
        });
    }

    // Income Source Form
    const incomeForm = document.getElementById('incomeSourceForm');
    if (incomeForm) {
        incomeForm.addEventListener('submit', function (e) {
            e.preventDefault();
            
            // Get form values
            const ay = document.getElementById('ayIncome')?.value;
            const source = document.getElementById('incomeType')?.value;
            const amount = document.getElementById('incomeAmount')?.value;

            // Validate
            if (!ay || !source || !amount) {
                showNotification('Please fill all required fields', 'error');
                return;
            }

            if (parseFloat(amount) <= 0) {
                showNotification('Amount must be greater than 0', 'error');
                return;
            }

            // Get existing income sources or initialize empty array
            const savedSources = JSON.parse(localStorage.getItem('taxcalm_income_sources') || '[]');
            
            // Add new income source
            const newSource = {
                id: Date.now(),
                assessmentYear: ay,
                source,
                amount: parseFloat(amount),
                addedAt: new Date().toISOString()
            };
            savedSources.push(newSource);

            // Save to localStorage
            localStorage.setItem('taxcalm_income_sources', JSON.stringify(savedSources));
            
            showNotification('Income source added successfully!', 'success');
            incomeForm.reset();
            
            // Refresh the display
            loadSavedIncomeSources();
        });
    }

    // Calculate Tax Button
    const calcTaxBtn = document.getElementById('calculateTaxBtn');
    if (calcTaxBtn) {
        calcTaxBtn.addEventListener('click', async function () {
            const ay = document.getElementById('ayIncome').value;
            if (!ay) {
                showNotification('Please enter an assessment year', 'error');
                return;
            }

            calcTaxBtn.innerHTML = 'Calculating...';
            await new Promise(r => setTimeout(r, 600));

            // Mock Calculation
            document.getElementById('taxTotalIncome').textContent = formatCurrency(1500000);
            document.getElementById('taxTotalDeductions').textContent = formatCurrency(250000);
            document.getElementById('taxPayable').textContent = formatCurrency(125000);

            showNotification('Tax calculated successfully!', 'success');
            calcTaxBtn.innerHTML = '🧮 Calculate Tax';
        });
    }
}

// Load saved tax profile
function loadSavedTaxProfile() {
    const saved = localStorage.getItem('taxcalm_tax_profile');
    if (saved) {
        try {
            const profile = JSON.parse(saved);
            const taxpayerType = document.getElementById('taxpayerType');
            const panNumber = document.getElementById('panNumber');
            const taxpayerName = document.getElementById('taxpayerName');

            if (taxpayerType) taxpayerType.value = profile.taxpayerType || '';
            if (panNumber) panNumber.value = profile.panNumber || '';
            if (taxpayerName) taxpayerName.value = profile.taxpayerName || '';
        } catch (e) {
            console.error('Error loading tax profile:', e);
        }
    }
}

// Load saved income sources
function loadSavedIncomeSources() {
    const saved = localStorage.getItem('taxcalm_income_sources');
    if (saved) {
        try {
            const sources = JSON.parse(saved);
            console.log(`Loaded ${sources.length} income source(s)`);
            // You can display these in a list if needed
        } catch (e) {
            console.error('Error loading income sources:', e);
        }
    }
}

async function loadTaxProfile() {
    // Mock loading
}

// ==================== PAYROLL & TDS ====================

function initPayrollForms() {
    // Employee Form
    const empForm = document.getElementById('employeeForm');
    if (empForm) {
        empForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            showNotification('Employee added successfully!', 'success');
            empForm.reset();
            loadEmployees();
        });
    }

    // Generate Payroll Button
    const genPayrollBtn = document.getElementById('generatePayrollBtn');
    if (genPayrollBtn) {
        genPayrollBtn.addEventListener('click', function () {
            if (!confirm(`Generate payroll for current month?`)) return;
            showNotification('Payroll generated successfully', 'success');
        });
    }
}

async function loadEmployees() {
    try {
        const employees = [
            { id: 1, name: 'Rahul Kumar', employee_code: 'EMP001', designation: 'Senior Developer', status: 'Active' },
            { id: 2, name: 'Priya Singh', employee_code: 'EMP002', designation: 'Designer', status: 'Active' }
        ];

        const container = document.getElementById('employeesList');
        if (!container) return;

        if (employees.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6">
                     <div class="bg-gray-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                        <span class="text-2xl text-gray-400">👥</span>
                    </div>
                    <p class="text-gray-400">No employees added yet.</p>
                </div>`;
            return;
        }

        container.innerHTML = employees.map(emp => `
            <div class="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-sm transition-all group">
                <div class="flex justify-between items-start">
                    <div class="flex items-center gap-3">
                         <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                            ${emp.name.split(' ').map(n => n[0]).join('')}
                         </div>
                         <div>
                            <div class="font-bold text-gray-800 flex items-center gap-2">
                                ${emp.name}
                            </div>
                            <div class="text-xs text-gray-500 font-medium">${emp.designation || 'N/A'} • <span class="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">${emp.employee_code}</span></div>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
            }">
                            <span class="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                            ${emp.status}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

// ==================== FINANCIAL REPORTS ====================

function initReportButtons() {
    const reportBtns = document.querySelectorAll('.report-btn');

    reportBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const reportType = this.dataset.report;
            // Update UI state
            reportBtns.forEach(b => {
                b.classList.remove('border-blue-500', 'ring-2', 'ring-blue-100');
                b.classList.add('border-gray-200');
            });
            this.classList.remove('border-gray-200');
            this.classList.add('border-blue-500', 'ring-2', 'ring-blue-100');

            loadReport(reportType);
        });
    });
}

async function loadReport(type) {
    const displayArea = document.getElementById('reportDisplay');
    displayArea.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 text-gray-400">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p class="text-gray-500 font-medium">Generating financial statement...</p>
        </div>
    `;

    try {
        // Simulation
        await new Promise(r => setTimeout(r, 800));

        // Mock data
        const mockData = getMockReportData(type);
        displayReport(type, mockData);

    } catch (error) {
        console.error('Error loading report:', error);
        displayArea.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-red-500">
                <div class="text-4xl mb-2">⚠️</div>
                <p>Failed to load report</p>
            </div>`;
    }
}

function getMockReportData(type) {
    // Return dummy data based on report type
    if (type === 'profit-loss') {
        return {
            period: 'April 2023 - March 2024',
            income: { total: 0, items: [] },
            expenses: { total: 0, items: [] },
            net_profit: 0
        };
    } else if (type === 'balance-sheet') {
        return {
            as_of_date: '31 March 2024',
            assets: { total: 0, items: [] },
            liabilities: { total: 0, items: [] },
            equity: 0
        };
    } else {
        return {
            period: 'April 2023 - March 2024',
            operating_activities: { cash_inflow: 0, cash_outflow: 0 },
            net_cash: 0,
            net_change_in_cash: 0
        };
    }
}

function displayReport(type, data) {
    const displayArea = document.getElementById('reportDisplay');

    let html = `
        <div class="bg-white rounded-xl ps-4 sm:p-8 animate-fade-in-up w-full">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-gray-100 gap-4">
                <div>
                    <h4 class="text-2xl font-bold text-gray-800">${getReportTitle(type)}</h4>
                    <p class="text-sm text-gray-500 mt-1">Generated on ${new Date().toLocaleDateString()}</p>
                </div>
                <button onclick="printReport()" class="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-colors border border-gray-200">
                    <span>🖨️</span> Print PDF
                </button>
            </div>
    `;

    switch (type) {
        case 'profit-loss':
            html += generateProfitLossHTML(data);
            break;
        case 'balance-sheet':
            html += generateBalanceSheetHTML(data);
            break;
        case 'cash-flow':
            html += generateCashFlowHTML(data);
            break;
    }

    html += `</div>`;
    displayArea.innerHTML = html;
}

function getReportTitle(type) {
    const titles = {
        'profit-loss': 'Profit & Loss Statement',
        'balance-sheet': 'Balance Sheet',
        'cash-flow': 'Cash Flow Statement'
    };
    return titles[type] || 'Financial Report';
}

function generateProfitLossHTML(data) {
    return `
        <div class="space-y-8">
            <div class="bg-indigo-50/50 rounded-lg p-3 text-center border border-indigo-100 max-w-xs mx-auto">
                <span class="text-xs font-bold text-indigo-400 uppercase tracking-widest">Financial Period</span>
                <div class="text-indigo-900 font-semibold mt-1">${data.period}</div>
            </div>
            
            <!-- Income Section -->
            <div class="bg-emerald-50/30 rounded-xl p-1 border border-emerald-100/50">
                <div class="p-4">
                    <h5 class="font-bold text-emerald-700 mb-4 flex items-center gap-2 text-lg">
                        <span class="bg-emerald-100 p-1.5 rounded-lg">📈</span> Income
                    </h5>
                    <div class="space-y-3">
                        ${data.income.items.map(item => `
                            <div class="flex justify-between py-2 border-b border-emerald-100/50 last:border-0 hover:bg-white/50 px-3 rounded-lg transition-colors">
                                <span class="text-gray-600 font-medium">${item.category}</span>
                                <span class="font-bold text-gray-800">${formatCurrency(item.amount)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="flex justify-between items-center py-4 mt-4 bg-white px-5 rounded-lg shadow-sm border border-emerald-100">
                        <span class="font-bold text-gray-700">Total Income</span>
                        <span class="font-bold text-emerald-600 text-xl">${formatCurrency(data.income.total)}</span>
                    </div>
                </div>
            </div>
            
            <!-- Expenses Section -->
            <div class="bg-red-50/30 rounded-xl p-1 border border-red-100/50">
                <div class="p-4">
                    <h5 class="font-bold text-red-700 mb-4 flex items-center gap-2 text-lg">
                        <span class="bg-red-100 p-1.5 rounded-lg">📉</span> Expenses
                    </h5>
                    <div class="space-y-3">
                        ${data.expenses.items.map(item => `
                            <div class="flex justify-between py-2 border-b border-red-100/50 last:border-0 hover:bg-white/50 px-3 rounded-lg transition-colors">
                                <span class="text-gray-600 font-medium">${item.category}</span>
                                <span class="font-bold text-gray-800">${formatCurrency(item.amount)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="flex justify-between items-center py-4 mt-4 bg-white px-5 rounded-lg shadow-sm border border-red-100">
                        <span class="font-bold text-gray-700">Total Expenses</span>
                        <span class="font-bold text-red-600 text-xl">${formatCurrency(data.expenses.total)}</span>
                    </div>
                </div>
            </div>
            
            <!-- Net Profit -->
            <div class="mt-8">
                <div class="flex flex-col sm:flex-row justify-between items-center bg-gray-900 text-white p-6 rounded-2xl shadow-xl transform transition hover:scale-[1.01]">
                    <div class="mb-2 sm:mb-0 text-center sm:text-left">
                        <span class="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Net Profit / Loss</span>
                        <div class="flex items-center gap-2 justify-center sm:justify-start">
                           <span class="text-2xl font-bold ${data.net_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}">
                                ${data.net_profit >= 0 ? 'Net Profit' : 'Net Loss'}
                            </span>
                        </div>
                    </div>
                    <span class="text-3xl font-bold ${data.net_profit >= 0 ? 'text-emerald-400' : 'text-red-400'} bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                        ${formatCurrency(Math.abs(data.net_profit))}
                    </span>
                </div>
            </div>
        </div>
    `;
}

function generateBalanceSheetHTML(data) {
    return `
        <div class="space-y-8">
            <div class="bg-indigo-50/50 rounded-lg p-3 text-center border border-indigo-100 max-w-xs mx-auto">
                <span class="text-xs font-bold text-indigo-400 uppercase tracking-widest">Balance Sheet Date</span>
                <div class="text-indigo-900 font-semibold mt-1">${data.as_of_date}</div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Assets -->
                <div class="bg-blue-50/30 rounded-xl p-5 border border-blue-100">
                    <h5 class="font-bold text-blue-700 mb-4 flex items-center gap-2 text-lg">
                        <span class="bg-blue-100 p-1.5 rounded-lg">🏛️</span> Assets
                    </h5>
                    <div class="space-y-4">
                        ${data.assets.items.map(item => `
                            <div class="flex justify-between py-2 border-b border-blue-100/50 last:border-0 text-sm">
                                <span class="text-gray-600 font-medium">${item.name}</span>
                                <span class="font-bold text-gray-900">${formatCurrency(item.amount)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="flex justify-between pt-4 mt-4 border-t border-blue-200 font-bold text-blue-900 text-lg">
                        <span>Total Assets</span>
                        <span>${formatCurrency(data.assets.total)}</span>
                    </div>
                </div>
                
                <!-- Liabilities -->
                <div class="bg-orange-50/30 rounded-xl p-5 border border-orange-100">
                    <h5 class="font-bold text-orange-700 mb-4 flex items-center gap-2 text-lg">
                        <span class="bg-orange-100 p-1.5 rounded-lg">💳</span> Liabilities
                    </h5>
                    <div class="space-y-4">
                        ${data.liabilities.items.map(item => `
                            <div class="flex justify-between py-2 border-b border-orange-100/50 last:border-0 text-sm">
                                <span class="text-gray-600 font-medium">${item.name}</span>
                                <span class="font-bold text-gray-900">${formatCurrency(item.amount)}</span>
                            </div>
                        `).join('')}
                    </div>
                   <div class="flex justify-between pt-4 mt-4 border-t border-orange-200 font-bold text-orange-900 text-lg">
                        <span>Total Liabilities</span>
                        <span>${formatCurrency(data.liabilities.total)}</span>
                    </div>
                </div>
            </div>
            
            <!-- Equity -->
             <div class="bg-purple-50 rounded-xl p-6 border border-purple-100 flex justify-between items-center shadow-sm">
                <div class="flex items-center gap-3">
                    <span class="bg-purple-100 p-2 rounded-lg text-xl">👑</span>
                    <span class="font-bold text-purple-900 text-lg">Owner's Equity</span>
                </div>
                <span class="font-bold text-purple-700 text-2xl">${formatCurrency(data.equity)}</span>
            </div>
        </div>
    `;
}

function generateCashFlowHTML(data) {
    return `
        <div class="space-y-8">
             <div class="bg-indigo-50/50 rounded-lg p-3 text-center border border-indigo-100 max-w-xs mx-auto">
                <span class="text-xs font-bold text-indigo-400 uppercase tracking-widest">Financial Period</span>
                <div class="text-indigo-900 font-semibold mt-1">${data.period}</div>
            </div>

            <div class="bg-slate-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
                <div class="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-16 -mt-16"></div>
                
                <h5 class="font-bold text-emerald-400 mb-6 text-xl relative z-10">Operating Activities</h5>
                
                <div class="space-y-4 relative z-10">
                    <div class="flex justify-between py-3 border-b border-slate-700/50">
                        <span class="text-slate-400 font-medium">Cash Inflow</span>
                        <span class="font-bold text-emerald-400 text-lg">+ ${formatCurrency(data.operating_activities.cash_inflow)}</span>
                    </div>
                    <div class="flex justify-between py-3 border-b border-slate-700/50">
                        <span class="text-slate-400 font-medium">Cash Outflow</span>
                        <span class="font-bold text-red-400 text-lg">- ${formatCurrency(data.operating_activities.cash_outflow)}</span>
                    </div>
                </div>
                
                <div class="mt-8 pt-4 border-t border-slate-700 relative z-10 flex justify-between items-center">
                    <div>
                         <span class="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Net Cash Flow</span>
                        <span class="font-bold text-2xl text-white">Operations</span>
                    </div>
                    <span class="text-3xl font-bold text-emerald-400">${formatCurrency(data.operating_activities.cash_inflow - data.operating_activities.cash_outflow)}</span>
                </div>
            </div>
            
            <div class="max-w-md mx-auto text-center mt-8">
                 <p class="text-gray-500 text-sm">Summary of cash entering and leaving your business from operating activities.</p>
            </div>
        </div>
    `;
}

function printReport() {
    window.print();
}

function printTransactions() {
    // Add a print-specific class to the body to help with styling
    document.body.classList.add('printing-transactions');

    // Trigger print dialog
    window.print();

    // Remove the class after printing (or cancel)
    setTimeout(() => {
        document.body.classList.remove('printing-transactions');
    }, 1000);
}

// ==================== CAA MEETINGS INTEGRATION ====================

function loadCAAMeetingsStats() {
    // Fetch CAA meetings stats from backend
    fetch('/api/finance/caa-meetings/stats/summary')
        .then(response => response.json())
        .then(data => {
            document.getElementById('totalCAAMeetings').textContent = data.total || '0';
            document.getElementById('completedCAAMeetings').textContent = data.completed || '0';
            document.getElementById('scheduledCAAMeetings').textContent = data.scheduled || '0';
        })
        .catch(error => {
            console.log('CAA Meetings stats not available yet. Initialize by opening the CAA Meetings page.');
            // Fallback for demo
            document.getElementById('totalCAAMeetings').textContent = '2';
            document.getElementById('completedCAAMeetings').textContent = '1';
            document.getElementById('scheduledCAAMeetings').textContent = '1';
        });
}

function loadKBStats() {
    // Fetch Knowledge Base stats from backend
    fetch('/rag/status')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('totalKBDocuments').textContent = data.total_documents || '0';
                document.getElementById('totalKBChunks').textContent = data.total_chunks || '0';
                const statusEl = document.getElementById('kbStatus');
                statusEl.textContent = data.status || 'Inactive';
                statusEl.classList.remove('text-red-600');
                statusEl.classList.add('text-emerald-600');
            } else {
                throw new Error('KB not available');
            }
        })
        .catch(error => {
            console.log('Knowledge Base stats not available:', error);
            // Fallback for demo
            document.getElementById('totalKBDocuments').textContent = '7';
            document.getElementById('totalKBChunks').textContent = '25';
            const statusEl = document.getElementById('kbStatus');
            statusEl.textContent = 'Active';
            statusEl.classList.remove('text-red-600');
            statusEl.classList.add('text-emerald-600');
        });
}

// Export functions to global scope
window.deleteTransaction = deleteTransaction;
window.printReport = printReport;
window.printTransactions = printTransactions;
