// ============================================================
// ADVANCED FEATURES: Dark Mode, History, Export, etc.
// ============================================================

// ==================== MOBILE MENU ====================
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
}

// Close mobile menu when a tab is clicked
const tabNavButtons = document.querySelectorAll('.tab-nav');
tabNavButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (mobileMenu) mobileMenu.classList.add('hidden');
    });
});

// ==================== TAB NAVIGATION ====================
const tabContents = document.querySelectorAll('.tab-content');

tabNavButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');

        // Remove active class from all buttons
        tabNavButtons.forEach(btn => {
            btn.classList.remove('text-amber-400', 'bg-slate-700');
            btn.classList.add('text-emerald-300', 'hover:text-amber-400');
        });

        // Add active class to clicked button
        button.classList.add('text-amber-400', 'bg-slate-700');

        // Hide all tab contents
        tabContents.forEach(content => {
            content.classList.add('hidden');
        });

        // Show selected tab
        const selectedTab = document.getElementById(`tab-${tabId}`);
        if (selectedTab) {
            selectedTab.classList.remove('hidden');

            // Update charts when analytics tab is opened
            if (tabId === 'analytics') {
                setTimeout(() => {
                    updateAnalyticsDashboard();
                }, 100);
            }
        }
    });
});

// ==================== DARK MODE ====================
const darkModeToggle = document.getElementById('darkModeToggle');
const htmlElement = document.documentElement;

// Initialize dark mode from localStorage
// Initialize dark mode from localStorage
function initDarkMode() {
    // FORCE RESET to Light Team to resolve user request
    disableDarkMode();
}

function enableDarkMode() {
    document.documentElement.classList.remove('rose');
    document.documentElement.classList.add('dark');
    document.body.setAttribute('data-theme', 'dark');
    localStorage.setItem('darkMode', 'true');
    if (darkModeToggle) darkModeToggle.textContent = '☀️';
}

function disableDarkMode() {
    document.documentElement.classList.remove('dark');
    const savedTheme = localStorage.getItem('taxcalm_theme');
    if (savedTheme === 'rose') {
        document.documentElement.classList.add('rose');
        document.body.setAttribute('data-theme', 'rose');
    } else {
        document.body.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('darkMode', 'false');
    if (darkModeToggle) darkModeToggle.textContent = '🌙';
}

if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        if (document.documentElement.classList.contains('dark')) {
            disableDarkMode();
        } else {
            enableDarkMode();
        }
    });
}

// ==================== CALCULATION HISTORY ====================
class CalculationHistory {
    constructor() {
        this.storageKey = 'gstCalculationHistory';
        this.maxItems = 50;
    }

    add(calculation) {
        const history = this.getAll();
        history.unshift({
            ...calculation,
            timestamp: new Date().toLocaleString()
        });
        // Keep only last 50
        if (history.length > this.maxItems) {
            history.pop();
        }
        localStorage.setItem(this.storageKey, JSON.stringify(history));
    }

    getAll() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    clear() {
        localStorage.removeItem(this.storageKey);
    }
}

const historyManager = new CalculationHistory();

// ==================== TUTORIAL MODAL ====================
const tutorialBtn = document.getElementById('tutorialBtn');
const tutorialModal = document.getElementById('tutorialModal');
const closeTutorialBtn = document.getElementById('closeTutorial');

if (tutorialBtn && tutorialModal) {
    tutorialBtn.addEventListener('click', () => {
        tutorialModal.classList.remove('hidden');
    });
}

if (closeTutorialBtn && tutorialModal) {
    closeTutorialBtn.addEventListener('click', () => {
        tutorialModal.classList.add('hidden');
    });
}

if (tutorialModal) {
    tutorialModal.addEventListener('click', (e) => {
        if (e.target === tutorialModal) {
            tutorialModal.classList.add('hidden');
        }
    });
}

// ==================== HISTORY MODAL ====================
const historyBtn = document.getElementById('historyBtn');
const historyModal = document.getElementById('historyModal');
const closeHistoryBtn = document.getElementById('closeHistory');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

if (historyBtn && historyModal) {
    historyBtn.addEventListener('click', () => {
        updateHistoryDisplay();
        historyModal.classList.remove('hidden');
    });
}

