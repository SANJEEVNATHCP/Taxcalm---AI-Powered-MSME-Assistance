"""
Finance & Compliance Module - Flask Routes
API endpoints for Accounting, GST, Income Tax, Payroll, and Reports
"""

from flask import Blueprint, jsonify, request
from datetime import datetime
import traceback
from app.finance_models import get_db_connection
import io
import json
from app.google_meet import get_google_meet

# Create Blueprint for finance routes
finance_bp = Blueprint('finance', __name__, url_prefix='/api/finance')

# ==================== UTILITY FUNCTIONS ====================

def get_current_timestamp():
    """Get current timestamp in ISO format"""
    return datetime.now().isoformat()

def validate_required_fields(data, required_fields):
    """Validate required fields in request data"""
    missing = [field for field in required_fields if field not in data or data[field] == '']
    if missing:
        return False, f"Missing required fields: {', '.join(missing)}"
    return True, None

# ==================== ACCOUNTING & BOOKKEEPING ROUTES ====================

@finance_bp.route('/transactions', methods=['GET'])
def get_transactions():
    """Get all transactions with optional filters"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get query parameters
        transaction_type = request.args.get('type')
        category = request.args.get('category')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Build query
        query = 'SELECT * FROM transactions WHERE 1=1'
        params = []
        
        if transaction_type:
            query += ' AND type = ?'
            params.append(transaction_type)
        
        if category:
            query += ' AND category = ?'
            params.append(category)
        
        if start_date:
            query += ' AND transaction_date >= ?'
            params.append(start_date)
        
        if end_date:
            query += ' AND transaction_date <= ?'
            params.append(end_date)
        
        query += ' ORDER BY transaction_date DESC'
        
        cursor.execute(query, params)
        transactions = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({
            'success': True,
            'data': transactions,
            'count': len(transactions)
        }), 200
        
    except Exception as e:
        print(f"Error fetching transactions: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/transactions', methods=['POST'])
def create_transaction():
    """Create a new transaction"""
    try:
        data = request.json
        
        # Validate required fields
        required = ['transaction_date', 'type', 'category', 'amount']
        valid, error = validate_required_fields(data, required)
        if not valid:
            return jsonify({'success': False, 'error': error}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        timestamp = get_current_timestamp()
        
        cursor.execute('''
            INSERT INTO transactions 
            (transaction_date, type, category, amount, description, reference_number, 
             payment_mode, user_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['transaction_date'],
            data['type'],
            data['category'],
            float(data['amount']),
            data.get('description', ''),
            data.get('reference_number', ''),
            data.get('payment_mode', ''),
            data.get('user_id', 1),
            timestamp,
            timestamp
        ))
        
        transaction_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Transaction created successfully',
            'transaction_id': transaction_id
        }), 201
        
    except Exception as e:
        print(f"Error creating transaction: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/transactions/<int:transaction_id>', methods=['PUT'])
def update_transaction(transaction_id):
    """Update an existing transaction"""
    try:
        data = request.json
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build update query dynamically
        update_fields = []
        params = []
        
        allowed_fields = ['transaction_date', 'type', 'category', 'amount', 
                         'description', 'reference_number', 'payment_mode']
        
        for field in allowed_fields:
            if field in data:
                update_fields.append(f'{field} = ?')
                params.append(data[field])
        
        if not update_fields:
            return jsonify({'success': False, 'error': 'No fields to update'}), 400
        
        update_fields.append('updated_at = ?')
        params.append(get_current_timestamp())
        params.append(transaction_id)
        
        query = f"UPDATE transactions SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(query, params)
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Transaction updated successfully'
        }), 200
        
    except Exception as e:
        print(f"Error updating transaction: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    """Delete a transaction"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM transactions WHERE id = ?', (transaction_id,))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'success': False, 'error': 'Transaction not found'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Transaction deleted successfully'
        }), 200
        
    except Exception as e:
        print(f"Error deleting transaction: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    """Get dashboard summary with income, expenses, assets, and liabilities"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get date range (default: current month)
        year = int(request.args.get('year', datetime.now().year))
        month = int(request.args.get('month', datetime.now().month))
        
        # Calculate total income
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) as total 
            FROM transactions 
            WHERE type = 'Income' 
            AND strftime('%Y', transaction_date) = ? 
            AND strftime('%m', transaction_date) = ?
        ''', (str(year), f'{int(month):02d}'))
        total_income = cursor.fetchone()['total']
        
        # Calculate total expenses
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) as total 
            FROM transactions 
            WHERE type = 'Expense' 
            AND strftime('%Y', transaction_date) = ? 
            AND strftime('%m', transaction_date) = ?
        ''', (str(year), f'{int(month):02d}'))
        total_expenses = cursor.fetchone()['total']
        
        # Get account balances
        cursor.execute('''
            SELECT account_type, COALESCE(SUM(balance), 0) as total 
            FROM accounts 
            GROUP BY account_type
        ''')
        accounts = {row['account_type']: row['total'] for row in cursor.fetchall()}
        
        # Get category breakdown
        cursor.execute('''
            SELECT category, type, COALESCE(SUM(amount), 0) as total 
            FROM transactions 
            WHERE strftime('%Y', transaction_date) = ? 
            AND strftime('%m', transaction_date) = ?
            GROUP BY category, type
        ''', (str(year), f'{int(month):02d}'))
        categories = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'period': f'{year}-{month:02d}',
                'total_income': round(total_income, 2),
                'total_expenses': round(total_expenses, 2),
                'net_balance': round(total_income - total_expenses, 2),
                'assets': round(accounts.get('Asset', 0), 2),
                'liabilities': round(accounts.get('Liability', 0), 2),
                'categories': categories
            }
        }), 200
        
    except Exception as e:
        print(f"Error fetching dashboard summary: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== GST FILING ROUTES ====================

@finance_bp.route('/gst/registration', methods=['GET'])
def get_gst_registration():
    """Get GST registration details"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM gst_registration LIMIT 1')
        registration = cursor.fetchone()
        conn.close()
        
        if registration:
            return jsonify({
                'success': True,
                'data': dict(registration)
            }), 200
        else:
            return jsonify({
                'success': True,
                'data': None,
                'message': 'No registration found'
            }), 200
        
    except Exception as e:
        print(f"Error fetching GST registration: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/gst/registration', methods=['POST'])
def create_gst_registration():
    """Create or update GST registration"""
    try:
        data = request.json
        
        required = ['gstin', 'legal_name', 'business_type', 'registration_date', 'state', 'address']
        valid, error = validate_required_fields(data, required)
        if not valid:
            return jsonify({'success': False, 'error': error}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        timestamp = get_current_timestamp()
        
        # Check if registration exists
        cursor.execute('SELECT id FROM gst_registration WHERE gstin = ?', (data['gstin'],))
        existing = cursor.fetchone()
        
        if existing:
            # Update existing
            cursor.execute('''
                UPDATE gst_registration 
                SET legal_name=?, trade_name=?, business_type=?, registration_date=?, 
                    state=?, address=?, email=?, phone=?, updated_at=?
                WHERE gstin=?
            ''', (
                data['legal_name'],
                data.get('trade_name', ''),
                data['business_type'],
                data['registration_date'],
                data['state'],
                data['address'],
                data.get('email', ''),
                data.get('phone', ''),
                timestamp,
                data['gstin']
            ))
            message = 'GST registration updated successfully'
        else:
            # Insert new
            cursor.execute('''
                INSERT INTO gst_registration 
                (gstin, legal_name, trade_name, business_type, registration_date, 
                 state, address, email, phone, user_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data['gstin'],
                data['legal_name'],
                data.get('trade_name', ''),
                data['business_type'],
                data['registration_date'],
                data['state'],
                data['address'],
                data.get('email', ''),
                data.get('phone', ''),
                data.get('user_id', 1),
                timestamp,
                timestamp
            ))
            message = 'GST registration created successfully'
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': message
        }), 201
        
    except Exception as e:
        print(f"Error creating GST registration: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/gst/returns', methods=['GET'])
def get_gst_returns():
    """Get all GST returns"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM gst_returns ORDER BY period_year DESC, period_month DESC')
        returns = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({
            'success': True,
            'data': returns,
            'count': len(returns)
        }), 200
        
    except Exception as e:
        print(f"Error fetching GST returns: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/gst/returns', methods=['POST'])
def create_gst_return():
    """Create a new GST return"""
    try:
        data = request.json
        
        required = ['return_type', 'period_month', 'period_year', 'total_sales', 'total_purchases']
        valid, error = validate_required_fields(data, required)
        if not valid:
            return jsonify({'success': False, 'error': error}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Calculate GST amounts
        total_sales = float(data['total_sales'])
        total_purchases = float(data['total_purchases'])
        
        # Default GST rate: 18% (9% CGST + 9% SGST)
        gst_rate = data.get('gst_rate', 18) / 100
        
        output_gst = total_sales * gst_rate
        input_gst = total_purchases * gst_rate
        
        # For intra-state: CGST + SGST
        # For inter-state: IGST
        is_interstate = data.get('is_interstate', False)
        
        if is_interstate:
            cgst = 0
            sgst = 0
            igst = output_gst - input_gst
        else:
            cgst = (output_gst - input_gst) / 2
            sgst = (output_gst - input_gst) / 2
            igst = 0
        
        total_gst = cgst + sgst + igst
        
        timestamp = get_current_timestamp()
        
        cursor.execute('''
            INSERT INTO gst_returns 
            (return_type, period_month, period_year, total_sales, total_purchases,
             cgst, sgst, igst, total_gst, status, user_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['return_type'],
            int(data['period_month']),
            int(data['period_year']),
            total_sales,
            total_purchases,
            round(cgst, 2),
            round(sgst, 2),
            round(igst, 2),
            round(total_gst, 2),
            'Draft',
            data.get('user_id', 1),
            timestamp,
            timestamp
        ))
        
        return_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'GST return created successfully',
            'return_id': return_id,
            'calculations': {
                'cgst': round(cgst, 2),
                'sgst': round(sgst, 2),
                'igst': round(igst, 2),
                'total_gst': round(total_gst, 2)
            }
        }), 201
        
    except Exception as e:
        print(f"Error creating GST return: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/gst/returns/<int:return_id>', methods=['PUT'])
def update_gst_return(return_id):
    """Update GST return status"""
    try:
        data = request.json
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        update_fields = []
        params = []
        
        if 'status' in data:
            update_fields.append('status = ?')
            params.append(data['status'])
            
            if data['status'] == 'Filed':
                update_fields.append('filed_date = ?')
                params.append(get_current_timestamp())
                
                if 'acknowledgment_number' in data:
                    update_fields.append('acknowledgment_number = ?')
                    params.append(data['acknowledgment_number'])
        
        if not update_fields:
            return jsonify({'success': False, 'error': 'No fields to update'}), 400
        
        update_fields.append('updated_at = ?')
        params.append(get_current_timestamp())
        params.append(return_id)
        
        query = f"UPDATE gst_returns SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(query, params)
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'GST return updated successfully'
        }), 200
        
    except Exception as e:
        print(f"Error updating GST return: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== INCOME TAX FILING ROUTES ====================

@finance_bp.route('/tax/profile', methods=['GET'])
def get_tax_profile():
    """Get tax profile"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM tax_profile LIMIT 1')
        profile = cursor.fetchone()
        conn.close()
        
        if profile:
            return jsonify({
                'success': True,
                'data': dict(profile)
            }), 200
        else:
            return jsonify({
                'success': True,
                'data': None,
                'message': 'No tax profile found'
            }), 200
        
    except Exception as e:
        print(f"Error fetching tax profile: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/tax/profile', methods=['POST'])
def create_tax_profile():
    """Create or update tax profile"""
    try:
        data = request.json
        
        required = ['taxpayer_type', 'pan_number', 'name']
        valid, error = validate_required_fields(data, required)
        if not valid:
            return jsonify({'success': False, 'error': error}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        timestamp = get_current_timestamp()
        
        # Check if profile exists
        cursor.execute('SELECT id FROM tax_profile WHERE pan_number = ?', (data['pan_number'],))
        existing = cursor.fetchone()
        
        if existing:
            # Update existing
            cursor.execute('''
                UPDATE tax_profile 
                SET taxpayer_type=?, name=?, dob=?, address=?, email=?, phone=?, updated_at=?
                WHERE pan_number=?
            ''', (
                data['taxpayer_type'],
                data['name'],
                data.get('dob', ''),
                data.get('address', ''),
                data.get('email', ''),
                data.get('phone', ''),
                timestamp,
                data['pan_number']
            ))
            message = 'Tax profile updated successfully'
        else:
            # Insert new
            cursor.execute('''
                INSERT INTO tax_profile 
                (taxpayer_type, pan_number, name, dob, address, email, phone, user_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data['taxpayer_type'],
                data['pan_number'],
                data['name'],
                data.get('dob', ''),
                data.get('address', ''),
                data.get('email', ''),
                data.get('phone', ''),
                data.get('user_id', 1),
                timestamp,
                timestamp
            ))
            message = 'Tax profile created successfully'
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': message
        }), 201
        
    except Exception as e:
        print(f"Error creating tax profile: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/tax/income-sources', methods=['POST'])
def add_income_source():
    """Add income source"""
    try:
        data = request.json
        
        required = ['assessment_year', 'income_type', 'amount']
        valid, error = validate_required_fields(data, required)
        if not valid:
            return jsonify({'success': False, 'error': error}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        timestamp = get_current_timestamp()
        
        cursor.execute('''
            INSERT INTO income_sources 
            (assessment_year, income_type, amount, description, tax_profile_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['assessment_year'],
            data['income_type'],
            float(data['amount']),
            data.get('description', ''),
            data.get('tax_profile_id', 1),
            timestamp,
            timestamp
        ))
        
        income_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Income source added successfully',
            'income_id': income_id
        }), 201
        
    except Exception as e:
        print(f"Error adding income source: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/tax/deductions', methods=['POST'])
def add_deduction():
    """Add tax deduction"""
    try:
        data = request.json
        
        required = ['assessment_year', 'section', 'amount']
        valid, error = validate_required_fields(data, required)
        if not valid:
            return jsonify({'success': False, 'error': error}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        timestamp = get_current_timestamp()
        
        cursor.execute('''
            INSERT INTO tax_deductions 
            (assessment_year, section, amount, description, tax_profile_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['assessment_year'],
            data['section'],
            float(data['amount']),
            data.get('description', ''),
            data.get('tax_profile_id', 1),
            timestamp,
            timestamp
        ))
        
        deduction_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Deduction added successfully',
            'deduction_id': deduction_id
        }), 201
        
    except Exception as e:
        print(f"Error adding deduction: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/tax/calculate', methods=['POST'])
def calculate_tax():
    """Calculate income tax"""
    try:
        data = request.json
        
        assessment_year = data.get('assessment_year')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get total income
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) as total 
            FROM income_sources 
            WHERE assessment_year = ?
        ''', (assessment_year,))
        total_income = cursor.fetchone()['total']
        
        # Get total deductions
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) as total 
            FROM tax_deductions 
            WHERE assessment_year = ?
        ''', (assessment_year,))
        total_deductions = cursor.fetchone()['total']
        
        conn.close()
        
        # Calculate taxable income
        taxable_income = max(0, total_income - total_deductions)
        
        # Simple tax calculation (Indian tax slabs for individuals - FY 2023-24)
        tax_payable = 0
        
        if taxable_income <= 250000:
            tax_payable = 0
        elif taxable_income <= 500000:
            tax_payable = (taxable_income - 250000) * 0.05
        elif taxable_income <= 750000:
            tax_payable = 12500 + (taxable_income - 500000) * 0.10
        elif taxable_income <= 1000000:
            tax_payable = 37500 + (taxable_income - 750000) * 0.15
        elif taxable_income <= 1250000:
            tax_payable = 75000 + (taxable_income - 1000000) * 0.20
        elif taxable_income <= 1500000:
            tax_payable = 125000 + (taxable_income - 1250000) * 0.25
        else:
            tax_payable = 187500 + (taxable_income - 1500000) * 0.30
        
        # Add 4% cess
        total_tax = tax_payable * 1.04
        
        return jsonify({
            'success': True,
            'data': {
                'total_income': round(total_income, 2),
                'total_deductions': round(total_deductions, 2),
                'taxable_income': round(taxable_income, 2),
                'tax_payable': round(tax_payable, 2),
                'cess': round(tax_payable * 0.04, 2),
                'total_tax': round(total_tax, 2)
            }
        }), 200
        
    except Exception as e:
        print(f"Error calculating tax: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== PAYROLL & TDS ROUTES ====================

@finance_bp.route('/payroll/employees', methods=['GET'])
def get_employees():
    """Get all employees"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM employees ORDER BY name')
        employees = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({
            'success': True,
            'data': employees,
            'count': len(employees)
        }), 200
        
    except Exception as e:
        print(f"Error fetching employees: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/payroll/employees', methods=['POST'])
def create_employee():
    """Create a new employee"""
    try:
        data = request.json
        
        required = ['employee_code', 'name', 'date_of_joining']
        valid, error = validate_required_fields(data, required)
        if not valid:
            return jsonify({'success': False, 'error': error}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        timestamp = get_current_timestamp()
        
        cursor.execute('''
            INSERT INTO employees 
            (employee_code, name, email, phone, designation, department, date_of_joining,
             pan_number, uan_number, bank_account, ifsc_code, status, user_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['employee_code'],
            data['name'],
            data.get('email', ''),
            data.get('phone', ''),
            data.get('designation', ''),
            data.get('department', ''),
            data['date_of_joining'],
            data.get('pan_number', ''),
            data.get('uan_number', ''),
            data.get('bank_account', ''),
            data.get('ifsc_code', ''),
            'Active',
            data.get('user_id', 1),
            timestamp,
            timestamp
        ))
        
        employee_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Employee created successfully',
            'employee_id': employee_id
        }), 201
        
    except Exception as e:
        print(f"Error creating employee: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/payroll/salary-structure', methods=['POST'])
def create_salary_structure():
    """Create salary structure for an employee"""
    try:
        data = request.json
        
        required = ['employee_id', 'basic_salary', 'effective_from']
        valid, error = validate_required_fields(data, required)
        if not valid:
            return jsonify({'success': False, 'error': error}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        timestamp = get_current_timestamp()
        
        cursor.execute('''
            INSERT INTO salary_structure 
            (employee_id, basic_salary, hra, special_allowance, other_allowances,
             pf_deduction, professional_tax, tds_rate, effective_from, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            int(data['employee_id']),
            float(data['basic_salary']),
            float(data.get('hra', 0)),
            float(data.get('special_allowance', 0)),
            float(data.get('other_allowances', 0)),
            float(data.get('pf_deduction', 0)),
            float(data.get('professional_tax', 0)),
            float(data.get('tds_rate', 0)),
            data['effective_from'],
            timestamp,
            timestamp
        ))
        
        structure_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Salary structure created successfully',
            'structure_id': structure_id
        }), 201
        
    except Exception as e:
        print(f"Error creating salary structure: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/payroll/generate', methods=['POST'])
def generate_payroll():
    """Generate payroll for a month"""
    try:
        data = request.json
        
        required = ['month', 'year']
        valid, error = validate_required_fields(data, required)
        if not valid:
            return jsonify({'success': False, 'error': error}), 400
        
        month = int(data['month'])
        year = int(data['year'])
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all active employees with salary structure
        cursor.execute('''
            SELECT e.id, e.name, s.basic_salary, s.hra, s.special_allowance, 
                   s.other_allowances, s.pf_deduction, s.professional_tax, s.tds_rate
            FROM employees e
            JOIN salary_structure s ON e.id = s.employee_id
            WHERE e.status = 'Active'
            AND s.effective_from <= date('now')
            ORDER BY s.effective_from DESC
        ''')
        
        employees = cursor.fetchall()
        timestamp = get_current_timestamp()
        payroll_created = []
        
        for emp in employees:
            # Calculate gross salary
            gross_salary = (emp['basic_salary'] + emp['hra'] + 
                          emp['special_allowance'] + emp['other_allowances'])
            
            # Calculate deductions
            pf = emp['pf_deduction']
            pt = emp['professional_tax']
            tds = gross_salary * (emp['tds_rate'] / 100)
            total_deductions = pf + pt + tds
            
            # Calculate net salary
            net_salary = gross_salary - total_deductions
            
            # Insert payroll record
            cursor.execute('''
                INSERT INTO payroll 
                (employee_id, month, year, gross_salary, deductions, tds, net_salary,
                 status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                emp['id'],
                month,
                year,
                round(gross_salary, 2),
                round(total_deductions, 2),
                round(tds, 2),
                round(net_salary, 2),
                'Pending',
                timestamp,
                timestamp
            ))
            
            payroll_created.append({
                'employee_id': emp['id'],
                'employee_name': emp['name'],
                'net_salary': round(net_salary, 2)
            })
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Payroll generated for {len(payroll_created)} employees',
            'data': payroll_created
        }), 201
        
    except Exception as e:
        print(f"Error generating payroll: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/payroll/<int:month>/<int:year>', methods=['GET'])
def get_payroll(month, year):
    """Get payroll for a specific month"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT p.*, e.name, e.employee_code
            FROM payroll p
            JOIN employees e ON p.employee_id = e.id
            WHERE p.month = ? AND p.year = ?
            ORDER BY e.name
        ''', (month, year))
        
        payroll = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({
            'success': True,
            'data': payroll,
            'count': len(payroll)
        }), 200
        
    except Exception as e:
        print(f"Error fetching payroll: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== FINANCIAL REPORTS ROUTES ====================

@finance_bp.route('/reports/profit-loss', methods=['GET'])
def get_profit_loss():
    """Generate Profit & Loss statement"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get total income
        cursor.execute('''
            SELECT category, SUM(amount) as total
            FROM transactions
            WHERE type = 'Income'
            AND transaction_date BETWEEN ? AND ?
            GROUP BY category
        ''', (start_date, end_date))
        
        income_items = [{'category': row['category'], 'amount': row['total']} 
                       for row in cursor.fetchall()]
        total_income = sum(item['amount'] for item in income_items)
        
        # Get total expenses
        cursor.execute('''
            SELECT category, SUM(amount) as total
            FROM transactions
            WHERE type = 'Expense'
            AND transaction_date BETWEEN ? AND ?
            GROUP BY category
        ''', (start_date, end_date))
        
        expense_items = [{'category': row['category'], 'amount': row['total']} 
                        for row in cursor.fetchall()]
        total_expenses = sum(item['amount'] for item in expense_items)
        
        conn.close()
        
        net_profit = total_income - total_expenses
        
        return jsonify({
            'success': True,
            'data': {
                'period': f'{start_date} to {end_date}',
                'income': {
                    'items': income_items,
                    'total': round(total_income, 2)
                },
                'expenses': {
                    'items': expense_items,
                    'total': round(total_expenses, 2)
                },
                'net_profit': round(net_profit, 2)
            }
        }), 200
        
    except Exception as e:
        print(f"Error generating P&L report: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/reports/balance-sheet', methods=['GET'])
def get_balance_sheet():
    """Generate Balance Sheet"""
    try:
        as_of_date = request.args.get('as_of_date', datetime.now().strftime('%Y-%m-%d'))
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get assets
        cursor.execute('''
            SELECT account_name, balance
            FROM accounts
            WHERE account_type = 'Asset'
        ''')
        assets = [{'name': row['account_name'], 'amount': row['balance']} 
                 for row in cursor.fetchall()]
        total_assets = sum(asset['amount'] for asset in assets)
        
        # Get liabilities
        cursor.execute('''
            SELECT account_name, balance
            FROM accounts
            WHERE account_type = 'Liability'
        ''')
        liabilities = [{'name': row['account_name'], 'amount': row['balance']} 
                      for row in cursor.fetchall()]
        total_liabilities = sum(liability['amount'] for liability in liabilities)
        
        conn.close()
        
        # Calculate equity
        equity = total_assets - total_liabilities
        
        return jsonify({
            'success': True,
            'data': {
                'as_of_date': as_of_date,
                'assets': {
                    'items': assets,
                    'total': round(total_assets, 2)
                },
                'liabilities': {
                    'items': liabilities,
                    'total': round(total_liabilities, 2)
                },
                'equity': round(equity, 2)
            }
        }), 200
        
    except Exception as e:
        print(f"Error generating balance sheet: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/reports/cash-flow', methods=['GET'])
def get_cash_flow():
    """Generate Cash Flow statement"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Operating activities (income and expenses)
        cursor.execute('''
            SELECT type, SUM(amount) as total
            FROM transactions
            WHERE transaction_date BETWEEN ? AND ?
            GROUP BY type
        ''', (start_date, end_date))
        
        operating = {}
        for row in cursor.fetchall():
            operating[row['type']] = row['total']
        
        operating_cash_flow = operating.get('Income', 0) - operating.get('Expense', 0)
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'period': f'{start_date} to {end_date}',
                'operating_activities': {
                    'cash_inflow': round(operating.get('Income', 0), 2),
                    'cash_outflow': round(operating.get('Expense', 0), 2),
                    'net_cash': round(operating_cash_flow, 2)
                },
                'investing_activities': {
                    'net_cash': 0
                },
                'financing_activities': {
                    'net_cash': 0
                },
                'net_change_in_cash': round(operating_cash_flow, 2)
            }
        }), 200
        
    except Exception as e:
        print(f"Error generating cash flow statement: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== CAA MEETINGS ROUTES ====================

@finance_bp.route('/caa-meetings', methods=['GET'])
def get_caa_meetings():
    """Get all CAA meetings"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        status = request.args.get('status')
        
        query = 'SELECT * FROM caa_meetings'
        params = []
        
        if status:
            query += ' WHERE status = ?'
            params.append(status)
        
        query += ' ORDER BY meeting_date DESC, meeting_time DESC'
        
        cursor.execute(query, params)
        meetings = cursor.fetchall()
        conn.close()
        
        return jsonify({
            'success': True,
            'count': len(meetings),
            'meetings': [dict(m) for m in meetings]
        }), 200
        
    except Exception as e:
        print(f"Error getting CAA meetings: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@finance_bp.route('/caa-meetings', methods=['POST'])
def create_caa_meeting():
    """Create a new CAA meeting with Google Meet integration"""
    try:
        data = request.json
        
        # Validate required fields
        required = ['meeting_title', 'meeting_date', 'meeting_time', 'organizer_name', 'organizer_email']
        for field in required:
            if field not in data or not data[field]:
                return jsonify({'success': False, 'error': f'Missing {field}'}), 400
        
        # Parse attendees (comma-separated emails)
        attendees_str = data.get('attendees', '')
        attendees_list = [email.strip() for email in attendees_str.split(',') if email.strip()]
        
        # Combine date and time into datetime
        meeting_date = data.get('meeting_date')
        meeting_time = data.get('meeting_time')
        meeting_datetime_str = f"{meeting_date}T{meeting_time}:00"
        meeting_datetime = datetime.fromisoformat(meeting_datetime_str)
        
        # Get duration (default 40 minutes)
        duration = int(data.get('duration', 40))
        
        # Try to create Google Meet and send emails
        google_meet_link = ''
        google_event_id = ''
        google_meet_error = None
        emails_sent = False
        
        try:
            google = get_google_meet()
            
            # Try to create Google Meet event (may fail if OAuth not configured)
            try:
                meet_result = google.create_google_meet(
                    title=data.get('meeting_title'),
                    start_time=meeting_datetime,
                    duration=duration,
                    attendees_emails=attendees_list,
                    description=data.get('agenda', '')
                )
                
                if meet_result and meet_result.get('success'):
                    google_meet_link = meet_result['meet_link']
                    google_event_id = meet_result.get('event_id', '')
                    print(f"✅ Google Meet created: {google_meet_link}")
                else:
                    google_meet_error = meet_result.get('error', 'Unknown error') if meet_result else 'Failed to create'
                    print(f"⚠️ Google Meet creation failed: {google_meet_error}")
            except Exception as meet_error:
                google_meet_error = str(meet_error)
                print(f"⚠️ Google Meet creation skipped: {google_meet_error}")
            
            # ALWAYS send email invitations (with or without Meet link)
            try:
                print(f"\n📧 Sending email invitations via SMTP...")
                email_result = google.send_meeting_invite(
                    organizer_email=data.get('organizer_email'),
                    organizer_name=data.get('organizer_name'),
                    attendees_emails=attendees_list,
                    meeting_title=data.get('meeting_title'),
                    meeting_date=meeting_date,
                    meeting_time=meeting_time,
                    meet_link=google_meet_link if google_meet_link else 'Meeting link will be provided',
                    agenda=data.get('agenda', '')
                )
                
                if email_result and email_result.get('organizer'):
                    emails_sent = True
                    print(f"✅ Email invitations sent successfully")
                else:
                    print(f"⚠️ Email sending failed")
                    
            except Exception as email_error:
                print(f"⚠️ Email sending error: {email_error}")
                traceback.print_exc()
                
        except Exception as e:
            google_meet_error = str(e)
            print(f"⚠️ Integration error: {e}")
            traceback.print_exc()
        
        # Save to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO caa_meetings 
            (meeting_title, meeting_date, meeting_time, duration, timezone, organizer_name, 
             organizer_email, attendees, agenda, meeting_type, document_ref, 
             zoom_meeting_id, zoom_join_url, auditor_name, auditor_details, auditor_rating,
             status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('meeting_title'),
            meeting_date,
            meeting_time,
            duration,
            data.get('timezone', 'Asia/Kolkata'),
            data.get('organizer_name'),
            data.get('organizer_email'),
            attendees_str,
            data.get('agenda', ''),
            data.get('meeting_type', 'Other'),
            data.get('document_ref', ''),
            google_event_id,  # Store Google Calendar event ID
            google_meet_link,  # Store Google Meet link
            data.get('auditor_name', ''),
            data.get('auditor_details', ''),
            data.get('auditor_rating', ''),
            data.get('status', 'Scheduled'),
            now,
            now
        ))
        
        conn.commit()
        record_id = cursor.lastrowid
        conn.close()
        
        # Prepare response
        response = {
            'success': True,
            'message': 'CAA meeting created successfully',
            'id': record_id,
            'emails_sent': emails_sent
        }
        
        if google_meet_link:
            response['meet_link'] = google_meet_link
            response['event_id'] = google_event_id
        else:
            response['meet_link'] = ''
            if google_meet_error:
                response['google_meet_error'] = google_meet_error
        
        return jsonify(response), 201
        
    except Exception as e:
        print(f"Error creating CAA meeting: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@finance_bp.route('/caa-meetings/<int:meeting_id>', methods=['GET'])
def get_caa_meeting(meeting_id):
    """Get specific CAA meeting details"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM caa_meetings WHERE id = ?', (meeting_id,))
        meeting = cursor.fetchone()
        conn.close()
        
        if not meeting:
            return jsonify({'success': False, 'error': 'Meeting not found'}), 404
        
        return jsonify({'success': True, 'meeting': dict(meeting)}), 200
        
    except Exception as e:
        print(f"Error getting CAA meeting: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@finance_bp.route('/caa-meetings/<int:meeting_id>', methods=['PUT'])
def update_caa_meeting(meeting_id):
    """Update CAA meeting"""
    try:
        data = request.json
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        
        # Build update query dynamically
        updateable_fields = ['meeting_title', 'meeting_date', 'meeting_time', 'duration', 
                            'organizer_name', 'organizer_email', 'attendees', 'agenda', 
                            'meeting_type', 'document_ref', 'status']
        
        updates = []
        params = []
        
        for field in updateable_fields:
            if field in data:
                updates.append(f'{field} = ?')
                params.append(data[field])
        
        if updates:
            updates.append('updated_at = ?')
            params.append(now)
            params.append(meeting_id)
            
            query = f'UPDATE caa_meetings SET {", ".join(updates)} WHERE id = ?'
            cursor.execute(query, params)
            conn.commit()
        
        conn.close()
        
        return jsonify({'success': True, 'message': 'Meeting updated successfully'}), 200
        
    except Exception as e:
        print(f"Error updating CAA meeting: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@finance_bp.route('/caa-meetings/<int:meeting_id>', methods=['DELETE'])
def delete_caa_meeting(meeting_id):
    """Delete CAA meeting"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM caa_meetings WHERE id = ?', (meeting_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Meeting deleted successfully'}), 200
        
    except Exception as e:
        print(f"Error deleting CAA meeting: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@finance_bp.route('/caa-meetings/stats/summary', methods=['GET'])
def get_caa_meetings_stats():
    """Get CAA meetings statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get counts by status
        cursor.execute('''
            SELECT status, COUNT(*) as count 
            FROM caa_meetings 
            GROUP BY status
        ''')
        
        stats = {}
        for row in cursor.fetchall():
            stats[row[0]] = row[1]
        
        # Get total meetings
        cursor.execute('SELECT COUNT(*) FROM caa_meetings')
        total = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'total_meetings': total,
            'by_status': stats
        }), 200
        
    except Exception as e:
        print(f"Error getting CAA meeting stats: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== CUSTOMER MANAGEMENT ROUTES ====================

@finance_bp.route('/customers', methods=['GET'])
def get_customers():
    """Get all customers with optional filters"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get query parameters
        search = request.args.get('search', '')
        status = request.args.get('status')
        
        # Build query
        query = 'SELECT * FROM customers WHERE 1=1'
        params = []
        
        if search:
            query += ' AND (name LIKE ? OR email LIKE ? OR gstin LIKE ?)'
            search_param = f'%{search}%'
            params.extend([search_param, search_param, search_param])
        
        if status:
            query += ' AND status = ?'
            params.append(status)
        
        query += ' ORDER BY name ASC'
        
        cursor.execute(query, params)
        customers = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({
            'success': True,
            'data': customers,
            'count': len(customers)
        }), 200
        
    except Exception as e:
        print(f"Error fetching customers: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/customers', methods=['POST'])
def create_customer():
    """Create a new customer"""
    try:
        data = request.json
        
        # Validate required fields
        required = ['name']
        valid, error = validate_required_fields(data, required)
        if not valid:
            return jsonify({'success': False, 'error': error}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Generate customer code
        current_year = datetime.now().year
        cursor.execute('SELECT MAX(id) FROM customers')
        result = cursor.fetchone()
        max_id = result[0] if result[0] else 0
        customer_code = f"CUST-{current_year}-{str(max_id + 1).zfill(4)}"
        
        timestamp = get_current_timestamp()
        
        cursor.execute('''
            INSERT INTO customers 
            (customer_code, name, email, phone, gstin, pan_number, billing_address, 
             shipping_address, city, state, state_code, pincode, payment_terms, 
             credit_limit, opening_balance, current_balance, status, user_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            customer_code,
            data['name'],
            data.get('email', ''),
            data.get('phone', ''),
            data.get('gstin', ''),
            data.get('pan_number', ''),
            data.get('billing_address', ''),
            data.get('shipping_address', ''),
            data.get('city', ''),
            data.get('state', ''),
            data.get('state_code', ''),
            data.get('pincode', ''),
            data.get('payment_terms', 'Net30'),
            float(data.get('credit_limit', 0)),
            float(data.get('opening_balance', 0)),
            float(data.get('opening_balance', 0)),  # current_balance = opening_balance initially
            data.get('status', 'Active'),
            data.get('user_id', 1),
            timestamp,
            timestamp
        ))
        
        customer_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Customer created successfully',
            'customer_id': customer_id,
            'customer_code': customer_code
        }), 201
        
    except Exception as e:
        print(f"Error creating customer: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/customers/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    """Get a single customer by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM customers WHERE id = ?', (customer_id,))
        customer = cursor.fetchone()
        
        if not customer:
            conn.close()
            return jsonify({'success': False, 'error': 'Customer not found'}), 404
        
        customer_data = dict(customer)
        
        # Get invoice count and total balance
        cursor.execute('''
            SELECT COUNT(*) as invoice_count, COALESCE(SUM(balance_due), 0) as total_due
            FROM invoices 
            WHERE customer_id = ? AND payment_status != 'Paid'
        ''', (customer_id,))
        
        stats = cursor.fetchone()
        customer_data['invoice_count'] = stats[0] if stats else 0
        customer_data['total_outstanding'] = stats[1] if stats else 0
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': customer_data
        }), 200
        
    except Exception as e:
        print(f"Error fetching customer: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/customers/<int:customer_id>', methods=['PUT'])
def update_customer(customer_id):
    """Update an existing customer"""
    try:
        data = request.json
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if customer exists
        cursor.execute('SELECT id FROM customers WHERE id = ?', (customer_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'error': 'Customer not found'}), 404
        
        # Build update query dynamically
        update_fields = []
        params = []
        
        allowed_fields = ['name', 'email', 'phone', 'gstin', 'pan_number', 'billing_address',
                         'shipping_address', 'city', 'state', 'state_code', 'pincode', 
                         'payment_terms', 'credit_limit', 'status']
        
        for field in allowed_fields:
            if field in data:
                update_fields.append(f'{field} = ?')
                params.append(data[field])
        
        if not update_fields:
            conn.close()
            return jsonify({'success': False, 'error': 'No fields to update'}), 400
        
        # Add updated_at timestamp
        update_fields.append('updated_at = ?')
        params.append(get_current_timestamp())
        params.append(customer_id)
        
        query = f"UPDATE customers SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(query, params)
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Customer updated successfully'
        }), 200
        
    except Exception as e:
        print(f"Error updating customer: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/customers/<int:customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    """Soft delete a customer (set status to Inactive)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if customer has pending invoices
        cursor.execute('''
            SELECT COUNT(*) FROM invoices 
            WHERE customer_id = ? AND payment_status != 'Paid'
        ''', (customer_id,))
        
        pending_count = cursor.fetchone()[0]
        
        if pending_count > 0:
            conn.close()
            return jsonify({
                'success': False, 
                'error': f'Cannot delete customer with {pending_count} pending invoice(s)'
            }), 400
        
        # Soft delete - set status to Inactive
        cursor.execute('''
            UPDATE customers 
            SET status = 'Inactive', updated_at = ?
            WHERE id = ?
        ''', (get_current_timestamp(), customer_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Customer deactivated successfully'
        }), 200
        
    except Exception as e:
        print(f"Error deleting customer: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== BANK ACCOUNT MANAGEMENT ROUTES ====================

@finance_bp.route('/bank-accounts', methods=['GET'])
def get_bank_accounts():
    """Get all bank accounts"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        status = request.args.get('status')
        
        query = 'SELECT * FROM bank_accounts WHERE 1=1'
        params = []
        
        if status:
            query += ' AND status = ?'
            params.append(status)
        
        query += ' ORDER BY account_name ASC'
        
        cursor.execute(query, params)
        accounts = [dict(row) for row in cursor.fetchall()]
        
        # Mask account numbers (show only last 4 digits)
        for account in accounts:
            if account.get('account_number'):
                acc_num = account['account_number']
                if len(acc_num) > 4:
                    account['account_number_masked'] = 'XXXX' + acc_num[-4:]
                else:
                    account['account_number_masked'] = acc_num
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': accounts,
            'count': len(accounts)
        }), 200
        
    except Exception as e:
        print(f"Error fetching bank accounts: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/bank-accounts', methods=['POST'])
def create_bank_account():
    """Create a new bank account"""
    try:
        data = request.json
        
        # Validate required fields
        required = ['account_name', 'account_number', 'bank_name']
        valid, error = validate_required_fields(data, required)
        if not valid:
            return jsonify({'success': False, 'error': error}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        timestamp = get_current_timestamp()
        
        cursor.execute('''
            INSERT INTO bank_accounts 
            (account_name, account_number, bank_name, branch, ifsc_code, account_type, 
             currency, opening_balance, current_balance, opening_date, status, user_id, 
             created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['account_name'],
            data['account_number'],
            data['bank_name'],
            data.get('branch', ''),
            data.get('ifsc_code', ''),
            data.get('account_type', 'Current'),
            data.get('currency', 'INR'),
            float(data.get('opening_balance', 0)),
            float(data.get('opening_balance', 0)),  # current_balance = opening_balance initially
            data.get('opening_date', timestamp),
            data.get('status', 'Active'),
            data.get('user_id', 1),
            timestamp,
            timestamp
        ))
        
        account_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Bank account created successfully',
            'account_id': account_id
        }), 201
        
    except Exception as e:
        print(f"Error creating bank account: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/bank-accounts/<int:account_id>', methods=['GET'])
def get_bank_account(account_id):
    """Get a single bank account by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM bank_accounts WHERE id = ?', (account_id,))
        account = cursor.fetchone()
        
        if not account:
            conn.close()
            return jsonify({'success': False, 'error': 'Bank account not found'}), 404
        
        account_data = dict(account)
        
        # Mask account number
        if account_data.get('account_number'):
            acc_num = account_data['account_number']
            if len(acc_num) > 4:
                account_data['account_number_masked'] = 'XXXX' + acc_num[-4:]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': account_data
        }), 200
        
    except Exception as e:
        print(f"Error fetching bank account: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/bank-accounts/<int:account_id>', methods=['PUT'])
def update_bank_account(account_id):
    """Update an existing bank account"""
    try:
        data = request.json
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if account exists
        cursor.execute('SELECT id FROM bank_accounts WHERE id = ?', (account_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'error': 'Bank account not found'}), 404
        
        # Build update query dynamically
        update_fields = []
        params = []
        
        allowed_fields = ['account_name', 'bank_name', 'branch', 'ifsc_code', 
                         'account_type', 'status']
        
        for field in allowed_fields:
            if field in data:
                update_fields.append(f'{field} = ?')
                params.append(data[field])
        
        if not update_fields:
            conn.close()
            return jsonify({'success': False, 'error': 'No fields to update'}), 400
        
        # Add updated_at timestamp
        update_fields.append('updated_at = ?')
        params.append(get_current_timestamp())
        params.append(account_id)
        
        query = f"UPDATE bank_accounts SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(query, params)
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Bank account updated successfully'
        }), 200
        
    except Exception as e:
        print(f"Error updating bank account: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/bank-accounts/<int:account_id>/transactions', methods=['GET'])
def get_bank_account_transactions(account_id):
    """Get all transactions for a specific bank account"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if account exists
        cursor.execute('SELECT id FROM bank_accounts WHERE id = ?', (account_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'error': 'Bank account not found'}), 404
        
        # Get transactions
        cursor.execute('''
            SELECT * FROM bank_transactions 
            WHERE bank_account_id = ? 
            ORDER BY transaction_date DESC
        ''', (account_id,))
        
        transactions = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({
            'success': True,
            'data': transactions,
            'count': len(transactions)
        }), 200
        
    except Exception as e:
        print(f"Error fetching bank account transactions: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

# Export blueprint
__all__ = ['finance_bp']
