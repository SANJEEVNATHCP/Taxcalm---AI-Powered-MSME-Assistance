"""
RAG Seed Documents - Pre-loaded Compliance Content
Free, comprehensive compliance guides for Indian businesses
"""

COMPLIANCE_DOCUMENTS = {
    "gst_basics": {
        "title": "GST Registration and Basics",
        "category": "GST",
        "content": """
GST (Goods and Services Tax) Registration in India:

1. WHO NEEDS GST REGISTRATION?
   - Persons with aggregate turnover exceeding Rs. 40 lakhs (20 lakhs for states like NE) in a financial year
   - All persons engaging in inter-state supplies
   - E-commerce operators
   - All businesses are recommended to register regardless of turnover

2. BENEFITS OF GST REGISTRATION:
   - Legal compliance
   - Input Tax Credit (ITC) on purchases
   - Ability to supply across states
   - Access to e-invoicing facilities
   - Credibility with customers and banks

3. DOCUMENTS REQUIRED FOR GST REGISTRATION:
   - PAN card
   - Aadhaar card
   - Business documents (shop establishment registration, partnership deed, etc.)
   - Address proof
   - Bank account details

4. GST REGISTRATION PROCESS:
   - Step 1: Create login on GST portal (gst.gov.in)
   - Step 2: Fill ARN (Application Reference Number)
   - Step 3: Upload required documents
   - Step 4: Application with unique ARN number
   - Step 5: Verification and approval (usually 3-5 days)
   - Step 6: GSTIN issued

5. TYPES OF GST:
   - CGST (Central GST): Collected by central government
   - SGST (State GST): Collected by state government
   - IGST (Integrated GST): On inter-state supplies
   - UTGST (Union Territory GST): In union territories
"""
    },
    
    "gst_rates": {
        "title": "GST Rates and Tax Slabs",
        "category": "GST",
        "content": """
GST Tax Rates in India (Current Rates):

1. ZERO GST RATE (0%):
   - Basic food items (cereals, pulses, milk, etc.)
   - Books and newspapers
   - Contraceptives
   - Precious metals (when exported or used in some cases)

2. 5% GST RATE:
   - Refined food products
   - Simple mobiles phones
   - Footwear (non-leather)
   - Spices and condiments
   - Most services like transportation, restaurants (except AC)

3. 12% GST RATE:
   - Ready-made garments
   - Passenger vehicles (under Rs. 10 lakhs)
   - Cosmetics
   - Air-conditioned restaurants
   - Professional services

4. 18% GST RATE (Most Common):
   - Most consumer goods
   - Packaged foods
   - Electronics and appliances
   - Professional services (legal, consulting)
   - Hotels and accommodations
   - Telecom services

5. 28% GST RATE (Luxury and Sin Goods):
   - Luxury vehicles
   - Tobacco products
   - Aerated beverages
   - High-end cosmetics

6. COMPOSITION SCHEME (special rates):
   - 1% for goods manufacturing (with 0% ITC)
   - 2% for goods manufacturing (with ITC available since certain dates)
   - 5% for traders
   - 6% for service providers
"""
    },
    
    "gst_invoice": {
        "title": "GST Invoice Requirements",
        "category": "GST",
        "content": """
GST Invoice Requirements:

1. MANDATORY INVOICE DETAILS:
   - Tax invoice number and date
   - GSTIN of supplier and recipient
   - Name, address, and phone of supplier and recipient
   - Description of goods/services
   - Quantity and unit price
   - Base amount (before tax)
   - SGST, CGST, or IGST amount
   - Total amount including tax
   - HSN code or SAC code
   - Signature of authorized person

2. E-INVOICING REQUIREMENTS (Mandatory for B2B if turnover > Rs. 500 crores):
   - All invoices must be generated through e-invoicing system
   - IRN (Invoice Reference Number) is mandatory
   - QR code with IRN must be displayed
   - JSON file must be uploaded to e-invoice portal

3. PAYMENT TERMS:
   - Payment due date must be specified
   - Early payment discounts can be mentioned
   - Late payment interest terms (if applicable)

4. INVOICE RETENTION:
   - Invoices must be retained for 6 years
   - Digital copies are acceptable
   - Backup systems must be in place

5. BILL OF SUPPLY (For Unregistered Persons):
   - Used when seller is unregistered or supplies are exempt
   - Contains similar information but no GSTIN of seller
"""
    },
    
    "tds_rules": {
        "title": "TDS (Tax Deducted at Source) Rules",
        "category": "Income Tax",
        "content": """
TDS (Tax Deducted at Source) in India:

1. WHAT IS TDS?
   - Tax deducted by payer from payment made to payee
   - Amount deducted is credited to payee's account
   - Payee is responsible for depositing TDS to government

2. COMMON TDS SECTIONS:
   - Section 194A: On interest (3-5% depending on amount)
   - Section 194C: On payments to contractors (1-2%)
   - Section 194D: On insurance commissions (5%)
   - Section 194H: On commission/brokerage (10%)
   - Section 194J: On professional fees (10%)
   - Section 194LA: On sale of immovable property (1%)
   - Section 194LB: On purchase of immovable property (5%)

3. TDS RATES (for residents):
   - Depends on section and amount
   - Varies from 1% to 20%
   - Different rates for residents and non-residents

4. TDS DEPOSIT TIMELINE:
   - TDS to be deposited within 7 days of month-end
   - Challan (CTR) must be filed within 10 days
   - Statement filing deadline: Various sections have different dates

5. PENALTIES FOR NON-COMPLIANCE:
   - Late TDS deposit: 1% per month
   - Non-filing: Penalties under various sections
   - Interest on delayed deposit

6. OBTAINING TDS CERTIFICATE:
   - Form 16 for employees
   - Form 16A for payments other than salary
   - Certificate should be obtained by 30 June of following year
"""
    },
    
    "income_tax_slabs": {
        "title": "Income Tax Slabs and Deductions",
        "category": "Income Tax",
        "content": """
Income Tax Slabs for Individuals (2023-24):

1. TAX SLABS (Residents):
   - Up to Rs. 2,50,000: 0% (No tax)
   - Rs. 2,50,000 to Rs. 5,00,000: 5% on amount exceeding Rs. 2,50,000
   - Rs. 5,00,000 to Rs. 10,00,000: Rs. 12,500 + 20% on amount exceeding Rs. 5,00,000
   - Above Rs. 10,00,000: Rs. 1,12,500 + 30% on amount exceeding Rs. 10,00,000
   - CESS: 4% on total tax amount

2. SENIOR CITIZENS (Age 60 and above):
   - Up to Rs. 3,00,000: 0% (No tax)
   - Rs. 3,00,000 to Rs. 5,00,000: 5%
   - Above Rs. 5,00,000: Progressive tax

3. SUPER SENIOR CITIZENS (Age 80 and above):
   - Up to Rs. 5,00,000: 0% (No tax)
   - Above Rs. 5,00,000: Progressive tax

4. DEDUCTIONS UNDER SECTION 80:
   - Section 80C: LIC, post office deposits, tuition fees (up to Rs. 1,50,000)
   - Section 80D: Medical insurance premium (Rs. 25,000-50,000)
   - Section 80E: Interest on education loan (no limit)
   - Section 80G: Donations to charitable trusts (50% or 100%)
   - Section 80TTA: Interest on savings account (up to Rs. 10,000)

5. STANDARD DEDUCTION:
   - Individuals: Rs. 50,000
   - Senior citizens: Rs. 50,000
   - Super senior citizens: Rs. 50,000
"""
    },
    
    "labor_laws": {
        "title": "Key Labor Laws for Employers",
        "category": "Labor Compliance",
        "content": """
Important Labor Laws for Indian Employers:

1. MINIMUM WAGE REQUIREMENTS:
   - Wage must meet minimum wage notified by government
   - Varies by state and industry
   - Minimum wage revised annually

2. WORKING HOURS:
   - Maximum 8 hours per day, 40 hours per week
   - Rest periods mandatory
   - Overtime wages at double rate or as per agreement

3. LEAVES ENTITLEMENT:
   - Casual leave: 10-15 days per year
   - Earned leave: 15-30 days per year (varies by tenure)
   - Sick leave: 7 days per year
   - Festival holidays: As per applicable laws
   - Maternity benefit for women: 6 weeks before, 8 weeks after delivery

4. PROVIDENT FUND (PF):
   - Applicable to establishments with 20+ employees
   - Employee contribution: 12% of basic + DA
   - Employer contribution: 12% of basic + DA
   - Employer also contributes 3.67% for insurance

5. GRATUITY:
   - Payable to employees with 5+ years of continuous service
   - Amount: (Last drawn monthly wages × 15 × working years) / 26
   - Maximum amount: Rs. 20 lakhs

6. EMPLOYEE STATE INSURANCE (ESI):
   - For non-seasonal factories with 10+ employees
   - Employee contribution: 0.75% of wages
   - Employer contribution: 3% of wages
   - Provides medical and disability benefits

7. COMPLIANCE REQUIREMENTS:
   - Maintain employee records
   - Register with relevant authorities
   - File quarterly and annual returns
   - Conduct safety audits
   - Maintain accident register
"""
    },
    
    "compliance_checklist": {
        "title": "MSME Compliance Checklist",
        "category": "Compliance",
        "content": """
Annual MSME Compliance Checklist:

1. GST COMPLIANCE:
   - ✓ GST return filing (monthly or quarterly)
   - ✓ Invoice maintenance and documentation
   - ✓ Input Tax Credit reconciliation
   - ✓ E-invoicing (if applicable)
   - ✓ Annual reconciliation

2. INCOME TAX COMPLIANCE:
   - ✓ TDS deposit and Form 16A filing
   - ✓ Quarterly advance tax payment
   - ✓ Annual income tax return filing
   - ✓ Audit (if turnover exceeds Rs. 2 crores)
   - ✓ Form 26AS reconciliation

3. LABOR LAW COMPLIANCE:
   - ✓ Minimum wage compliance
   - ✓ PF and ESI deposits
   - ✓ Leave and salary records
   - ✓ Safety compliance
   - ✓ Annual returns filing

4. FINANCIAL COMPLIANCE:
   - ✓ Accounting records maintenance
   - ✓ Bank reconciliation
   - ✓ Balance sheet preparation
   - ✓ Profit and loss statement
   - ✓ Statutory audits (if required)

5. REGISTRATION UPDATES:
   - ✓ Business registration renewal
   - ✓ License renewals
   - ✓ Shop Act registration
   - ✓ Pollution control certificate (if applicable)
   - ✓ Fire safety certificate

6. DOCUMENTATION:
   - ✓ Invoices and receipts
   - ✓ Bank statements
   - ✓ Employee records
   - ✓ Purchase orders and contracts
   - ✓ Audit reports

FREQUENCY: Review monthly, complete annually by March 31st
"""
    },
    
    "finance_operations": {
        "title": "AI Assistant Finance Operations Guide",
        "category": "Finance",
        "content": """
AI ASSISTANT - AVAILABLE FINANCE OPERATIONS AND COMMANDS

This guide shows what natural language commands you can use with the AI assistant to manage your finances.

═══════════════════════════════════════════════════════════════

1. TRANSACTION MANAGEMENT

Add Expense:
- Natural commands: "add expense of 5000 for rent", "record office rent 5000 rupees", "spent 2500 on utilities"
- Action: add_expense
- Parameters: amount, category, description, date, payment_mode
- Example: "I paid 15000 rent for March by bank transfer"
- Result: Creates expense transaction in accounting

Add Income:
- Natural commands: "add income 50000 from sales", "received 25000 payment", "got 10000 consulting fee"
- Action: add_income  
- Parameters: amount, category, description, date, payment_mode
- Example: "Received 75000 from client payment via NEFT"
- Result: Creates income transaction

View Transactions:
- Natural commands: "show my expenses", "list all transactions", "view income this month"
- Action: view_transactions
- Parameters: type (Income/Expense), category, start_date, end_date
- Example: "Show me all rent expenses this year"
- Result: Displays transaction list with totals

Update Transaction:
- Natural commands: "update transaction 5", "change amount of transaction 10 to 6000"
- Action: update_transaction
- Parameters: id, amount, category, description, date
- Example: "Update transaction 3 to 5500 rupees"
- Result: Modifies existing transaction

Delete Transaction:
- Natural commands: "delete transaction 8", "remove entry number 12"
- Action: delete_transaction
- Parameters: id
- Example: "Delete transaction 15"
- Result: Removes transaction from records

═══════════════════════════════════════════════════════════════

2. GST OPERATIONS

Register GST:
- Natural commands: "register my business for GST", "update GST registration"
- Action: register_gst
- Parameters: gstin, legal_name, business_type, state, address
- Example: "Register GST for ABC Traders, proprietorship in Maharashtra"
- Result: Creates/updates GST registration details

File GST Return:
- Natural commands: "file GSTR-3B", "submit GST return for January", "file monthly GST"
- Action: file_gst_return
- Parameters: return_type, month, year, sales, purchases, cgst, sgst, igst
- Example: "File GSTR-3B for February 2026 with sales 200000 and purchases 150000"
- Result: Creates filed GST return record

View GST Returns:
- Natural commands: "show GST returns", "list my filed returns", "view GST history"
- Action: view_gst_returns
- Example: "Show me all GST returns"
- Result: Displays GST return filing history

═══════════════════════════════════════════════════════════════

3. INCOME TAX OPERATIONS

Add Income Source:
- Natural commands: "add business income 500000", "record salary income 720000"
- Action: add_income_source
- Parameters: source_type, source_name, amount, tax_year
- Example: "Add business income 850000 for FY 2025-26"
- Result: Adds income source for tax calculation

Add Tax Deduction:
- Natural commands: "add 80C deduction 150000", "claim deduction under 80D for 25000"
- Action: add_deduction
- Parameters: section, description, amount, tax_year
- Example: "Add 80C deduction 150000 for LIC premium"
- Result: Records tax deduction

Calculate Tax:
- Natural commands: "calculate my tax", "compute income tax", "show tax liability"
- Action: calculate_tax
- Parameters: tax_year, regime (old/new)
- Example: "Calculate tax for 2025-26 under new regime"
- Result: Computes total tax liability

View Tax Profile:
- Natural commands: "show tax profile", "view my tax details"
- Action: view_tax_profile
- Example: "Show me my tax profile"
- Result: Displays taxpayer profile and details

═══════════════════════════════════════════════════════════════

4. PAYROLL OPERATIONS

Add Employee:
- Natural commands: "add employee John Sharma", "register new staff member"
- Action: add_employee
- Parameters: employee_code, name, designation, pan, uan, date_of_joining
- Example: "Add employee Raj Kumar as Manager, PAN ABCDE1234F"
- Result: Creates employee record

Generate Payroll:
- Natural commands: "generate payroll for January", "process salary for this month"
- Action: generate_payroll
- Parameters: month, year
- Example: "Generate payroll for February 2026"
- Result: Processes monthly payroll

View Payroll:
- Natural commands: "show January payroll", "view salary sheet"
- Action: view_payroll
- Parameters: month, year
- Example: "Show payroll for December 2025"
- Result: Displays payroll details

═══════════════════════════════════════════════════════════════

5. FINANCIAL REPORTS

View Profit & Loss:
- Natural commands: "show profit and loss", "P&L report", "what's my profit?"
- Action: view_profit_loss
- Parameters: start_date, end_date
- Example: "Show profit and loss for last quarter"
- Result: Displays P&L statement with net profit/loss

View Balance Sheet:
- Natural commands: "show balance sheet", "view financial position"
- Action: view_balance_sheet
- Example: "Show me the balance sheet"
- Result: Displays assets, liabilities, and equity

View Cash Flow:
- Natural commands: "cash flow statement", "show cash movement"
- Action: view_cash_flow
- Parameters: start_date, end_date
- Example: "Show cash flow for last 6 months"
- Result: Displays cash inflow and outflow

View Dashboard:
- Natural commands: "show dashboard", "financial summary", "quick overview"
- Action: view_dashboard_summary
- Example: "Show me the finance dashboard"
- Result: Displays key financial metrics

═══════════════════════════════════════════════════════════════

6. NAVIGATION COMMANDS

Available Navigation Targets:
- dashboard: "go to dashboard", "show main page"
- expenses: "open expenses", "show transactions", "view expenses page"
- reports: "go to reports", "show financial reports", "open reports section"
- profile: "show profile", "my settings"
- next_page: "next", "go forward", "next page"
- previous_page: "previous", "go back", "previous page"

Navigation Action: navigate
Example Commands:
- "Take me to the expenses page"
- "Show the dashboard"
- "Go to financial reports"
- "Next page please"

═══════════════════════════════════════════════════════════════

7. AGENT MODES

SAFE MODE (Default):
- All write operations (add, update, delete) require user confirmation
- Read operations execute immediately
- User sees action preview before execution
- Recommended for most users

AUTO MODE:
- All operations execute automatically without confirmation
- Faster but requires trust in AI accuracy
- Only use if comfortable with automated actions
- Can be changed in settings

To change mode: "Switch to auto mode" or "Enable safe mode"

═══════════════════════════════════════════════════════════════

8. TIPS FOR EFFECTIVE USE

✓ Be specific with amounts and dates
✓ Mention categories clearly (rent, utilities, sales, etc.)
✓ Include payment mode if important (cash, bank, UPI)
✓ Use natural language - the AI understands context
✓ Check confirmation dialogs carefully in safe mode
✓ Review transaction lists regularly

Examples of complete commands:
- "Add expense of 5000 rupees for office rent paid on 15th March by NEFT"
- "Show me all utility expenses from January to March 2026"
- "File GSTR-3B for February with sales 250000, purchases 180000, CGST 4500, SGST 4500"
- "Calculate my income tax for 2025-26 under new tax regime"
- "Generate payroll for all employees for January 2026"

═══════════════════════════════════════════════════════════════

ALLOWED ACTIONS LIST:
navigate, add_expense, add_income, view_transactions, update_transaction, delete_transaction, 
register_gst, file_gst_return, view_gst_returns, add_income_source, add_deduction, 
calculate_tax, view_tax_profile, add_employee, generate_payroll, view_payroll, 
view_profit_loss, view_balance_sheet, view_cash_flow, view_dashboard_summary
"""
    }
}


def get_seed_documents():
    """Return all seed compliance documents"""
    return COMPLIANCE_DOCUMENTS


def get_document_by_key(key: str):
    """Get specific document by key"""
    return COMPLIANCE_DOCUMENTS.get(key)


def get_documents_by_category(category: str):
    """Get all documents in a category"""
    return {k: v for k, v in COMPLIANCE_DOCUMENTS.items() if v.get("category") == category}
