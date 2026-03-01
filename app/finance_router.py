"""
Finance & Compliance Module - FastAPI Router
API endpoints for Accounting, GST, Income Tax, Payroll, Reports, and Google Meet Integration
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import traceback
from app.finance_models import get_db_connection
from app.google_meet import get_google_meet

# Create FastAPI router
router = APIRouter(prefix="/api/finance", tags=["finance"])

# ==================== Pydantic Models ====================

class TransactionCreate(BaseModel):
    transaction_date: str
    type: str  # "Income" or "Expense"
    category: str
    amount: float
    description: Optional[str] = ""
    reference_number: Optional[str] = ""
    payment_mode: Optional[str] = ""
    user_id: Optional[int] = 1

class TransactionUpdate(BaseModel):
    transaction_date: Optional[str] = None
    type: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    reference_number: Optional[str] = None
    payment_mode: Optional[str] = None

class GSTRegistrationCreate(BaseModel):
    gstin: str
    legal_name: str
    business_type: str
    registration_date: str
    state: str
    address: str
    trade_name: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    user_id: Optional[int] = 1

# ==================== UTILITY FUNCTIONS ====================

def get_current_timestamp():
    """Get current timestamp in ISO format"""
    return datetime.now().isoformat()

def validate_required_fields(data: dict, required_fields: list):
    """Validate required fields in request data"""
    missing = [field for field in required_fields if field not in data or data[field] == '']
    if missing:
        return False, f"Missing required fields: {', '.join(missing)}"
    return True, None

# ==================== ACCOUNTING & BOOKKEEPING ROUTES ====================

@router.get("/transactions")
async def get_transactions(
    transaction_type: Optional[str] = Query(None, alias="type"),
    category: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """Get all transactions with optional filters"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

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

        return {
            'success': True,
            'data': transactions,
            'count': len(transactions)
        }

    except Exception as e:
        print(f"Error fetching transactions: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transactions")