if (closeHistoryBtn && historyModal) {
    closeHistoryBtn.addEventListener('click', () => {
        historyModal.classList.add('hidden');
    });
}

if (historyModal) {
    historyModal.addEventListener('click', (e) => {
        if (e.target === historyModal) {
            historyModal.classList.add('hidden');
        }
    });
}

function updateHistoryDisplay() {
    const history = historyManager.getAll();
    if (history.length === 0) {
        historyList.innerHTML = '<p class="text-gray-600 dark:text-gray-400 text-sm">No calculations yet. Make your first calculation!</p>';
        clearHistoryBtn.classList.add('hidden');
    } else {
        historyList.innerHTML = history.map((item, index) => `
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-blue-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition" data-index="${index}">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-semibold text-gray-800 dark:text-white">Sales: ₹${formatCurrency(item.sales)}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Rate: ${item.rate}% | Net: <strong>₹${formatCurrency(item.net_gst)}</strong></p>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${item.timestamp}</p>
                </div>
            </div>
        `).join('');
        clearHistoryBtn.classList.remove('hidden');

        // Add click handlers to load history
        document.querySelectorAll('#historyList > div').forEach(item => {
            item.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                const calc = history[index];
                document.getElementById('sales').value = calc.sales;
                document.getElementById('purchases').value = calc.purchases;
                document.getElementById('rate').value = calc.rate;
                document.getElementById('period').value = calc.period;
                historyModal.classList.add('hidden');
            });
        });
    }
}

clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Clear all calculation history?')) {
        historyManager.clear();
        updateHistoryDisplay();
    }
});

// ==================== PDF EXPORT ====================
// ==================== PDF EXPORT FUNCTIONALITY ====================

// ==================== BUSINESS TEMPLATES ====================

