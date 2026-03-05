"""
Invoice PDF Generator for TaxCalm
Generates GST-compliant PDF invoices using ReportLab
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from io import BytesIO
from datetime import datetime


def number_to_words_indian(num):
    """Convert number to words in Indian format"""
    ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
    teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", 
             "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
    
    def convert_hundreds(n):
        if n == 0:
            return ""
        elif n < 10:
            return ones[n]
        elif n < 20:
            return teens[n - 10]
        elif n < 100:
            return tens[n // 10] + (" " + ones[n % 10] if n % 10 != 0 else "")
        else:
            return ones[n // 100] + " Hundred" + (" " + convert_hundreds(n % 100) if n % 100 != 0 else "")
    
    if num == 0:
        return "Zero Rupees Only"
    
    # Split into integer and decimal parts
    rupees = int(num)
    paise = int(round((num - rupees) * 100))
    
    result = ""
    
    # Crores
    if rupees >= 10000000:
        crores = rupees // 10000000
        result += convert_hundreds(crores) + " Crore "
        rupees %= 10000000
    
    # Lakhs
    if rupees >= 100000:
        lakhs = rupees // 100000
        result += convert_hundreds(lakhs) + " Lakh "
        rupees %= 100000
    
    # Thousands
    if rupees >= 1000:
        thousands = rupees // 1000
        result += convert_hundreds(thousands) + " Thousand "
        rupees %= 1000
    
    # Hundreds, tens, ones
    if rupees > 0:
        result += convert_hundreds(rupees) + " "
    
    result += "Rupees"
    
    if paise > 0:
        result += " and " + convert_hundreds(paise) + " Paise"
    
    result += " Only"
    
    return result.strip()


def format_indian_currency(amount):
    """Format amount in Indian currency format (₹1,23,456.78)"""
    amount_str = f"{amount:.2f}"
    parts = amount_str.split('.')
    integer_part = parts[0]
    decimal_part = parts[1] if len(parts) > 1 else "00"
    
    # Indian number system: last 3 digits, then groups of 2
    if len(integer_part) > 3:
        last_three = integer_part[-3:]
        rest = integer_part[:-3]
        
        # Add commas every 2 digits for the rest
        formatted_rest = ""
        for i in range(len(rest) - 1, -1, -2):
            start = max(0, i - 1)
            formatted_rest = rest[start:i + 1] + ("," if formatted_rest else "") + formatted_rest
        
        integer_part = formatted_rest + "," + last_three
    
    return f"₹{integer_part}.{decimal_part}"


def generate_invoice_pdf(invoice_data, company_data):
    """
    Generate GST-compliant PDF invoice
    
    Args:
        invoice_data: Dict containing invoice details from database
        company_data: Dict containing company/GST registration details
    
    Returns:
        BytesIO object containing PDF data
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=15*mm,
        bottomMargin=15*mm
    )
    
    # Container for PDF elements
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor('#1a365d'),
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor('#2d3748'),
        spaceAfter=6,
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#4a5568'),
        spaceAfter=3
    )
    
    small_style = ParagraphStyle(
        'CustomSmall',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#718096'),
        spaceAfter=2
    )
    
    # ====================  TAX INVOICE HEADER ====================
    elements.append(Paragraph("TAX INVOICE", title_style))
    elements.append(Spacer(1, 5*mm))
    
    # Company & Customer Details Table
    details_data = [
        [
            Paragraph(f"<b>{company_data.get('business_name', 'N/A')}</b>", heading_style),
            "",
            Paragraph(f"<b>Invoice No:</b> {invoice_data['invoice_number']}", normal_style)
        ],
        [
            Paragraph(company_data.get('business_address', 'N/A'), small_style),
            "",
            Paragraph(f"<b>Invoice Date:</b> {invoice_data['invoice_date']}", small_style)
        ],
        [
            Paragraph(f"<b>GSTIN:</b> {company_data.get('gstin', 'N/A')}", small_style),
            "",
            Paragraph(f"<b>Due Date:</b> {invoice_data['due_date']}", small_style)
        ],
        [
            Paragraph(f"<b>Email:</b> {company_data.get('email', 'N/A')}", small_style),
            "",
            Paragraph(f"<b>Place of Supply:</b> {company_data.get('state', 'N/A')}", small_style)
        ],
        [
            Paragraph(f"<b>Phone:</b> {company_data.get('phone', 'N/A')}", small_style),
            "",
            ""
        ]
    ]
    
    details_table = Table(details_data, colWidths=[80*mm, 10*mm, 80*mm])
    details_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (2, 0), (2, -1), 'LEFT'),
    ]))
    
    elements.append(details_table)
    elements.append(Spacer(1, 5*mm))
    
    # Bill To Section
    elements.append(Paragraph("<b>BILL TO:</b>", heading_style))
    
    bill_to_data = [
        [Paragraph(f"<b>{invoice_data.get('customer_name', 'N/A')}</b>", normal_style)],
        [Paragraph(invoice_data.get('billing_address', 'N/A'), small_style)],
        [Paragraph(f"<b>GSTIN:</b> {invoice_data.get('customer_gstin', 'Unregistered')}", small_style)],
        [Paragraph(f"<b>Email:</b> {invoice_data.get('customer_email', 'N/A')}", small_style)],
        [Paragraph(f"<b>Phone:</b> {invoice_data.get('customer_phone', 'N/A')}", small_style)]
    ]
    
    bill_to_table = Table(bill_to_data, colWidths=[170*mm])
    bill_to_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f7fafc')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e0')),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    
    elements.append(bill_to_table)
    elements.append(Spacer(1, 5*mm))
    
    # ====================  INVOICE ITEMS TABLE ====================
    items = invoice_data.get('items', [])
    
    # Table header
    item_data = [[
        Paragraph("<b>S.No</b>", small_style),
        Paragraph("<b>Description</b>", small_style),
        Paragraph("<b>HSN/SAC</b>", small_style),
        Paragraph("<b>Qty</b>", small_style),
        Paragraph("<b>Rate</b>", small_style),
        Paragraph("<b>Taxable Amt</b>", small_style),
        Paragraph("<b>GST %</b>", small_style),
        Paragraph("<b>Tax Amt</b>", small_style),
        Paragraph("<b>Total</b>", small_style)
    ]]
    
    # Add items
    for idx, item in enumerate(items, 1):
        tax_amount = item['cgst_amount'] + item['sgst_amount'] + item['igst_amount']
        
        item_data.append([
            Paragraph(str(idx), small_style),
            Paragraph(item['item_description'], small_style),
            Paragraph(item.get('hsn_sac_code', '-'), small_style),
            Paragraph(f"{item['quantity']} {item.get('unit_of_measure', 'Nos')}", small_style),
            Paragraph(format_indian_currency(item['unit_price']), small_style),
            Paragraph(format_indian_currency(item['taxable_amount']), small_style),
            Paragraph(f"{item['gst_rate']}%", small_style),
            Paragraph(format_indian_currency(tax_amount), small_style),
            Paragraph(format_indian_currency(item['total_amount']), small_style)
        ])
    
    item_table = Table(item_data, colWidths=[10*mm, 45*mm, 18*mm, 18*mm, 20*mm, 20*mm, 12*mm, 18*mm, 19*mm])
    item_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
        
        # Data rows
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ALIGN', (0, 1), (0, -1), 'CENTER'),  # S.No center
        ('ALIGN', (3, 1), (-1, -1), 'RIGHT'),  # Numbers right-aligned
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        
        # Grid
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e0')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#2d3748')),
        
        # Padding
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    
    elements.append(item_table)
    elements.append(Spacer(1, 5*mm))
    
    # ====================  TAX SUMMARY & TOTALS ====================
    
    # Determine if intra-state or inter-state
    is_intra_state = invoice_data.get('cgst_amount', 0) > 0
    
    summary_data = []
    
    summary_data.append([
        Paragraph("<b>Subtotal:</b>", normal_style),
        Paragraph(format_indian_currency(invoice_data['subtotal']), normal_style)
    ])
    
    if invoice_data.get('discount_amount', 0) > 0:
        summary_data.append([
            Paragraph("<b>Discount:</b>", normal_style),
            Paragraph(f"- {format_indian_currency(invoice_data['discount_amount'])}", normal_style)
        ])
    
    if is_intra_state:
        summary_data.append([
            Paragraph(f"<b>CGST:</b>", normal_style),
            Paragraph(format_indian_currency(invoice_data['cgst_amount']), normal_style)
        ])
        summary_data.append([
            Paragraph(f"<b>SGST:</b>", normal_style),
            Paragraph(format_indian_currency(invoice_data['sgst_amount']), normal_style)
        ])
    else:
        summary_data.append([
            Paragraph(f"<b>IGST:</b>", normal_style),
            Paragraph(format_indian_currency(invoice_data['igst_amount']), normal_style)
        ])
    
    summary_data.append([
        Paragraph("<b>Total Tax:</b>", normal_style),
        Paragraph(format_indian_currency(invoice_data['total_tax']), normal_style)
    ])
    
    summary_data.append([
        Paragraph("<b>TOTAL (Rounded):</b>", heading_style),
        Paragraph(format_indian_currency(invoice_data['grand_total']), heading_style)
    ])
    
    summary_table = Table(summary_data, colWidths=[130*mm, 40*mm])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEABOVE', (0, -1), (-1, -1), 2, colors.HexColor('#2d3748')),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f7fafc')),
    ]))
    
    elements.append(summary_table)
    elements.append(Spacer(1, 5*mm))
    
    # Amount in words
    amount_words_data = [[
        Paragraph(f"<b>Amount in Words:</b> {number_to_words_indian(invoice_data['grand_total'])}", normal_style)
    ]]
    
    amount_words_table = Table(amount_words_data, colWidths=[170*mm])
    amount_words_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#edf2f7')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e0')),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    
    elements.append(amount_words_table)
    elements.append(Spacer(1, 5*mm))
    
    # ====================  BANK DETAILS ====================
    if invoice_data.get('bank_account_id'):
        elements.append(Paragraph("<b>BANK DETAILS:</b>", heading_style))
        
        bank_details_data = [
            [Paragraph(f"<b>Bank Name:</b> {company_data.get('bank_name', 'N/A')}", small_style)],
            [Paragraph(f"<b>Account Number:</b> {company_data.get('bank_account_number', 'N/A')}", small_style)],
            [Paragraph(f"<b>IFSC Code:</b> {company_data.get('bank_ifsc', 'N/A')}", small_style)],
            [Paragraph(f"<b>Branch:</b> {company_data.get('bank_branch', 'N/A')}", small_style)]
        ]
        
        bank_details_table = Table(bank_details_data, colWidths=[170*mm])
        bank_details_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f7fafc')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e0')),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))
        
        elements.append(bank_details_table)
        elements.append(Spacer(1, 5*mm))
    
    # ====================  TERMS & CONDITIONS ====================
    if invoice_data.get('terms_conditions'):
        elements.append(Paragraph("<b>TERMS & CONDITIONS:</b>", heading_style))
        elements.append(Paragraph(invoice_data['terms_conditions'], small_style))
        elements.append(Spacer(1, 3*mm))
    
    # ====================  NOTES ====================
    if invoice_data.get('notes'):
        elements.append(Paragraph("<b>NOTES:</b>", heading_style))
        elements.append(Paragraph(invoice_data['notes'], small_style))
        elements.append(Spacer(1, 3*mm))
    
    # ====================  SIGNATURE & FOOTER====================
    elements.append(Spacer(1, 10*mm))
    
    signature_data = [
        ["", Paragraph("<b>For " + company_data.get('business_name', 'N/A') + "</b>", normal_style)],
        ["", ""],
        ["", ""],
        ["", Paragraph("<b>Authorized Signatory</b>", small_style)]
    ]
    
    signature_table = Table(signature_data, colWidths=[85*mm, 85*mm])
    signature_table.setStyle(TableStyle([
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (1, 0), (1, -1), 'BOTTOM'),
    ]))
    
    elements.append(signature_table)
    elements.append(Spacer(1, 3*mm))
    
    # Footer
    footer_text = "This is a computer-generated invoice and does not require a physical signature."
    elements.append(Paragraph(footer_text, ParagraphStyle(
        'Footer',
        parent=small_style,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#a0aec0'),
        fontSize=7
    )))
    
    # Build PDF
    doc.build(elements)
    
    # Get PDF data
    pdf_data = buffer.getvalue()
    buffer.close()
    
    return pdf_data