async def create_transaction(transaction: TransactionCreate):
    """Create a new transaction"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        timestamp = get_current_timestamp()

        cursor.execute('''
            INSERT INTO transactions
            (transaction_date, type, category, amount, description, reference_number,
             payment_mode, user_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            transaction.transaction_date,
            transaction.type,
            transaction.category,
            transaction.amount,
            transaction.description,
            transaction.reference_number,
            transaction.payment_mode,
            transaction.user_id,
            timestamp,
            timestamp
        ))

        transaction_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return {
            'success': True,
            'message': 'Transaction created successfully',
            'transaction_id': transaction_id
        }

    except Exception as e:
        print(f"Error creating transaction: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/transactions/{transaction_id}")
async def update_transaction(transaction_id: int, transaction: TransactionUpdate):
    """Update an existing transaction"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Build update query dynamically
        update_fields = []
        params = []

        allowed_fields = ['transaction_date', 'type', 'category', 'amount',
                         'description', 'reference_number', 'payment_mode']

        for field in allowed_fields:
            value = getattr(transaction, field)
            if value is not None:
                update_fields.append(f'{field} = ?')
                params.append(value)

        if not update_fields:
            raise HTTPException(status_code=400, detail='No fields to update')

        update_fields.append('updated_at = ?')
        params.append(get_current_timestamp())
        params.append(transaction_id)

        query = f"UPDATE transactions SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(query, params)

        conn.commit()
        conn.close()

        return {
            'success': True,
            'message': 'Transaction updated successfully'
        }

    except Exception as e:
        print(f"Error updating transaction: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: int):
    """Delete a transaction"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('DELETE FROM transactions WHERE id = ?', (transaction_id,))

        if cursor.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail='Transaction not found')

        conn.commit()
        conn.close()

        return {
            'success': True,
            'message': 'Transaction deleted successfully'
        }

    except Exception as e:
        print(f"Error deleting transaction: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/summary")
async def get_dashboard_summary(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None)
):
    """Get dashboard summary with income, expenses, assets, and liabilities"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get date range (default: current month)
        if year is None:
            year = datetime.now().year
        if month is None:
            month = datetime.now().month

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

        return {
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
        }

    except Exception as e:
        print(f"Error fetching dashboard summary: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ==================== GST FILING ROUTES ====================

@router.get("/gst/registration")
async def get_gst_registration():
    """Get GST registration details"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM gst_registration LIMIT 1')
        registration = cursor.fetchone()
        conn.close()

        if registration:
            return {
                'success': True,
                'data': dict(registration)
            }
        else:
            return {
                'success': True,
                'data': None,
                'message': 'No registration found'
            }

    except Exception as e:
        print(f"Error fetching GST registration: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/gst/registration")
async def create_gst_registration(registration: GSTRegistrationCreate):
    """Create or update GST registration"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        timestamp = get_current_timestamp()

        # Check if registration exists
        cursor.execute('SELECT id FROM gst_registration WHERE gstin = ?', (registration.gstin,))
        existing = cursor.fetchone()

        if existing:
            # Update existing
            cursor.execute('''
                UPDATE gst_registration
                SET legal_name=?, trade_name=?, business_type=?, registration_date=?,
                    state=?, address=?, email=?, phone=?, updated_at=?
                WHERE gstin=?
            ''', (
                registration.legal_name,
                registration.trade_name,
                registration.business_type,
                registration.registration_date,
                registration.state,
                registration.address,
                registration.email,
                registration.phone,
                timestamp,
                registration.gstin
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
                registration.gstin,
                registration.legal_name,
                registration.trade_name,
                registration.business_type,
                registration.registration_date,
                registration.state,
                registration.address,
                registration.email,
                registration.phone,
                registration.user_id,
                timestamp,
                timestamp
            ))
            message = 'GST registration created successfully'

        conn.commit()
        conn.close()

        return {
            'success': True,
            'message': message
        }

    except Exception as e:
        print(f"Error creating GST registration: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/gst/returns")
async def get_gst_returns():
    """Get all GST returns"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM gst_returns ORDER BY period_year DESC, period_month DESC')
        returns = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return {
            'success': True,
            'data': returns,
            'count': len(returns)
        }

    except Exception as e:
        print(f"Error fetching GST returns: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class GSTReturnCreate(BaseModel):
    return_type: str
    period_month: int
    period_year: int
    total_sales: float
    total_purchases: float
    gst_rate: Optional[float] = 18
    is_interstate: Optional[bool] = False
    user_id: Optional[int] = 1

@router.post("/gst/returns")
async def create_gst_return(gst_return: GSTReturnCreate):
    """Create a new GST return"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Calculate GST amounts
        total_sales = gst_return.total_sales
        total_purchases = gst_return.total_purchases

        gst_rate = gst_return.gst_rate / 100

        output_gst = total_sales * gst_rate
        input_gst = total_purchases * gst_rate

        # For intra-state: CGST + SGST
        # For inter-state: IGST
        if gst_return.is_interstate:
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
            gst_return.return_type,
            gst_return.period_month,
            gst_return.period_year,
            total_sales,
            total_purchases,
            round(cgst, 2),
            round(sgst, 2),
            round(igst, 2),
            round(total_gst, 2),
            'Draft',
            gst_return.user_id,
            timestamp,
            timestamp
        ))

        return_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return {
            'success': True,
            'message': 'GST return created successfully',
            'return_id': return_id,
            'calculations': {
                'cgst': round(cgst, 2),
                'sgst': round(sgst, 2),
                'igst': round(igst, 2),
                'total_gst': round(total_gst, 2)
            }
        }

    except Exception as e:
        print(f"Error creating GST return: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class GSTReturnUpdate(BaseModel):
    status: Optional[str] = None
    acknowledgment_number: Optional[str] = None

@router.put("/gst/returns/{return_id}")
async def update_gst_return(return_id: int, update: GSTReturnUpdate):
    """Update GST return status"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        update_fields = []
        params = []

        if update.status:
            update_fields.append('status = ?')
            params.append(update.status)

            if update.status == 'Filed':
                update_fields.append('filed_date = ?')
                params.append(get_current_timestamp())

                if update.acknowledgment_number:
                    update_fields.append('acknowledgment_number = ?')
                    params.append(update.acknowledgment_number)

        if not update_fields:
            raise HTTPException(status_code=400, detail='No fields to update')

        update_fields.append('updated_at = ?')
        params.append(get_current_timestamp())
        params.append(return_id)

        query = f"UPDATE gst_returns SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(query, params)

        conn.commit()
        conn.close()

        return {
            'success': True,
            'message': 'GST return updated successfully'
        }

    except Exception as e:
        print(f"Error updating GST return: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ==================== INCOME TAX FILING ROUTES ====================

@router.get("/tax/profile")
async def get_tax_profile():
    """Get tax profile"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM tax_profile LIMIT 1')
        profile = cursor.fetchone()
        conn.close()

        if profile:
            return {
                'success': True,
                'data': dict(profile)
            }
        else:
            return {
                'success': True,
                'data': None,
                'message': 'No tax profile found'
            }

    except Exception as e:
        print(f"Error fetching tax profile: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class TaxProfileCreate(BaseModel):
    taxpayer_type: str
    pan_number: str
    name: str
    dob: Optional[str] = ""
    address: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    user_id: Optional[int] = 1

@router.post("/tax/profile")
async def create_tax_profile(profile: TaxProfileCreate):
    """Create or update tax profile"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        timestamp = get_current_timestamp()

        # Check if profile exists
        cursor.execute('SELECT id FROM tax_profile WHERE pan_number = ?', (profile.pan_number,))
        existing = cursor.fetchone()

        if existing:
            # Update existing
            cursor.execute('''
                UPDATE tax_profile
                SET taxpayer_type=?, name=?, dob=?, address=?, email=?, phone=?, updated_at=?
                WHERE pan_number=?
            ''', (
                profile.taxpayer_type,
                profile.name,
                profile.dob,
                profile.address,
                profile.email,
                profile.phone,
                timestamp,
                profile.pan_number
            ))
            message = 'Tax profile updated successfully'
        else:
            # Insert new
            cursor.execute('''
                INSERT INTO tax_profile
                (taxpayer_type, pan_number, name, dob, address, email, phone, user_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                profile.taxpayer_type,
                profile.pan_number,
                profile.name,
                profile.dob,
                profile.address,
                profile.email,
                profile.phone,
                profile.user_id,
                timestamp,
                timestamp
            ))
            message = 'Tax profile created successfully'

        conn.commit()
        conn.close()

        return {
            'success': True,
            'message': message
        }

    except Exception as e:
        print(f"Error creating tax profile: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class IncomeSourceCreate(BaseModel):
    assessment_year: str
    income_type: str
    amount: float
    description: Optional[str] = ""
    tax_profile_id: Optional[int] = 1

@router.post("/tax/income-sources")
async def add_income_source(income: IncomeSourceCreate):
    """Add income source"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        timestamp = get_current_timestamp()

        cursor.execute('''
            INSERT INTO income_sources
            (assessment_year, income_type, amount, description, tax_profile_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            income.assessment_year,
            income.income_type,
            income.amount,
            income.description,
            income.tax_profile_id,
            timestamp,
            timestamp
        ))

        income_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return {
            'success': True,
            'message': 'Income source added successfully',
            'income_id': income_id
        }

    except Exception as e:
        print(f"Error adding income source: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class DeductionCreate(BaseModel):
    assessment_year: str
    section: str
    amount: float
    description: Optional[str] = ""
    tax_profile_id: Optional[int] = 1

@router.post("/tax/deductions")
async def add_deduction(deduction: DeductionCreate):
    """Add tax deduction"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        timestamp = get_current_timestamp()

        cursor.execute('''
            INSERT INTO tax_deductions
            (assessment_year, section, amount, description, tax_profile_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            deduction.assessment_year,
            deduction.section,
            deduction.amount,
            deduction.description,
            deduction.tax_profile_id,
            timestamp,
            timestamp
        ))

        deduction_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return {
            'success': True,
            'message': 'Deduction added successfully',
            'deduction_id': deduction_id
        }

    except Exception as e:
        print(f"Error adding deduction: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class TaxCalculationRequest(BaseModel):
    assessment_year: str

@router.post("/tax/calculate")
async def calculate_tax(request: TaxCalculationRequest):
    """Calculate income tax"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get total income
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) as total
            FROM income_sources
            WHERE assessment_year = ?
        ''', (request.assessment_year,))
        total_income = cursor.fetchone()['total']

        # Get total deductions
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) as total
            FROM tax_deductions
            WHERE assessment_year = ?
        ''', (request.assessment_year,))
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

        return {
            'success': True,
            'data': {
                'total_income': round(total_income, 2),
                'total_deductions': round(total_deductions, 2),
                'taxable_income': round(taxable_income, 2),
                'tax_payable': round(tax_payable, 2),
                'cess': round(tax_payable * 0.04, 2),
                'total_tax': round(total_tax, 2)
            }
        }

    except Exception as e:
        print(f"Error calculating tax: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ==================== PAYROLL & TDS ROUTES ====================

@router.get("/payroll/employees")
async def get_employees():
    """Get all employees"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM employees ORDER BY name')
        employees = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return {
            'success': True,
            'data': employees,
            'count': len(employees)
        }

    except Exception as e:
        print(f"Error fetching employees: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CAA MEETINGS ROUTES ====================

@router.get("/caa-meetings")
async def get_caa_meetings(status: Optional[str] = None):
    """Get all CAA meetings"""
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = conn.cursor()
        
        query = 'SELECT * FROM caa_meetings'
        params = []
        
        if status:
            query += ' WHERE status = ?'
            params.append(status)
        
        query += ' ORDER BY meeting_date DESC, meeting_time DESC'
        
        cursor.execute(query, params)
        meetings = cursor.fetchall()
        conn.close()
        
        return {
            'success': True,
            'count': len(meetings),
            'meetings': [dict(m) for m in meetings]
        }
        
    except Exception as e:
        print(f"Error getting CAA meetings: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/caa-meetings")
async def create_caa_meeting(data: Dict[str, Any]):
    """Create a new CAA meeting"""
    try:
        # Validate required fields
        required = ['meeting_title', 'meeting_date', 'meeting_time', 'organizer_name', 'organizer_email']
        for field in required:
            if field not in data or not data[field]:
                raise HTTPException(status_code=400, detail=f'Missing {field}')
        
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = conn.cursor()
        
        # Insert meeting into database
        cursor.execute('''
            INSERT INTO caa_meetings 
            (meeting_title, meeting_date, meeting_time, organizer_name, organizer_email, 
             attendees, agenda, duration, status, google_meet_link, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('meeting_title'),
            data.get('meeting_date'),
            data.get('meeting_time'),
            data.get('organizer_name'),
            data.get('organizer_email'),
            data.get('attendees', ''),
            data.get('agenda', ''),
            int(data.get('duration', 40)),
            'scheduled',
            data.get('google_meet_link', ''),
            datetime.now().isoformat(),
            datetime.now().isoformat()
        ))
        
        conn.commit()
        meeting_id = cursor.lastrowid
        
        # Generate Google Meet link or simple meeting room link
        google_meet_link = ''
        
        # Try to create Google Meet link (only if already authenticated)
        try:
            # Check if Google Meet is authenticated before calling
            import os
            if os.path.exists('token.pickle'):
                from app.google_meet import get_google_meet
                meet_service = get_google_meet()
                
                # Only try to create if service is properly authenticated
                if meet_service and meet_service.calendar_service:
                    meet_result = meet_service.create_google_meet(
                        title=data.get('meeting_title'),
                        date=data.get('meeting_date'),
                        time=data.get('meeting_time'),
                        duration=int(data.get('duration', 60)),
                        organizer_email=data.get('organizer_email'),
                        organizer_name=data.get('organizer_name'),
                        attendees=data.get('attendees', ''),
                        description=data.get('agenda', '')
                    )
                    
                    if meet_result.get('success') and meet_result.get('meet_link'):
                        google_meet_link = meet_result['meet_link']
                        print(f"✅ Google Meet link created: {google_meet_link}")
                        
                        # Update meeting with Google Meet link
                        cursor.execute('''
                            UPDATE caa_meetings 
                            SET google_meet_link = ?, updated_at = ?
                            WHERE id = ?
                        ''', (google_meet_link, datetime.now().isoformat(), meeting_id))
                        conn.commit()
        except Exception as meet_error:
            print(f"⚠️ Google Meet creation failed: {meet_error}")
        
        # If no Google Meet link, create a Jitsi meeting room link
        if not google_meet_link:
            # Generate a unique Jitsi meeting room link
            import hashlib
            # Create a readable room name with meeting details
            room_name = f"MSME-CAA-{data.get('meeting_title', 'Meeting').replace(' ', '-')}-{meeting_id}"
            # Make it URL-safe and unique
            room_hash = hashlib.md5(f"{meeting_id}-{data.get('meeting_date')}-{data.get('meeting_time')}".encode()).hexdigest()[:8]
            google_meet_link = f"https://meet.jit.si/MSME-Meeting-{room_hash}"
            
            # Update meeting with Jitsi meeting room link
            cursor.execute('''
                UPDATE caa_meetings 
                SET google_meet_link = ?, updated_at = ?
                WHERE id = ?
            ''', (google_meet_link, datetime.now().isoformat(), meeting_id))
            conn.commit()
            print(f"📹 Jitsi meeting link generated: {google_meet_link}")
        
        conn.close()
        
        # Send email invitations via SMTP
        try:
            from app.email_service import get_email_service
            email_service = get_email_service()
            
            # Send to organizer and attendees
            attendee_list = [email.strip() for email in data.get('attendees', '').split(',') if email.strip()]
            
            result = email_service.send_meeting_invite(
                organizer_email=data.get('organizer_email'),
                organizer_name=data.get('organizer_name'),
                attendees_emails=attendee_list,
                meeting_title=data.get('meeting_title'),
                meeting_date=data.get('meeting_date'),
                meeting_time=data.get('meeting_time'),
                meet_link=google_meet_link,
                agenda=data.get('agenda', '')
            )
            
            if result['success']:
                print(f"✅ Email invitations sent for meeting ID {meeting_id} to: {', '.join(result['sent'])}")
            else:
                print(f"⚠️ Email sending failed: {result.get('error', 'Unknown error')}")
        except Exception as email_error:
            print(f"⚠️ Email sending error: {email_error}")
            # Don' fail the meeting creation if email fails
        
        return {
            'success': True,
            'message': 'CAA meeting created successfully',
            'meeting_id': meeting_id,
            'google_meet_link': google_meet_link
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating CAA meeting: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/caa-meetings/{meeting_id}")
async def get_caa_meeting(meeting_id: int):
    """Get a specific CAA meeting"""
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM caa_meetings WHERE id = ?', (meeting_id,))
        meeting = cursor.fetchone()
        conn.close()
        
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found")
        
        return {
            'success': True,
            'meeting': dict(meeting)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching CAA meeting: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/caa-meetings/{meeting_id}")
async def update_caa_meeting(meeting_id: int, data: Dict[str, Any]):
    """Update a CAA meeting"""
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = conn.cursor()
        
        # Build update query dynamically
        fields = []
        values = []
        for key, val in data.items():
            if key not in ['id']:
                fields.append(f"{key} = ?")
                values.append(val)
        
        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        values.append(meeting_id)
        query = f"UPDATE caa_meetings SET {', '.join(fields)} WHERE id = ?"
        
        cursor.execute(query, values)
        conn.commit()
        
        if cursor.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Meeting not found")
        
        conn.close()
        
        return {
            'success': True,
            'message': 'CAA meeting updated successfully'
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating CAA meeting: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/caa-meetings/{meeting_id}")
async def delete_caa_meeting(meeting_id: int):
    """Delete a CAA meeting"""
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = conn.cursor()
        cursor.execute('DELETE FROM caa_meetings WHERE id = ?', (meeting_id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Meeting not found")
        
        conn.close()
        
        return {
            'success': True,
            'message': 'CAA meeting deleted successfully'
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting CAA meeting: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/caa-meetings/stats/summary")
async def get_caa_meetings_stats():
    """Get CAA meetings statistics"""
    try:
        conn = get_db_connection()
        if not conn:
            return {
                'success': True,
                'total': 0,
                'completed': 0,
                'scheduled': 0,
                'cancelled': 0
            }
        
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) as total FROM caa_meetings')
        total = cursor.fetchone()['total']
        
        # Case-insensitive search for all status values
        cursor.execute("SELECT COUNT(*) as completed FROM caa_meetings WHERE LOWER(status) = 'completed'")
        completed = cursor.fetchone()['completed']
        
        cursor.execute("SELECT COUNT(*) as scheduled FROM caa_meetings WHERE LOWER(status) = 'scheduled'")
        scheduled = cursor.fetchone()['scheduled']
        
        cursor.execute("SELECT COUNT(*) as cancelled FROM caa_meetings WHERE LOWER(status) = 'cancelled'")
        cancelled = cursor.fetchone()['cancelled']
        
        conn.close()
        
        return {
            'success': True,
            'total': total,
            'completed': completed,
            'scheduled': scheduled,
            'cancelled': cancelled
        }
        
    except Exception as e:
        print(f"Error getting CAA meetings stats: {e}")
        traceback.print_exc()
        return {
            'success': True,
            'total': 0,
            'completed': 0,
            'scheduled': 0,
            'cancelled': 0
        }


# ==================== GOOGLE MEET ROUTES ====================

@router.post("/google-meets")
async def create_google_meet(data: Dict[str, Any]):
    """Create a new Google Meet meeting"""
    try:
        # Validate required fields
        required = ['meeting_title', 'meeting_date', 'organizer_name', 'organizer_email']
        for field in required:
            if field not in data or not data[field]:
                raise HTTPException(status_code=400, detail=f'Missing required field: {field}')
        
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = conn.cursor()
        
        # Try to create Google Meet
        meet_link = None
        try:
            meet_service = get_google_meet()
            if meet_service:
                meet_link = meet_service.create_google_meet(
                    title=data.get('meeting_title'),
                    attendees=data.get('attendees', '').split(',') if data.get('attendees') else [],
                    description=data.get('description', '')
                )
        except Exception as e:
            print(f"Warning: Could not create Google Meet link: {e}")
            # Continue without meet link - user can add it manually
            meet_link = None
        
        # Insert meeting into database
        cursor.execute('''
            INSERT INTO google_meets 
            (meeting_title, meeting_date, meeting_time, duration, organizer_name, organizer_email, 
             attendees, description, google_meet_link, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('meeting_title'),
            data.get('meeting_date'),
            data.get('meeting_time', '09:00'),
            int(data.get('duration', 60)),
            data.get('organizer_name'),
            data.get('organizer_email'),
            data.get('attendees', ''),
            data.get('description', ''),
            meet_link or '',
            'scheduled',
            datetime.now().isoformat(),
            datetime.now().isoformat()
        ))
        
        conn.commit()
        meeting_id = cursor.lastrowid
        
        # Try to send invite
        try:
            if meet_service and meet_link:
                attendees = data.get('attendees', '').split(',') if data.get('attendees') else []
                meet_service.send_meeting_invite(
                    attendees=attendees,
                    meeting_link=meet_link,
                    title=data.get('meeting_title'),
                    organizer_email=data.get('organizer_email')
                )
        except Exception as e:
            print(f"Warning: Could not send meeting invite: {e}")
        
        conn.close()
        
        return {
            'success': True,
            'message': 'Google Meet scheduled successfully',
            'meeting_id': meeting_id,
            'meet_link': meet_link
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating Google Meet: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/google-meets")
async def get_google_meets(status: Optional[str] = None):
    """Get all Google Meet meetings"""
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = conn.cursor()
        
        query = 'SELECT * FROM google_meets'
        params = []
        
        if status:
            query += ' WHERE status = ?'
            params.append(status)
        
        query += ' ORDER BY meeting_date DESC, meeting_time DESC'
        
        cursor.execute(query, params)
        meetings = cursor.fetchall()
        conn.close()
        
        return {
            'success': True,
            'count': len(meetings),
            'meetings': [dict(m) for m in meetings]
        }
        
    except Exception as e:
        print(f"Error getting Google Meets: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/google-meets/{meeting_id}")
async def get_google_meet(meeting_id: int):
    """Get a specific Google Meet"""
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM google_meets WHERE id = ?', (meeting_id,))
        meeting = cursor.fetchone()
        conn.close()
        
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found")
        
        return {
            'success': True,
            'meeting': dict(meeting)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting Google Meet: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/google-meets/{meeting_id}")
async def update_google_meet(meeting_id: int, data: Dict[str, Any]):
    """Update a Google Meet"""
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = conn.cursor()
        
        # Build update query dynamically
        fields = []
        values = []
        for key, val in data.items():
            if key not in ['id', 'created_at']:
                fields.append(f"{key} = ?")
                values.append(val)
        
        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        values.append(meeting_id)
        query = f"UPDATE google_meets SET {', '.join(fields)} WHERE id = ?"
        
        cursor.execute(query, values)
        conn.commit()
        
        if cursor.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Meeting not found")
        
        conn.close()
        
        return {
            'success': True,
            'message': 'Google Meet updated successfully'
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating Google Meet: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/google-meets/{meeting_id}")
async def delete_google_meet(meeting_id: int):
    """Delete a Google Meet"""
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = conn.cursor()
        cursor.execute('DELETE FROM google_meets WHERE id = ?', (meeting_id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Meeting not found")
        
        conn.close()
        
        return {
            'success': True,
            'message': 'Google Meet deleted successfully'
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting Google Meet: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/google-meets/stats/summary")
async def get_google_meets_stats():
    """Get Google Meets statistics"""
    try:
        conn = get_db_connection()
        if not conn:
            return {
                'success': True,
                'total': 0,
                'scheduled': 0,
                'completed': 0,
                'cancelled': 0
            }
        
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) as total FROM google_meets')
        total = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as scheduled FROM google_meets WHERE LOWER(status) = 'scheduled'")
        scheduled = cursor.fetchone()['scheduled']
        
        cursor.execute("SELECT COUNT(*) as completed FROM google_meets WHERE LOWER(status) = 'completed'")
        completed = cursor.fetchone()['completed']
        
        cursor.execute("SELECT COUNT(*) as cancelled FROM google_meets WHERE LOWER(status) = 'cancelled'")
        cancelled = cursor.fetchone()['cancelled']
        
        conn.close()
        
        return {
            'success': True,
            'total': total,
            'scheduled': scheduled,
            'completed': completed,
            'cancelled': cancelled
        }
        
    except Exception as e:
        print(f"Error getting Google Meets stats: {e}")
        traceback.print_exc()
        return {
            'success': True,
            'total': 0,
            'scheduled': 0,
            'completed': 0,
            'cancelled': 0
        }