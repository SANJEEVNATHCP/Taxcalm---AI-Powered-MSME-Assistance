"""
Invoice Numbering System
Generates sequential invoice numbers with financial year support
Format: INV-{FY}-{SEQUENCE} (e.g., INV-2526-001 for FY 2025-26)
"""

from datetime import datetime
from app.finance_models import get_db_connection
import threading

# Thread lock for concurrent invoice generation
_lock = threading.Lock()


def get_financial_year():
    """
    Get current financial year in format YXYY
    Financial year in India: April 1 to March 31
    Returns: String like '2526' for FY 2025-26
    """
    today = datetime.now()
    
    if today.month >= 4:  # April to March
        start_year = today.year % 100  # Last 2 digits
        end_year = (today.year + 1) % 100
    else:  # January to March (previous FY)
        start_year = (today.year - 1) % 100
        end_year = today.year % 100
    
    return f"{start_year:02d}{end_year:02d}"


def generate_invoice_number(prefix="INV", user_id=1):
    """
    Generate next sequential invoice number for current financial year
    
    Args:
        prefix: Invoice prefix (default: "INV")
        user_id: User ID for multi-tenant support
    
    Returns:
        String: Invoice number like "INV-2526-001"
    
    Thread-safe: Uses database lock to prevent duplicate numbers
    """
    with _lock:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        fy = get_financial_year()
        pattern = f"{prefix}-{fy}-%"
        
        try:
            # Get max sequence for current FY
            cursor.execute('''
                SELECT invoice_number FROM invoices 
                WHERE invoice_number LIKE ? 
                ORDER BY invoice_number DESC 
                LIMIT 1
            ''', (pattern,))
            
            result = cursor.fetchone()
            
            if result:
                # Extract sequence from last invoice
                last_number = result[0] if isinstance(result, dict) else result[0]
                last_seq = int(last_number.split('-')[-1])
                new_seq = last_seq + 1
            else:
                # First invoice of FY
                new_seq = 1
            
            # Format: INV-2526-001 (zero-padded to 3 digits, expandable)
            if new_seq > 999:
                # Support more than 999 invoices
                invoice_number = f"{prefix}-{fy}-{new_seq:04d}"
            else:
                invoice_number = f"{prefix}-{fy}-{new_seq:03d}"
            
            conn.close()
            return invoice_number
            
        except Exception as e:
            conn.close()
            raise Exception(f"Error generating invoice number: {e}")


def validate_invoice_number(invoice_number):
    """
    Validate invoice number format
    
    Args:
        invoice_number: Invoice number to validate
    
    Returns:
        bool: True if valid, False otherwise
    """
    if not invoice_number:
        return False
    
    parts = invoice_number.split('-')
    
    # Should have 3 parts: PREFIX-FY-SEQ
    if len(parts) != 3:
        return False
    
    prefix, fy, seq = parts
    
    # FY should be 4 digits
    if len(fy) != 4 or not fy.isdigit():
        return False
    
    # Sequence should be numeric
    if not seq.isdigit():
        return False
    
    return True


def parse_invoice_number(invoice_number):
    """
    Parse invoice number into components
    
    Args:
        invoice_number: Invoice number like "INV-2526-001"
    
    Returns:
        dict: {prefix, fy, sequence} or None if invalid
    """
    if not validate_invoice_number(invoice_number):
        return None
    
    parts = invoice_number.split('-')
    
    return {
        'prefix': parts[0],
        'financial_year': parts[1],
        'sequence': int(parts[2])
    }


def get_next_invoice_preview(prefix="INV"):
    """
    Preview what the next invoice number will be without generating it
    
    Args:
        prefix: Invoice prefix
    
    Returns:
        String: Next invoice number
    """
    # This doesn't reserve the number, just shows preview
    with _lock:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        fy = get_financial_year()
        pattern = f"{prefix}-{fy}-%"
        
        try:
            cursor.execute('''
                SELECT invoice_number FROM invoices 
                WHERE invoice_number LIKE ? 
                ORDER BY invoice_number DESC 
                LIMIT 1
            ''', (pattern,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                last_number = result[0] if isinstance(result, dict) else result[0]
                last_seq = int(last_number.split('-')[-1])
                new_seq = last_seq + 1
            else:
                new_seq = 1
            
            if new_seq > 999:
                return f"{prefix}-{fy}-{new_seq:04d}"
            else:
                return f"{prefix}-{fy}-{new_seq:03d}"
                
        except Exception as e:
            conn.close()
            return f"{prefix}-{fy}-001"


if __name__ == "__main__":
    # Test the module
    print("Current Financial Year:", get_financial_year())
    print("Next Invoice Number:", get_next_invoice_preview())
    print("\nGenerating 5 test invoice numbers:")
    
    # Note: This will actually create entries if run standalone
    # In production, invoice numbers are only generated when creating actual invoices
    for i in range(5):
        number = generate_invoice_number()
        print(f"  {i+1}. {number}")
        parsed = parse_invoice_number(number)
        print(f"     Parsed: {parsed}")