def get_company_data_from_db(conn):
    """Fetch company/GST registration data from database"""
    cursor = conn.cursor()
    
    # Get GST registration details
    cursor.execute('''
        SELECT business_name, business_address, gstin, email, phone, state
        FROM gst_registration
        ORDER BY created_at DESC
        LIMIT 1
    ''')
    
    gst_data = cursor.fetchone()
    
    if not gst_data:
        return {
            'business_name': 'Your Business Name',
            'business_address': 'Your Business Address',
            'gstin': 'N/A',
            'email': 'contact@yourbusiness.com',
            'phone': 'N/A',
            'state': 'N/A'
        }
    
    company_dict = dict(gst_data) if isinstance(gst_data, dict) else {
        'business_name': gst_data[0],
        'business_address': gst_data[1],
        'gstin': gst_data[2],
        'email': gst_data[3],
        'phone': gst_data[4],
        'state': gst_data[5]
    }
    
    # Get default bank account details
    cursor.execute('''
        SELECT bank_name, account_number, ifsc_code, branch_name
        FROM bank_accounts
        WHERE is_default = 1
        LIMIT 1
    ''')
    
    bank_data = cursor.fetchone()
    
    if bank_data:
        bank_dict = dict(bank_data) if isinstance(bank_data, dict) else {
            'bank_name': bank_data[0],
            'bank_account_number': bank_data[1],
            'bank_ifsc': bank_data[2],
            'bank_branch': bank_data[3]
        }
        company_dict.update(bank_dict)
    
    return company_dict