function setupPdfExport() {
    const exportPdfBtn = document.getElementById('exportPdfBtn');

    if (!exportPdfBtn) {
        console.warn('Export PDF button not found');
        return;
    }

    exportPdfBtn.addEventListener('click', () => {
        const btn = exportPdfBtn;
        const originalText = btn.textContent;

        try {
            btn.textContent = 'Generating...';
            btn.disabled = true;

            const sales = parseFloat(document.getElementById('sales').value) || 0;
            const purchases = parseFloat(document.getElementById('purchases').value) || 0;
            const rate = parseFloat(document.getElementById('rate').value) || 0;

            // Calculate GST
            const outputGst = sales * (rate / 100);
            const inputGst = purchases * (rate / 100);
            const netGst = outputGst - inputGst;

            // Format currency
            const formatCurrency = (num) => {
                return num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
            };

            // Determine status message
            let message = '';
            let status = '';
            if (netGst > 0) {
                message = `You need to pay ₹${Math.abs(netGst).toFixed(2)} as GST to the government.`;
                status = '💳 Payment Due';
            } else if (netGst < 0) {
                message = `You are eligible for a refund of ₹${Math.abs(netGst).toFixed(2)}.`;
                status = '✅ Refund Expected';
            } else {
                message = `Your GST is balanced - no payment or refund due.`;
                status = '⚖️ Balanced';
            }

            // Create HTML report
            const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>GST Calculation Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 30px; 
            color: #333;
            background: white;
        }
        h1 { 
            color: #10b981; 
            border-bottom: 3px solid #10b981; 
            padding-bottom: 15px;
            margin-bottom: 20px;
            font-size: 28px;
        }
        h2 { 
            color: #0f766e; 
            margin-top: 25px;
            margin-bottom: 15px;
            font-size: 18px;
        }
        .timestamp {
            color: #666;
            font-size: 13px;
            margin-bottom: 20px;
        }
        .box { 
            border: 1px solid #e0e0e0; 
            padding: 20px; 
            margin: 15px 0; 
            background: #fafafa;
            border-radius: 6px;
        }
        .summary { 
            background: #e8f5e9; 
            border-left: 5px solid #10b981;
            background-color: #f0f9f7;
        }
        .row { 
            display: flex; 
            justify-content: space-between; 
            margin: 12px 0; 
            padding: 8px 0;
            border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .row:last-child {
            border-bottom: none;
        }
        .label { 
            font-weight: 600;
            color: #444;
        }
        .value { 
            text-align: right;
            color: #333;
            font-weight: 500;
        }
        .highlight { 
            font-size: 20px; 
            color: #10b981; 
            font-weight: 700;
            background: rgba(16, 185, 129, 0.1);
            padding: 8px 12px;
            border-radius: 4px;
        }
        .status-row {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid rgba(0,0,0,0.1);
            font-size: 16px;
        }
        .warning { 
            background: #fff3cd; 
            border-left: 5px solid #ffc107; 
            padding: 15px; 
            margin: 20px 0;
            border-radius: 4px;
        }
        .warning strong {
            display: block;
            margin-bottom: 10px;
            color: #856404;
        }
        .warning p {
            margin: 8px 0;
            color: #666;
            font-size: 13px;
            line-height: 1.5;
        }
        .footer { 
            margin-top: 40px; 
            font-size: 11px; 
            color: #999; 
            border-top: 1px solid #ddd; 
            padding-top: 15px;
            text-align: center;
        }
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <h1>📊 GST Calculation Report</h1>
    <p class="timestamp">Generated on: ${new Date().toLocaleString('en-IN')}</p>

    <div class="box">
        <h2>Calculation Summary</h2>
        <div class="row">
            <span class="label">Total Sales (Revenue):</span>
            <span class="value">₹${formatCurrency(sales)}</span>
        </div>
        <div class="row">
            <span class="label">Total Purchases (Expenses):</span>
            <span class="value">₹${formatCurrency(purchases)}</span>
        </div>
        <div class="row">
            <span class="label">GST Rate Applied:</span>
            <span class="value">${rate}%</span>
        </div>
        <div class="row">
            <span class="label">Profit Margin:</span>
            <span class="value">${sales > 0 ? ((sales - purchases) / sales * 100).toFixed(1) : 0}%</span>
        </div>
    </div>

    <div class="box summary">
        <h2>GST Results</h2>
        <div class="row">
            <span class="label">GST Collected (Output GST):</span>
            <span class="value">₹${outputGst.toFixed(2)}</span>
        </div>
        <div class="row">
            <span class="label">GST Paid (Input Tax Credit):</span>
            <span class="value">₹${inputGst.toFixed(2)}</span>
        </div>
        <div class="row status-row">
            <span class="label">Net GST Amount:</span>
            <span class="value highlight">₹${netGst.toFixed(2)}</span>
        </div>
        <div class="row" style="margin-top: 10px; font-size: 14px;">
            <span class="label">Status:</span>
            <span class="value">${status}</span>
        </div>
    </div>

    <div class="box">
        <h2>Analysis</h2>
        <p style="line-height: 1.6; color: #555;">${message}</p>
    </div>

    <div class="warning">
        <strong>⚠️ IMPORTANT DISCLAIMER</strong>
        <p>This calculation is for informational purposes only. GST laws are complex and depend on various factors including your business type, location, and specific transactions.</p>
        <p>Always consult with a qualified Chartered Accountant before filing GST returns. This PDF should not be submitted to tax authorities. Use official GSTR forms for official filing.</p>
    </div>

    <div class="footer">
        <p><strong>Generated by TaxCalm Calculator</strong></p>
        <p>This document is provided as-is for personal reference only.</p>
    </div>
</body>
</html>`;

            // Generate PDF using html2pdf.js or fallback to print
            if (typeof html2pdf === 'undefined' || !window.html2pdf) {
                console.warn('html2pdf library not available, using browser print instead');
                const printWindow = window.open('', '', 'height=500,width=800');
                printWindow.document.write(htmlContent);
                printWindow.document.close();
                printWindow.print();
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }, 500);
                return;
            }

            const filename = `TaxCalm-Report-${new Date().toISOString().split('T')[0]}.pdf`;

            const element = document.createElement('div');
            element.innerHTML = htmlContent;

            const opt = {
                margin: [10, 10, 10, 10],
                filename: filename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
            };

            html2pdf().set(opt).from(element).save();

            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
                alert('✅ PDF downloaded successfully!\n\nFile: ' + filename);
            }, 1000);

        } catch (error) {
            console.error('PDF Export Error:', error);
            alert('ℹ️ PDF export uses external library.\n\nInstead, use browser print (Ctrl+P or Cmd+P).');

            const btn = exportPdfBtn;
            btn.textContent = originalText || '📄 Export PDF';
            btn.disabled = false;
        }
    });
}

// Initialize PDF export when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPdfExport);
} else {
    setupPdfExport();
}

// Also try setup on window load
window.addEventListener('load', setupPdfExport);

// ==================== BUSINESS TEMPLATES ====================
// Wait for DOM to be fully loaded before attaching template button listeners
document.addEventListener('DOMContentLoaded', () => {
    const templateBtns = document.querySelectorAll('.template-btn');

    const templates = {
        retail: { sales: 500000, purchases: 300000, rate: 18 },
        ecommerce: { sales: 750000, purchases: 450000, rate: 18 },
        service: { sales: 400000, purchases: 100000, rate: 18 },
        manufacturing: { sales: 1000000, purchases: 600000, rate: 18 }
    };

    if (templateBtns.length > 0) {
        templateBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const template = templates[btn.dataset.template];
                const salesInput = document.getElementById('sales');
                const purchasesInput = document.getElementById('purchases');
                const rateInput = document.getElementById('rate');

                if (salesInput) salesInput.value = template.sales;
                if (purchasesInput) purchasesInput.value = template.purchases;
                if (rateInput) rateInput.value = template.rate;

                // Trigger calculate button if it exists
                const calculateBtn = document.getElementById('calculateBtn');
                if (calculateBtn) calculateBtn.click();
            });
        });
    }
});

// ==================== SCENARIO COMPARISON ====================
const compareBtn = document.getElementById('compareBtn');
const comparisonModal = document.getElementById('comparisonModal');
const closeComparisonBtn = document.getElementById('closeComparison');
let scenarios = [];

if (compareBtn) {
    compareBtn.addEventListener('click', () => {
        const sales = parseFloat(document.getElementById('sales')?.value || 0);
        const purchases = parseFloat(document.getElementById('purchases')?.value || 0);
        const rate = parseFloat(document.getElementById('rate')?.value || 18);

        if (!sales || !purchases || !rate) {
            alert('Please calculate first');
            return;
        }

        const scenario = {
            name: `Scenario ${scenarios.length + 1}`,
            sales,
            purchases,
            rate,
            output: sales * (rate / 100),
            input: purchases * (rate / 100),
            net: (sales * (rate / 100)) - (purchases * (rate / 100))
        };

        scenarios.push(scenario);
        updateComparisonDisplay();
        if (comparisonModal) comparisonModal.classList.remove('hidden');
    });
}

function updateComparisonDisplay() {
    const content = document.getElementById('comparisonContent');
    if (scenarios.length === 0 || !content) {
        if (content) content.innerHTML = '<p class="text-gray-600 dark:text-gray-400">No scenarios yet</p>';
        return;
    }

    content.innerHTML = scenarios.map((s, idx) => `
        <div class="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900 p-4 rounded">
            <div class="flex justify-between items-center mb-2">
                <h4 class="font-bold text-gray-800 dark:text-white">${s.name}</h4>
                <button onclick="removeScenario(${idx})" class="text-red-500 hover:text-red-700">✕</button>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Sales: ₹${s.sales.toLocaleString('en-IN')}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Purchases: ₹${s.purchases.toLocaleString('en-IN')}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Rate: ${s.rate}%</p>
            <p class="font-bold text-lg text-orange-600 dark:text-orange-400 mt-2">Net GST: ₹${s.net.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
        </div>
    `).join('');
}

window.removeScenario = (idx) => {
    scenarios.splice(idx, 1);
    updateComparisonDisplay();
};

if (closeComparisonBtn) {
    closeComparisonBtn.addEventListener('click', () => {
        if (comparisonModal) comparisonModal.classList.add('hidden');
    });
}

// ==================== COMPLIANCE CHECKLIST ====================
const complianceChecks = document.querySelectorAll('.compliance-check');

function updateComplianceScore() {
    const allChecks = document.querySelectorAll('.compliance-check');
    if (allChecks.length === 0) return;

    const checkedCount = Array.from(allChecks).filter(c => c.checked).length;
    const percentage = Math.round((checkedCount / allChecks.length) * 100);

    // Update progress bars in the UI if they exist
    const progressBars = document.querySelectorAll('.compliance-progress-bar');
    progressBars.forEach(bar => {
        bar.style.width = percentage + '%';
        bar.textContent = percentage + '%';
    });

    // Update any text elements showing the percentage
    const progressTexts = document.querySelectorAll('.compliance-progress-text');
    progressTexts.forEach(text => {
        text.textContent = percentage + '% Complete';
    });
}

if (complianceChecks.length > 0) {
    complianceChecks.forEach(check => {
        // Load saved state
        const saved = localStorage.getItem(`compliance_${check.dataset.item}`);
        if (saved === 'true') {
            check.checked = true;
        }

        check.addEventListener('change', () => {
            localStorage.setItem(`compliance_${check.dataset.item}`, check.checked);
            updateComplianceScore();
        });
    });

    // Initial score update
    updateComplianceScore();
}

// ==================== EXPENSE BREAKDOWN CHART ====================
// Expense breakdown chart removed per user request
function drawExpenseChart(sales, purchases, rate) {
    // Chart functionality disabled
    return;
}

// ==================== INTEGRATION WITH CALCULATOR ====================
const originalCalculateBtn = document.getElementById('calculateBtn');
const originalResetBtn = document.getElementById('resetBtn');

if (originalCalculateBtn) {
    originalCalculateBtn.addEventListener('click', function () {
        // Wait for results to appear, then update analysis and draw chart
        setTimeout(() => {
            const sales = parseFloat(document.getElementById('sales')?.value || 0);
            const purchases = parseFloat(document.getElementById('purchases')?.value || 0);
            const rate = parseFloat(document.getElementById('rate')?.value || 0);
            const period = document.getElementById('period')?.value || 'monthly';
            const outputGstText = document.getElementById('outputGst')?.innerText || '₹0';
            const inputGstText = document.getElementById('inputGst')?.innerText || '₹0';
            const netGstText = document.getElementById('netGst')?.innerText || '₹0';

            const outputGst = parseFloat(outputGstText.replace('₹', '').replace(/,/g, '')) || 0;
            const inputGst = parseFloat(inputGstText.replace('₹', '').replace(/,/g, '')) || 0;
            const netGst = parseFloat(netGstText.replace('₹', '').replace(/,/g, '')) || 0;

            // Save to history
            if (sales > 0 || purchases > 0) {
                historyManager.add({
                    sales,
                    purchases,
                    rate,
                    period: period,
                    output_gst: outputGst,
                    input_gst: inputGst,
                    net_gst: netGst
                });
            }

            // Draw chart - disabled
            // if (sales > 0 || purchases > 0) {
            //     drawExpenseChart(sales, purchases, rate);
            // }

            // Update audit trail
            const auditRate = document.getElementById('auditRate');
            const auditRate2 = document.getElementById('auditRate2');
            const auditOutput = document.getElementById('auditOutput');
            const auditInput = document.getElementById('auditInput');
            const auditNet = document.getElementById('auditNet');

            if (auditRate) auditRate.innerText = rate;
            if (auditRate2) auditRate2.innerText = rate;
            if (auditOutput) auditOutput.innerText = `₹${formatCurrency(outputGst)}`;
            if (auditInput) auditInput.innerText = `₹${formatCurrency(inputGst)}`;
            if (auditNet) auditNet.innerText = `₹${formatCurrency(netGst)}`;
        }, 500);
    });
}

if (originalResetBtn) {
    originalResetBtn.addEventListener('click', function () {
        scenarios = [];
        if (window.expenseChartInstance) {
            window.expenseChartInstance.destroy();
        }
    });
}

// ==================== PWA SERVICE WORKER ====================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/static/service-worker.js').catch(err => {
        console.log('ServiceWorker registration failed:', err);
    });
}

// Initialize
initDarkMode();
