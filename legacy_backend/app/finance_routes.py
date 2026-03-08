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

# ==================== INVOICE MANAGEMENT ROUTES ====================

@finance_bp.route('/invoices', methods=['GET'])
def get_invoices():
    """Get all invoices with optional filters"""
    try:
        from app.invoice_numbering import parse_invoice_number
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get query parameters
        customer_id = request.args.get('customer_id')
        payment_status = request.args.get('payment_status')
        status = request.args.get('status')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        search = request.args.get('search', '')
        
        # Build query with customer join
        query = '''
            SELECT i.*, c.name as customer_name, c.email as customer_email 
            FROM invoices i
            LEFT JOIN customers c ON i.customer_id = c.id
            WHERE 1=1
        '''
        params = []
        
        if customer_id:
            query += ' AND i.customer_id = ?'
            params.append(customer_id)
        
        if payment_status:
            query += ' AND i.payment_status = ?'
            params.append(payment_status)
        
        if status:
            query += ' AND i.status = ?'
            params.append(status)
        
        if start_date:
            query += ' AND i.invoice_date >= ?'
            params.append(start_date)
        
        if end_date:
            query += ' AND i.invoice_date <= ?'
            params.append(end_date)
        
        if search:
            query += ' AND (i.invoice_number LIKE ? OR c.name LIKE ?)'
            search_param = f'%{search}%'
            params.extend([search_param, search_param])
        
        query += ' ORDER BY i.invoice_date DESC, i.id DESC'
        
        cursor.execute(query, params)
        invoices = [dict(row) for row in cursor.fetchall()]
        
        # Calculate aging for each invoice
        from datetime import datetime
        today = datetime.now().date()
        
        for invoice in invoices:
            if invoice['due_date'] and invoice['payment_status'] != 'Paid':
                due_date = datetime.fromisoformat(invoice['due_date']).date()
                days_overdue = (today - due_date).days
                invoice['days_overdue'] = days_overdue if days_overdue > 0 else 0
            else:
                invoice['days_overdue'] = 0
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': invoices,
            'count': len(invoices)
        }), 200
        
    except Exception as e:
        print(f"Error fetching invoices: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/invoices', methods=['POST'])
def create_invoice():
    """Create a new invoice with line items"""
    try:
        from app.invoice_numbering import generate_invoice_number
        from app.gst_calculator import calculate_invoice_gst
        
        data = request.json
        
        # Validate required fields
        required = ['customer_id', 'invoice_date', 'due_date', 'items']
        valid, error = validate_required_fields(data, required)
        if not valid:
            return jsonify({'success': False, 'error': error}), 400
        
        if not data['items'] or len(data['items']) == 0:
            return jsonify({'success': False, 'error': 'At least one item is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get customer state for GST calculation
        cursor.execute('SELECT state FROM customers WHERE id = ?', (data['customer_id'],))
        customer = cursor.fetchone()
        if not customer:
            conn.close()
            return jsonify({'success': False, 'error': 'Customer not found'}), 404
        
        customer_state = customer[0] if isinstance(customer, dict) else customer[0]
        
        # Calculate GST
        gst_calc = calculate_invoice_gst(data['items'], customer_state)
        
        # Generate invoice number
        invoice_number = generate_invoice_number()
        
        timestamp = get_current_timestamp()
        
        # Insert invoice
        cursor.execute('''
            INSERT INTO invoices 
            (invoice_number, customer_id, invoice_date, due_date, billing_address,
             shipping_address, subtotal, cgst_amount, sgst_amount, igst_amount,
             total_tax, discount_amount, grand_total, amount_paid, balance_due,
             payment_status, status, notes, terms_conditions, bank_account_id,
             user_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            invoice_number,
            data['customer_id'],
            data['invoice_date'],
            data['due_date'],
            data.get('billing_address', ''),
            data.get('shipping_address', ''),
            gst_calc['subtotal'],
            gst_calc['cgst_total'],
            gst_calc['sgst_total'],
            gst_calc['igst_total'],
            gst_calc['total_tax'],
            gst_calc['total_discount'],
            gst_calc['grand_total'],
            0,  # amount_paid
            gst_calc['grand_total'],  # balance_due
            'Unpaid',  # payment_status
            data.get('status', 'Draft'),
            data.get('notes', ''),
            data.get('terms_conditions', ''),
            data.get('bank_account_id'),
            data.get('user_id', 1),
            timestamp,
            timestamp
        ))
        
        invoice_id = cursor.lastrowid
        
        # Insert invoice items
        for idx, item in enumerate(data['items'], 1):
            item_calc = gst_calc['items'][idx - 1]
            
            cursor.execute('''
                INSERT INTO invoice_items
                (invoice_id, line_number, item_description, hsn_sac_code, quantity,
                 unit_of_measure, unit_price, discount_percent, taxable_amount,
                 gst_rate, cgst_amount, sgst_amount, igst_amount, total_amount)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                invoice_id,
                idx,
                item['item_description'],
                item.get('hsn_sac_code', ''),
                item_calc['quantity'],
                item.get('unit_of_measure', 'Nos'),
                item_calc['unit_price'],
                item_calc['discount_percent'],
                item_calc['taxable_amount'],
                item_calc['gst_rate'],
                item_calc['cgst'],
                item_calc['sgst'],
                item_calc['igst'],
                item_calc['total_amount']
            ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Invoice created successfully',
            'invoice_id': invoice_id,
            'invoice_number': invoice_number,
            'grand_total': gst_calc['grand_total']
        }), 201
        
    except Exception as e:
        print(f"Error creating invoice: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/invoices/<int:invoice_id>', methods=['GET'])
def get_invoice(invoice_id):
    """Get single invoice with items and payment history"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get invoice with customer details
        cursor.execute('''
            SELECT i.*, c.name as customer_name, c.email as customer_email,
                   c.phone as customer_phone, c.gstin as customer_gstin,
                   c.billing_address as customer_billing_address
            FROM invoices i
            LEFT JOIN customers c ON i.customer_id = c.id
            WHERE i.id = ?
        ''', (invoice_id,))
        
        invoice = cursor.fetchone()
        if not invoice:
            conn.close()
            return jsonify({'success': False, 'error': 'Invoice not found'}), 404
        
        invoice_data = dict(invoice)
        
        # Get invoice items
        cursor.execute('''
            SELECT * FROM invoice_items 
            WHERE invoice_id = ? 
            ORDER BY line_number
        ''', (invoice_id,))
        
        invoice_data['items'] = [dict(row) for row in cursor.fetchall()]
        
        # Get payment history
        cursor.execute('''
            SELECT * FROM invoice_payments 
            WHERE invoice_id = ? 
            ORDER BY payment_date DESC
        ''', (invoice_id,))
        
        invoice_data['payments'] = [dict(row) for row in cursor.fetchall()]
        
        # Calculate aging
        from datetime import datetime
        if invoice_data['due_date'] and invoice_data['payment_status'] != 'Paid':
            today = datetime.now().date()
            due_date = datetime.fromisoformat(invoice_data['due_date']).date()
            days_overdue = (today - due_date).days
            invoice_data['days_overdue'] = days_overdue if days_overdue > 0 else 0
        else:
            invoice_data['days_overdue'] = 0
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': invoice_data
        }), 200
        
    except Exception as e:
        print(f"Error fetching invoice: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/invoices/<int:invoice_id>', methods=['PUT'])
def update_invoice(invoice_id):
    """Update an existing invoice (only if status is Draft)"""
    try:
        data = request.json
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if invoice exists and is Draft
        cursor.execute('SELECT status FROM invoices WHERE id = ?', (invoice_id,))
        invoice = cursor.fetchone()
        if not invoice:
            conn.close()
            return jsonify({'success': False, 'error': 'Invoice not found'}), 404
        
        invoice_status = invoice[0] if isinstance(invoice, dict) else invoice[0]
        if invoice_status != 'Draft':
            conn.close()
            return jsonify({'success': False, 'error': 'Can only edit Draft invoices'}), 400
        
        # Update basic fields
        update_fields = []
        params = []
        
        allowed_fields = ['due_date', 'billing_address', 'shipping_address', 
                         'notes', 'terms_conditions', 'bank_account_id']
        
        for field in allowed_fields:
            if field in data:
                update_fields.append(f'{field} = ?')
                params.append(data[field])
        
        if update_fields:
            update_fields.append('updated_at = ?')
            params.append(get_current_timestamp())
            params.append(invoice_id)
            
            query = f"UPDATE invoices SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, params)
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Invoice updated successfully'
        }), 200
        
    except Exception as e:
        print(f"Error updating invoice: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/invoices/<int:invoice_id>/status', methods=['POST'])
def update_invoice_status(invoice_id):
    """Update invoice status (Draft -> Sent)"""
    try:
        data = request.json
        new_status = data.get('status')
        
        if new_status not in ['Draft', 'Sent', 'Cancelled']:
            return jsonify({'success': False, 'error': 'Invalid status'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        timestamp = get_current_timestamp()
        
        if new_status == 'Sent':
            cursor.execute('''
                UPDATE invoices 
                SET status = ?, sent_date = ?, updated_at = ?
                WHERE id = ?
            ''', (new_status, timestamp, timestamp, invoice_id))
        else:
            cursor.execute('''
                UPDATE invoices 
                SET status = ?, updated_at = ?
                WHERE id = ?
            ''', (new_status, timestamp, invoice_id))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'success': False, 'error': 'Invoice not found'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Invoice status updated to {new_status}'
        }), 200
        
    except Exception as e:
        print(f"Error updating invoice status: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/invoices/<int:invoice_id>', methods=['DELETE'])
def delete_invoice(invoice_id):
    """Soft delete invoice (set status to Cancelled) if no payments made"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if invoice has payments
        cursor.execute('SELECT amount_paid FROM invoices WHERE id = ?', (invoice_id,))
        invoice = cursor.fetchone()
        
        if not invoice:
            conn.close()
            return jsonify({'success': False, 'error': 'Invoice not found'}), 404
        
        amount_paid = invoice[0] if isinstance(invoice, dict) else invoice[0]
        if amount_paid > 0:
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Cannot delete invoice with payments. Cancel it instead.'
            }), 400
        
        # Set status to Cancelled
        cursor.execute('''
            UPDATE invoices 
            SET status = 'Cancelled', updated_at = ?
            WHERE id = ?
        ''', (get_current_timestamp(), invoice_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Invoice cancelled successfully'
        }), 200
        
    except Exception as e:
        print(f"Error deleting invoice: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/invoices/<int:invoice_id>/pdf', methods=['GET'])
def download_invoice_pdf(invoice_id):
    """Generate and download invoice PDF"""
    try:
        from app.invoice_pdf import generate_invoice_pdf, get_company_data_from_db
        from flask import send_file
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get invoice with customer details
        cursor.execute('''
            SELECT i.*, c.name as customer_name, c.email as customer_email,
                   c.phone as customer_phone, c.gstin as customer_gstin,
                   c.billing_address as customer_billing_address
            FROM invoices i
            LEFT JOIN customers c ON i.customer_id = c.id
            WHERE i.id = ?
        ''', (invoice_id,))
        
        invoice = cursor.fetchone()
        if not invoice:
            conn.close()
            return jsonify({'success': False, 'error': 'Invoice not found'}), 404
        
        invoice_data = dict(invoice)
        
        # Get invoice items
        cursor.execute('''
            SELECT * FROM invoice_items 
            WHERE invoice_id = ? 
            ORDER BY line_number
        ''', (invoice_id,))
        
        invoice_data['items'] = [dict(row) for row in cursor.fetchall()]
        
        # Get company data
        company_data = get_company_data_from_db(conn)
        
        conn.close()
        
        # Generate PDF
        pdf_data = generate_invoice_pdf(invoice_data, company_data)
        
        # Return PDF as download
        from io import BytesIO
        pdf_buffer = BytesIO(pdf_data)
        pdf_buffer.seek(0)
        
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"{invoice_data['invoice_number']}.pdf"
        )
        
    except Exception as e:
        print(f"Error generating PDF: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/invoices/<int:invoice_id>/payments', methods=['POST'])
def record_invoice_payment(invoice_id):
    """Record a payment against an invoice"""
    try:
        data = request.json
        
        # Validate required fields
        required = ['payment_date', 'amount', 'payment_mode']
        valid, error = validate_required_fields(data, required)
        if not valid:
            return jsonify({'success': False, 'error': error}), 400
        
        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({'success': False, 'error': 'Payment amount must be greater than 0'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get invoice details
        cursor.execute('''
            SELECT balance_due, amount_paid, grand_total, customer_id 
            FROM invoices 
            WHERE id = ?
        ''', (invoice_id,))
        
        invoice = cursor.fetchone()
        if not invoice:
            conn.close()
            return jsonify({'success': False, 'error': 'Invoice not found'}), 404
        
        balance_due = float(invoice[0] if isinstance(invoice, dict) else invoice[0])
        amount_paid = float(invoice[1] if isinstance(invoice, dict) else invoice[1])
        grand_total = float(invoice[2] if isinstance(invoice, dict) else invoice[2])
        customer_id = invoice[3] if isinstance(invoice, dict) else invoice[3]
        
        if amount > balance_due:
            conn.close()
            return jsonify({
                'success': False,
                'error': f'Payment amount (₹{amount}) exceeds balance due (₹{balance_due})'
            }), 400
        
        timestamp = get_current_timestamp()
        
        # Insert payment record
        cursor.execute('''
            INSERT INTO invoice_payments
            (invoice_id, payment_date, amount, payment_mode, bank_account_id,
             reference_number, notes, user_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            invoice_id,
            data['payment_date'],
            amount,
            data['payment_mode'],
            data.get('bank_account_id'),
            data.get('reference_number', ''),
            data.get('notes', ''),
            data.get('user_id', 1),
            timestamp
        ))
        
        payment_id = cursor.lastrowid
        
        # Update invoice amounts and status
        new_amount_paid = amount_paid + amount
        new_balance_due = grand_total - new_amount_paid
        
        if new_balance_due <= 0.01:  # Fully paid (allowing 1 paisa tolerance)
            payment_status = 'Paid'
            paid_date = timestamp
        elif new_amount_paid > 0:
            payment_status = 'PartiallyPaid'
            paid_date = None
        else:
            payment_status = 'Unpaid'
            paid_date = None
        
        cursor.execute('''
            UPDATE invoices 
            SET amount_paid = ?, balance_due = ?, payment_status = ?, 
                paid_date = ?, updated_at = ?
            WHERE id = ?
        ''', (new_amount_paid, new_balance_due, payment_status, paid_date, timestamp, invoice_id))
        
        # Create corresponding transaction entry
        cursor.execute('''
            INSERT INTO transactions
            (transaction_date, type, category, amount, description, reference_number,
             payment_mode, invoice_id, customer_id, user_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['payment_date'],
            'Income',
            'Sales',
            amount,
            f'Payment received for invoice',
            data.get('reference_number', ''),
            data['payment_mode'],
            invoice_id,
            customer_id,
            data.get('user_id', 1),
            timestamp,
            timestamp
        ))
        
        transaction_id = cursor.lastrowid
        
        # Link transaction to payment
        cursor.execute('''
            UPDATE invoice_payments 
            SET transaction_id = ?
            WHERE id = ?
        ''', (transaction_id, payment_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Payment recorded successfully',
            'payment_id': payment_id,
            'transaction_id': transaction_id,
            'new_balance_due': new_balance_due,
            'payment_status': payment_status
        }), 201
        
    except Exception as e:
        print(f"Error recording payment: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

            this.showToast('Failed to record payment', 'error');
        }
    }
    
    // ==================== BANK RECONCILIATION ROUTES ====================

@finance_bp.route('/bank-statements/import', methods=['POST'])
def import_bank_statement():
    """Import and parse bank statement file"""
    try:
        from app.bank_parser import BankStatementParser, detect_bank_from_filename
        from werkzeug.utils import secure_filename
        
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        # Get form data
        bank_account_id = request.form.get('bank_account_id')
        bank_name = request.form.get('bank_name', '')
        
        if not bank_account_id:
            return jsonify({'success': False, 'error': 'Bank account ID is required'}), 400
        
        # Detect bank if not provided
        if not bank_name:
            bank_name = detect_bank_from_filename(file.filename)
        
        # Read file content
        file_content = BytesIO(file.read())
        
        # Parse statement
        parser = BankStatementParser(bank_name)
        result = parser.parse_file(file_content, secure_filename(file.filename))
        
        if not result['success']:
            return jsonify(result), 400
        
        # Validate statement
        validation = parser.validate_statement(result['transactions'], result['summary'])
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        timestamp = get_current_timestamp()
        
        # Create bank statement record
        cursor.execute('''
            INSERT INTO bank_statements
            (bank_account_id, statement_date, start_date, end_date, opening_balance,
             closing_balance, total_debits, total_credits, file_name, bank_name,
             upload_date, uploaded_by, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            bank_account_id,
            result['summary']['end_date'],
            result['summary']['start_date'],
            result['summary']['end_date'],
            result['summary'].get('opening_balance'),
            result['summary'].get('closing_balance'),
            result['summary']['total_debits'],
            result['summary']['total_credits'],
            secure_filename(file.filename),
            bank_name,
            timestamp,
            request.form.get('user_id', 1),
            'Uploaded'
        ))
        
        statement_id = cursor.lastrowid
        
        # Insert transactions
        inserted_count = 0
        skipped_count = 0
        
        for txn in result['transactions']:
            try:
                # Check if transaction already exists (avoid duplicates)
                cursor.execute('''
                    SELECT id FROM bank_transactions
                    WHERE bank_account_id = ? AND transaction_date = ? 
                    AND amount = ? AND description = ?
                ''', (bank_account_id, txn['transaction_date'], txn['amount'], txn['description']))
                
                if cursor.fetchone():
                    skipped_count += 1
                    continue
                
                cursor.execute('''
                    INSERT INTO bank_transactions
                    (bank_statement_id, bank_account_id, transaction_date, transaction_type,
                     amount, description, reference_number, balance, upi_id, cheque_number,
                     reconciliation_status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    statement_id,
                    bank_account_id,
                    txn['transaction_date'],
                    txn['transaction_type'],
                    txn['amount'],
                    txn['description'],
                    txn['reference_number'],
                    txn.get('balance'),
                    txn.get('upi_id'),
                    txn.get('cheque_number'),
                    'Unmatched',
                    timestamp
                ))
                
                inserted_count += 1
                
            except Exception as e:
                print(f"Error inserting transaction: {e}")
                continue
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Bank statement imported successfully',
            'statement_id': statement_id,
            'summary': result['summary'],
            'validation': validation,
            'inserted_transactions': inserted_count,
            'skipped_duplicates': skipped_count,
            'parsing_errors': len(result.get('errors', []))
        }), 201
        
    except Exception as e:
        print(f"Error importing bank statement: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/bank-statements', methods=['GET'])
def get_bank_statements():
    """Get all uploaded bank statements"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        bank_account_id = request.args.get('bank_account_id')
        
        query = '''
            SELECT bs.*, ba.bank_name || ' - ' || ba.account_number as account_display
            FROM bank_statements bs
            LEFT JOIN bank_accounts ba ON bs.bank_account_id = ba.id
            WHERE 1=1
        '''
        params = []
        
        if bank_account_id:
            query += ' AND bs.bank_account_id = ?'
            params.append(bank_account_id)
        
        query += ' ORDER BY bs.statement_date DESC'
        
        cursor.execute(query, params)
        statements = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': statements
        }), 200
        
    except Exception as e:
        print(f"Error fetching bank statements: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/bank-transactions', methods=['GET'])
def get_bank_transactions():
    """Get bank transactions with filters"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get query parameters
        bank_account_id = request.args.get('bank_account_id')
        statement_id = request.args.get('statement_id')
        reconciliation_status = request.args.get('reconciliation_status')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        transaction_type = request.args.get('transaction_type')
        
        query = 'SELECT * FROM bank_transactions WHERE 1=1'
        params = []
        
        if bank_account_id:
            query += ' AND bank_account_id = ?'
            params.append(bank_account_id)
        
        if statement_id:
            query += ' AND bank_statement_id = ?'
            params.append(statement_id)
        
        if reconciliation_status:
            query += ' AND reconciliation_status = ?'
            params.append(reconciliation_status)
        
        if start_date:
            query += ' AND transaction_date >= ?'
            params.append(start_date)
        
        if end_date:
            query += ' AND transaction_date <= ?'
            params.append(end_date)
        
        if transaction_type:
            query += ' AND transaction_type = ?'
            params.append(transaction_type)
        
        query += ' ORDER BY transaction_date DESC, id DESC'
        
        cursor.execute(query, params)
        transactions = [dict(row) for row in cursor.fetchall()]
        
        # Calculate summary
        total_debits = sum(t['amount'] for t in transactions if t['transaction_type'] == 'Debit')
        total_credits = sum(t['amount'] for t in transactions if t['transaction_type'] == 'Credit')
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': transactions,
            'summary': {
                'total_transactions': len(transactions),
                'total_debits': total_debits,
                'total_credits': total_credits,
                'net': total_credits - total_debits
            }
        }), 200
        
    except Exception as e:
        print(f"Error fetching bank transactions: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/reconciliation/auto-match', methods=['POST'])
def auto_match_transactions():
    """Run auto-matching for bank reconciliation"""
    try:
        from app.reconciliation_engine import ReconciliationEngine
        
        data = request.json
        bank_account_id = data.get('bank_account_id')
        date_range_days = data.get('date_range_days', 90)
        
        if not bank_account_id:
            return jsonify({'success': False, 'error': 'Bank account ID is required'}), 400
        
        conn = get_db_connection()
        engine = ReconciliationEngine(conn)
        
        result = engine.auto_match_all(bank_account_id, date_range_days)
        
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Found {result["total_matches"]} potential matches',
            'data': result
        }), 200
        
    except Exception as e:
        print(f"Error in auto-matching: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/reconciliation/accept-match', methods=['POST'])
def accept_match():
    """Accept a suggested match"""
    try:
        from app.reconciliation_engine import ReconciliationEngine
        
        data = request.json
        bank_transaction_id = data.get('bank_transaction_id')
        book_transaction_id = data.get('book_transaction_id')
        
        if not bank_transaction_id or not book_transaction_id:
            return jsonify({'success': False, 'error': 'Both transaction IDs are required'}), 400
        
        conn = get_db_connection()
        engine = ReconciliationEngine(conn)
        
        success = engine.accept_match(bank_transaction_id, book_transaction_id, matched_by='User')
        
        conn.close()
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Match accepted successfully'
            }), 200
        else:
            return jsonify({'success': False, 'error': 'Failed to accept match'}), 500
        
    except Exception as e:
        print(f"Error accepting match: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/reconciliation/manual-match', methods=['POST'])
def manual_match():
    """Manually match two transactions"""
    try:
        from app.reconciliation_engine import ReconciliationEngine
        
        data = request.json
        bank_transaction_id = data.get('bank_transaction_id')
        book_transaction_id = data.get('book_transaction_id')
        
        if not bank_transaction_id or not book_transaction_id:
            return jsonify({'success': False, 'error': 'Both transaction IDs are required'}), 400
        
        conn = get_db_connection()
        engine = ReconciliationEngine(conn)
        
        success = engine.manual_match(bank_transaction_id, book_transaction_id)
        
        conn.close()
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Transactions matched successfully'
            }), 200
        else:
            return jsonify({'success': False, 'error': 'Failed to match transactions'}), 500
        
    except Exception as e:
        print(f"Error in manual matching: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/reconciliation/unmatch/<int:bank_transaction_id>', methods=['POST'])
def unmatch_transaction(bank_transaction_id):
    """Unmatch a previously matched transaction"""
    try:
        from app.reconciliation_engine import ReconciliationEngine
        
        conn = get_db_connection()
        engine = ReconciliationEngine(conn)
        
        success = engine.unmatch(bank_transaction_id)
        
        conn.close()
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Transaction unmatched successfully'
            }), 200
        else:
            return jsonify({'success': False, 'error': 'Transaction not found or not matched'}), 404
        
    except Exception as e:
        print(f"Error unmatching transaction: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/reconciliation/summary', methods=['GET'])
def get_reconciliation_summary():
    """Get reconciliation summary statistics"""
    try:
        from app.reconciliation_engine import ReconciliationEngine
        
        bank_account_id = request.args.get('bank_account_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not bank_account_id:
            return jsonify({'success': False, 'error': 'Bank account ID is required'}), 400
        
        conn = get_db_connection()
        engine = ReconciliationEngine(conn)
        
        summary = engine.get_reconciliation_summary(bank_account_id, start_date, end_date)
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': summary
        }), 200
        
    except Exception as e:
        print(f"Error fetching reconciliation summary: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/reconciliation/discrepancies', methods=['GET'])
def get_reconciliation_discrepancies():
    """Get unmatched/unreconciled transactions (discrepancies)"""
    try:
        bank_account_id = request.args.get('bank_account_id')
        
        if not bank_account_id:
            return jsonify({'success': False, 'error': 'Bank account ID is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get unmatched bank transactions
        cursor.execute('''
            SELECT * FROM bank_transactions
            WHERE bank_account_id = ? AND reconciliation_status = 'Unmatched'
            ORDER BY transaction_date DESC
        ''', (bank_account_id,))
        
        unmatched_bank = [dict(row) for row in cursor.fetchall()]
        
        # Get unreconciled book transactions
        cursor.execute('''
            SELECT * FROM transactions
            WHERE bank_account_id = ? AND reconciliation_status = 'Unreconciled'
            ORDER BY transaction_date DESC
        ''', (bank_account_id,))
        
        unreconciled_book = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'unmatched_bank_transactions': unmatched_bank,
                'unreconciled_book_transactions': unreconciled_book,
                'unmatched_bank_count': len(unmatched_bank),
                'unreconciled_book_count': len(unreconciled_book)
            }
        }), 200
        
    except Exception as e:
        print(f"Error fetching discrepancies: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/reconciliation/rules', methods=['GET'])
def get_reconciliation_rules():
    """Get all reconciliation rules"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM reconciliation_rules ORDER BY priority DESC')
        rules = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': rules
        }), 200
        
    except Exception as e:
        print(f"Error fetching rules: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@finance_bp.route('/reconciliation/rules', methods=['POST'])
def create_reconciliation_rule():
    """Create a new reconciliation rule"""
    try:
        data = request.json
        
        required = ['rule_name', 'pattern', 'match_type', 'book_category']
        valid, error = validate_required_fields(data, required)
        if not valid:
            return jsonify({'success': False, 'error': error}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        timestamp = get_current_timestamp()
        
        cursor.execute('''
            INSERT INTO reconciliation_rules
            (rule_name, pattern, match_type, book_category, priority, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['rule_name'],
            data['pattern'],
            data['match_type'],
            data['book_category'],
            data.get('priority', 50),
            data.get('is_active', 1),
            timestamp
        ))
        
        rule_id = cursor.lastrowid
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Reconciliation rule created successfully',
            'rule_id': rule_id
        }), 201
        
    except Exception as e:
        print(f"Error creating rule: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

# Export blueprint
__all__ = ['finance_bp']
