"""
GST Calculator Module
Calculates GST amounts for invoices based on Indian GST rules
Supports CGST+SGST (intra-state) and IGST (inter-state)
"""

from app.finance_models import get_db_connection


# Valid GST rates in India (as of 2026)
VALID_GST_RATES = [0, 0.25, 3, 5, 12, 18, 28]


def get_business_state():
    """
    Get business state from GST registration
    Returns: State name or None
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT state FROM gst_registration LIMIT 1')
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return result[0] if isinstance(result, dict) else result[0]
        return None
    except:
        return None


def validate_gst_rate(rate):
    """
    Validate if GST rate is allowed
    
    Args:
        rate: GST rate as percentage (float)
    
    Returns:
        bool: True if valid
    """
    return float(rate) in VALID_GST_RATES


def calculate_item_gst(taxable_amount, gst_rate, customer_state, business_state=None):
    """
    Calculate GST for a single line item
    
    Args:
        taxable_amount: Base amount before tax (float)
        gst_rate: GST rate as percentage (e.g., 18 for 18%)
        customer_state: Customer's state
        business_state: Business state (fetched if not provided)
    
    Returns:
        dict: {
            'taxable_amount': float,
            'gst_rate': float,
            'cgst': float,
            'sgst': float,
            'igst': float,
            'total_tax': float,
            'total_amount': float,
            'is_intra_state': bool
        }
    """
    taxable_amount = float(taxable_amount)
    gst_rate = float(gst_rate)
    
    # Validate GST rate
    if not validate_gst_rate(gst_rate):
        raise ValueError(f"Invalid GST rate: {gst_rate}%. Valid rates: {VALID_GST_RATES}")
    
    # Get business state if not provided
    if business_state is None:
        business_state = get_business_state()
    
    # Determine if intra-state or inter-state
    is_intra_state = (customer_state and business_state and 
                      customer_state.strip().lower() == business_state.strip().lower())
    
    if is_intra_state:
        # Intra-state: Split into CGST and SGST (50% each)
        cgst = round(taxable_amount * gst_rate / 200, 2)  # Divide by 200 (50% of rate)
        sgst = round(taxable_amount * gst_rate / 200, 2)
        igst = 0
    else:
        # Inter-state: Full IGST
        cgst = 0
        sgst = 0
        igst = round(taxable_amount * gst_rate / 100, 2)
    
    total_tax = cgst + sgst + igst
    total_amount = taxable_amount + total_tax
    
    return {
        'taxable_amount': round(taxable_amount, 2),
        'gst_rate': gst_rate,
        'cgst': cgst,
        'sgst': sgst,
        'igst': igst,
        'total_tax': round(total_tax, 2),
        'total_amount': round(total_amount, 2),
        'is_intra_state': is_intra_state
    }


def calculate_invoice_gst(items, customer_state, business_state=None):
    """
    Calculate total GST for an invoice with multiple items
    
    Args:
        items: List of dicts with keys:
               - quantity: float
               - unit_price: float
               - discount_percent: float (optional, default 0)
               - gst_rate: float
        customer_state: Customer's state
        business_state: Business state (optional)
    
    Returns:
        dict: {
            'subtotal': float,
            'total_discount': float,
            'taxable_amount': float,
            'cgst_total': float,
            'sgst_total': float,
            'igst_total': float,
            'total_tax': float,
            'grand_total': float,
            'is_intra_state': bool,
            'items': list of item calculations
        }
    """
    if not items:
        raise ValueError("No items provided for GST calculation")
    
    # Get business state once
    if business_state is None:
        business_state = get_business_state()
    
    is_intra_state = (customer_state and business_state and 
                      customer_state.strip().lower() == business_state.strip().lower())
    
    subtotal = 0
    total_discount = 0
    taxable_amount = 0
    cgst_total = 0
    sgst_total = 0
    igst_total = 0
    item_calculations = []
    
    for item in items:
        # Calculate item amount
        quantity = float(item.get('quantity', 1))
        unit_price = float(item.get('unit_price', 0))
        discount_percent = float(item.get('discount_percent', 0))
        gst_rate = float(item.get('gst_rate', 0))
        
        # Item subtotal before discount
        item_subtotal = quantity * unit_price
        subtotal += item_subtotal
        
        # Apply discount
        item_discount = round(item_subtotal * discount_percent / 100, 2)
        total_discount += item_discount
        
        # Taxable amount after discount
        item_taxable = item_subtotal - item_discount
        taxable_amount += item_taxable
        
        # Calculate GST for this item
        gst_calc = calculate_item_gst(item_taxable, gst_rate, customer_state, business_state)
        
        cgst_total += gst_calc['cgst']
        sgst_total += gst_calc['sgst']
        igst_total += gst_calc['igst']
        
        # Store item calculation
        item_calculations.append({
            'quantity': quantity,
            'unit_price': unit_price,
            'discount_percent': discount_percent,
            'discount_amount': item_discount,
            'taxable_amount': item_taxable,
            'gst_rate': gst_rate,
            'cgst': gst_calc['cgst'],
            'sgst': gst_calc['sgst'],
            'igst': gst_calc['igst'],
            'total_tax': gst_calc['total_tax'],
            'total_amount': gst_calc['total_amount']
        })
    
    total_tax = cgst_total + sgst_total + igst_total
    grand_total = taxable_amount + total_tax
    
    return {
        'subtotal': round(subtotal, 2),
        'total_discount': round(total_discount, 2),
        'taxable_amount': round(taxable_amount, 2),
        'cgst_total': round(cgst_total, 2),
        'sgst_total': round(sgst_total, 2),
        'igst_total': round(igst_total, 2),
        'total_tax': round(total_tax, 2),
        'grand_total': round(grand_total, 2),
        'is_intra_state': is_intra_state,
        'items': item_calculations
    }


def calculate_reverse_gst(total_amount_with_tax, gst_rate, is_intra_state=True):
    """
    Calculate GST backwards from total amount (inclusive of tax)
    Useful when you know final amount and need to extract tax
    
    Args:
        total_amount_with_tax: Total including tax
        gst_rate: GST rate percentage
        is_intra_state: True for CGST+SGST, False for IGST
    
    Returns:
        dict: Tax breakdown
    """
    total_amount_with_tax = float(total_amount_with_tax)
    gst_rate = float(gst_rate)
    
    # Calculate taxable amount
    taxable_amount = round(total_amount_with_tax / (1 + gst_rate/100), 2)
    total_tax = total_amount_with_tax - taxable_amount
    
    if is_intra_state:
        cgst = round(total_tax / 2, 2)
        sgst = round(total_tax / 2, 2)
        igst = 0
    else:
        cgst = 0
        sgst = 0
        igst = round(total_tax, 2)
    
    return {
        'taxable_amount': taxable_amount,
        'cgst': cgst,
        'sgst': sgst,
        'igst': igst,
        'total_tax': round(total_tax, 2),
        'total_amount_with_tax': total_amount_with_tax
    }


def get_state_code(state_name):
    """
    Get GST state code from state name
    
    Args:
        state_name: State name
    
    Returns:
        str: 2-digit state code or None
    """
    state_codes = {
        'Andaman and Nicobar Islands': '35',
        'Andhra Pradesh': '37',
        'Arunachal Pradesh': '12',
        'Assam': '18',
        'Bihar': '10',
        'Chandigarh': '04',
        'Chhattisgarh': '22',
        'Dadra and Nagar Haveli': '26',
        'Daman and Diu': '25',
        'Delhi': '07',
        'Goa': '30',
        'Gujarat': '24',
        'Haryana': '06',
        'Himachal Pradesh': '02',
        'Jammu and Kashmir': '01',
        'Jharkhand': '20',
        'Karnataka': '29',
        'Kerala': '32',
        'Ladakh': '38',
        'Lakshadweep': '31',
        'Madhya Pradesh': '23',
        'Maharashtra': '27',
        'Manipur': '14',
        'Meghalaya': '17',
        'Mizoram': '15',
        'Nagaland': '13',
        'Odisha': '21',
        'Puducherry': '34',
        'Punjab': '03',
        'Rajasthan': '08',
        'Sikkim': '11',
        'Tamil Nadu': '33',
        'Telangana': '36',
        'Tripura': '16',
        'Uttar Pradesh': '09',
        'Uttarakhand': '05',
        'West Bengal': '19'
    }
    
    return state_codes.get(state_name)


if __name__ == "__main__":
    # Test the module
    print("GST Calculator Test\n")
    
    # Test 1: Intra-state (Karnataka to Karnataka)
    print("Test 1: Intra-state transaction")
    items = [
        {'quantity': 2, 'unit_price': 1000, 'discount_percent': 10, 'gst_rate': 18},
        {'quantity': 1, 'unit_price': 5000, 'discount_percent': 0, 'gst_rate': 12}
    ]
    
    result = calculate_invoice_gst(items, 'Karnataka', 'Karnataka')
    print(f"Subtotal: ₹{result['subtotal']}")
    print(f"Discount: ₹{result['total_discount']}")
    print(f"Taxable: ₹{result['taxable_amount']}")
    print(f"CGST: ₹{result['cgst_total']}")
    print(f"SGST: ₹{result['sgst_total']}")
    print(f"Total Tax: ₹{result['total_tax']}")
    print(f"Grand Total: ₹{result['grand_total']}\n")
    
    # Test 2: Inter-state (Karnataka to Tamil Nadu)
    print("Test 2: Inter-state transaction")
    result2 = calculate_invoice_gst(items, 'Tamil Nadu', 'Karnataka')
    print(f"Taxable: ₹{result2['taxable_amount']}")
    print(f"IGST: ₹{result2['igst_total']}")
    print(f"Grand Total: ₹{result2['grand_total']}")
