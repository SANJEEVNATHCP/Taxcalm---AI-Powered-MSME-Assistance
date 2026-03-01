/**
 * TaxClam Frontend Calculator
 * Handles user input, backend communication, and result display
 */

// ==================== Helper Functions ====================
function formatCurrency(value) {
    if (!value || isNaN(value)) return '₹0';
    const absValue = Math.abs(value);
    return '₹' + absValue.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Quick rate button handler
document.querySelectorAll('.quick-rate').forEach(btn => {
    btn.addEventListener('click', () => {
        const rate = btn.dataset.rate;
        document.getElementById('rate').value = rate;
        // Update visual state
        document.querySelectorAll('.quick-rate').forEach(b => b.classList.remove('ring-2', 'ring-green-500'));
        btn.classList.add('ring-2', 'ring-green-500');
    });
});

// ==================== DOM Elements ====================
const salesInput = document.getElementById('sales');
const purchasesInput = document.getElementById('purchases');
const rateSelect = document.getElementById('rate');
const periodSelect = document.getElementById('period');
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');
const resultsContainer = document.getElementById('resultsContainer');

// Result display elements
const mainMessage = document.getElementById('mainMessage');
const outputGstDisplay = document.getElementById('outputGst');
const inputGstDisplay = document.getElementById('inputGst');
const netGstDisplay = document.getElementById('netGst');
const netGstCardElement = document.getElementById('netGstCard');
const netGstExplain = document.getElementById('netGstExplain');

const warningBox = document.getElementById('warningBox');
const warningText = document.getElementById('warningText');

const explainOutput = document.getElementById('explainOutput');
const explainInput = document.getElementById('explainInput');
const explainNet = document.getElementById('explainNet');

// Debug: Log which elements are missing
if (!mainMessage) console.warn('mainMessage element not found');
if (!warningBox) console.warn('warningBox element not found');
if (!explainOutput) console.warn('explainOutput element not found');

// ==================== Event Listeners ====================
if (calculateBtn) {
    calculateBtn.addEventListener('click', handleCalculate);
}

if (resetBtn) {
    resetBtn.addEventListener('click', handleReset);
}

// Allow Enter key to trigger calculation
[salesInput, purchasesInput, rateSelect, periodSelect].forEach(input => {
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleCalculate();
        });
    }
});

// Add real-time validation for rate input (0-100%)
if (rateSelect) {
    rateSelect.addEventListener('change', () => {
        let value = parseFloat(rateSelect.value);
        if (value < 0) rateSelect.value = 0;
        if (value > 100) rateSelect.value = 100;
    });
}

// ==================== Handler Functions ====================

/**
 * Handle calculate button click
 */
async function handleCalculate() {
    // Get input values
    const sales = salesInput ? (parseFloat(salesInput.value) || 0) : 0;
    const purchases = purchasesInput ? (parseFloat(purchasesInput.value) || 0) : 0;
    const rate = rateSelect ? (parseFloat(rateSelect.value) || 12) : 12;
    const period = periodSelect ? periodSelect.value : 'monthly';

    // Validate inputs
    if (sales < 0 || purchases < 0) {
        alert('Please enter positive values');
        return;
    }

    // Show loading state (optional visual feedback)
    if (calculateBtn) {
        calculateBtn.disabled = true;
        calculateBtn.textContent = '⏳ Calculating...';
    }

    try {
        // Call backend API
        const response = await fetch('/api/gst/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sales: sales,
                purchases: purchases,
                rate: rate,
                period: period
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        console.log('Received data:', data);

        // Display results
        displayResults(data);

    } catch (error) {
        console.error('Error:', error);
        alert('Sorry, something went wrong. Please try again. Make sure the server is running.');
    } finally {
        // Restore button state
        if (calculateBtn) {
            calculateBtn.disabled = false;
            calculateBtn.textContent = '🧮 Calculate Now';
        }
    }
}

/**
 * Handle reset button click
 */
function handleReset() {
    if (salesInput) salesInput.value = '';
    if (purchasesInput) purchasesInput.value = '';
    if (rateSelect) rateSelect.value = '12';
    if (periodSelect) periodSelect.value = 'monthly';
    if (resultsContainer) resultsContainer.classList.add('hidden');
    if (salesInput) salesInput.focus();
}

/**
 * Display results from backend
 */
function displayResults(data) {
    // Update main message (if element exists)
    if (mainMessage) {
        mainMessage.textContent = data.message;
    }

    // Format currency values
    const outputGstFormatted = formatCurrency(data.output_gst);
    const inputGstFormatted = formatCurrency(data.input_gst);
    const netGstFormatted = formatCurrency(Math.abs(data.net_gst));

    // Update result displays
    if (outputGstDisplay) outputGstDisplay.textContent = outputGstFormatted;
    if (inputGstDisplay) inputGstDisplay.textContent = inputGstFormatted;
    if (netGstDisplay) netGstDisplay.textContent = netGstFormatted;

    // Update net GST card styling based on status
    if (netGstCardElement) {
        netGstCardElement.className = 'rounded-lg p-6 border-l-4';

        if (data.status === 'payable') {
            netGstCardElement.className += ' bg-red-50 border-red-500';
            if (netGstDisplay) netGstDisplay.className = 'text-3xl font-bold text-red-600';
            if (netGstExplain) netGstExplain.textContent = 'You need to pay this to the government';
        } else if (data.status === 'refundable') {
            netGstCardElement.className += ' bg-green-50 border-green-500';
            if (netGstDisplay) netGstDisplay.className = 'text-3xl font-bold text-green-600';
            if (netGstExplain) netGstExplain.textContent = 'You may get this as a refund';
        } else {
            netGstCardElement.className += ' bg-blue-50 border-blue-500';
            if (netGstDisplay) netGstDisplay.className = 'text-3xl font-bold text-blue-600';
            if (netGstExplain) netGstExplain.textContent = 'Balanced - no payment or refund needed';
        }
    }

    // Update warning if present
    if (warningBox && warningText) {
        if (data.warning) {
            warningBox.classList.remove('hidden');
            warningText.textContent = data.warning;
        } else {
            warningBox.classList.add('hidden');
        }
    }

    // Update explanation box
    if (explainOutput) explainOutput.textContent = outputGstFormatted;
    if (explainInput) explainInput.textContent = inputGstFormatted;

    if (explainNet) {
        if (data.status === 'payable') {
            explainNet.innerHTML = `<span class="text-red-600">✓ You need to pay <strong>${netGstFormatted}</strong> to the government</span>`;
        } else if (data.status === 'refundable') {
            explainNet.innerHTML = `<span class="text-green-600">✓ You may get <strong>${netGstFormatted}</strong> as a refund</span>`;
        } else {
            explainNet.innerHTML = `<span class="text-blue-600">✓ Your GST is balanced - no payment or refund</span>`;
        }
    }

    // Update audit trail with actual calculation details
    const auditRate = document.getElementById('auditRate');
    const auditRate2 = document.getElementById('auditRate2');
    const auditOutput = document.getElementById('auditOutput');
    const auditInput = document.getElementById('auditInput');
    const auditNet = document.getElementById('auditNet');

    const currentRate = parseFloat(rateSelect.value) || 12;

    if (auditRate) auditRate.textContent = currentRate;
    if (auditRate2) auditRate2.textContent = currentRate;
    if (auditOutput) auditOutput.textContent = outputGstFormatted;
    if (auditInput) auditInput.textContent = inputGstFormatted;
    if (auditNet) auditNet.textContent = netGstFormatted;

    // Show results section
    if (resultsContainer) {
        resultsContainer.classList.remove('hidden');
        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ==================== Initialization ====================

// Focus on sales input on page load for better UX
document.addEventListener('DOMContentLoaded', () => {
    if (salesInput) {
        salesInput.focus();
    }
});
