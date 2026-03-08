#!/usr/bin/env python
"""
TaxClam Flask Server
Simple, stable server for Windows
"""

from flask import Flask, jsonify, request, send_from_directory, Response
from flask_cors import CORS
import os

# ✅ Removed WeasyPrint dependency - using client-side PDF generation instead

# Import Finance & Compliance module
from app.finance_routes import finance_bp

# Import Zoom Meeting Scheduler
from app.zoom_routes import zoom_bp

app = Flask(__name__, static_folder='static', static_url_path='/static')

# Enable CORS for all routes
CORS(app)

# Register Finance Blueprint
app.register_blueprint(finance_bp)

# Register Zoom Blueprint
app.register_blueprint(zoom_bp)

# GST Calculation function
def calculate_gst(sales, purchases, rate, period):
    """Calculate GST"""
    try:
        sales = float(sales)
        purchases = float(purchases)
        rate = float(rate)
        
        # Validate rate
        if rate < 0 or rate > 100:
            rate = 18
        
        rate_decimal = rate / 100
        output_gst = sales * rate_decimal
        input_gst = purchases * rate_decimal
        net_gst = output_gst - input_gst
        
        # Generate message
        period_label = "week" if str(period).lower() == "weekly" else "month"
        if net_gst > 0:
            message = f"You need to keep aside Rs {net_gst:,.0f} for GST this {period_label}."
        elif net_gst < 0:
            message = f"You may get a GST refund of Rs {abs(net_gst):,.0f} this {period_label}."
        else:
            message = f"Your GST is balanced this {period_label}. No payment or refund needed."
        
        # Determine status
        if net_gst > 0:
            status = "payable"
        elif net_gst < 0:
            status = "refundable"
        else:
            status = "neutral"
        
        return {
            "output_gst": round(output_gst, 2),
            "input_gst": round(input_gst, 2),
            "net_gst": round(net_gst, 2),
            "message": message,
            "warning": None,
            "status": status
        }
    except Exception as e:
        print(f"Calculation error: {e}")
        raise e

# Routes
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/zoom-scheduler')
def zoom_scheduler():
    return send_from_directory('static', 'zoom-scheduler.html')

@app.route('/caa-meetings')
def caa_meetings():
    return send_from_directory('static', 'caa-meetings.html')

@app.route('/business-trends')
def business_trends():
    return send_from_directory('static', 'business-trends.html')

@app.route('/schemes')
def schemes():
    return send_from_directory('static', 'schemes.html')

@app.route('/knowledge-base')
def knowledge_base():
    return send_from_directory('static', 'knowledge-base.html')

@app.route('/google-meet')
def google_meet():
    return send_from_directory('static', 'google-meet.html')

@app.route('/about')
def about():
    return send_from_directory('static', 'about.html')

@app.route('/wireframes')
def wireframes():
    return send_from_directory('static', 'wireframes.html')

@app.route('/oauth2callback')
def oauth2callback():
    """OAuth 2.0 callback for Google API authentication"""
    try:
        from app.google_meet import get_google_meet
        
        # Get authorization code from query parameters
        code = request.args.get('code')
        error = request.args.get('error')
        
        if error:
            return f"""
            <html>
                <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
                    <h2 style="color: #d32f2f;">❌ Authorization Failed</h2>
                    <p>Error: {error}</p>
                    <p><a href="/">Return to Home</a></p>
                </body>
            </html>
            """, 400
        
        if code:
            # The authentication flow will handle the code
            # This is just a success page
            return """
            <html>
                <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
                    <h2 style="color: #4caf50;">✅ Authorization Successful!</h2>
                    <p>Google Meet integration is now active.</p>
                    <p>You can close this window and create CAA meetings with automatic Google Meet links.</p>
                    <p><a href="/caa-meetings" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #4285f4; color: white; text-decoration: none; border-radius: 4px;">Create Meeting</a></p>
                </body>
            </html>
            """
        else:
            return """
            <html>
                <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
                    <h2 style="color: #ff9800;">⚠️ Invalid Request</h2>
                    <p>No authorization code received.</p>
                    <p><a href="/">Return to Home</a></p>
                </body>
            </html>
            """, 400
            
    except Exception as e:
        print(f"OAuth callback error: {e}")
        return f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
                <h2 style="color: #d32f2f;">❌ Error</h2>
                <p>{str(e)}</p>
                <p><a href="/">Return to Home</a></p>
            </body>
        </html>
        """, 500

@app.route('/health')
def health():
    return jsonify({"status": "ok", "app": "TaxClam"}), 200

@app.route('/auth')
def auth():
    return send_from_directory('static', 'auth.html')

@app.route('/api/auth/signin', methods=['POST'])
def signin():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    # 📝 Simple simulation - in a real app, verify against DB
    if username and password:
        return jsonify({"success": True, "message": "Logged in successfully"}), 200
    return jsonify({"success": False, "error": "Invalid credentials"}), 401

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    from datetime import datetime
    import hashlib
    
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    has_gst = data.get('has_gst', False)
    
    # Simulate DB registration
    try:
        from app.finance_models import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        
        timestamp = datetime.now().isoformat()
        pass_hash = hashlib.sha256(password.encode()).hexdigest()
        
        gstin = data.get('gstin')
        aadhar = data.get('aadhar')
        pan = data.get('pan')
        
        # Data Simulation logic
        fetched_data = {}
        if has_gst and gstin:
            # Simulate fetching from GST Portal
            fetched_data = {
                "name": f"Business of {username}",
                "status": "Active",
                "type": "Regular",
                "state": "Maharashtra"
            }
        elif aadhar and pan:
            # Simulate fetching from UIDAI/IT Dept
            fetched_data = {
                "name": username.replace('_', ' ').title(),
                "verified": True,
                "category": "Individual"
            }

        cursor.execute('''
            INSERT INTO users (username, email, password_hash, gstin, aadhar_num, pan_num, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (username, email, pass_hash, gstin, aadhar, pan, timestamp, timestamp))
        
        user_id = cursor.lastrowid

        # Also upsert user_profiles with identity details
        identity_type = 'gst' if has_gst and gstin else 'individual'
        cursor.execute('''
            INSERT INTO user_profiles
                (user_id, identity_type, gstin, aadhar_num, pan_num, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                identity_type = excluded.identity_type,
                gstin         = excluded.gstin,
                aadhar_num    = excluded.aadhar_num,
                pan_num       = excluded.pan_num,
                updated_at    = excluded.updated_at
        ''', (user_id, identity_type, gstin, aadhar, pan, timestamp, timestamp))

        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True, 
            "message": "User registered successfully",
            "user_id": user_id,
            "fetched_data": fetched_data
        }), 201
        
    except Exception as e:
        print(f"Signup error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# ── GST Details Simulation ────────────────────────────────────────────────────
@app.route('/api/auth/fetch-gst', methods=['POST'])
def fetch_gst():
    """Simulate fetching business details from GSTN portal by GSTIN."""
    import re
    data  = request.json or {}
    gstin = (data.get('gstin') or '').strip().upper()

    # Validate GSTIN format: 15 chars, state(2)+PAN(10)+entity(1)+Z+chk(1)
    gst_pattern = re.compile(r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$')
    if not gst_pattern.match(gstin):
        return jsonify({"success": False, "error": "Invalid GSTIN format."}), 400

    # State code lookup (first 2 digits)
    STATE_CODES = {
        "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
        "04": "Chandigarh",      "05": "Uttarakhand",       "06": "Haryana",
        "07": "Delhi",           "08": "Rajasthan",         "09": "Uttar Pradesh",
        "10": "Bihar",           "11": "Sikkim",            "12": "Arunachal Pradesh",
        "13": "Nagaland",        "14": "Manipur",           "15": "Mizoram",
        "16": "Tripura",         "17": "Meghalaya",         "18": "Assam",
        "19": "West Bengal",     "20": "Jharkhand",         "21": "Odisha",
        "22": "Chhattisgarh",    "23": "Madhya Pradesh",    "24": "Gujarat",
        "25": "Daman & Diu",     "26": "Dadar & Nagar Haveli", "27": "Maharashtra",
        "28": "Andhra Pradesh",  "29": "Karnataka",         "30": "Goa",
        "31": "Lakshadweep",     "32": "Kerala",            "33": "Tamil Nadu",
        "34": "Puducherry",      "35": "Andaman & Nicobar", "36": "Telangana",
        "37": "AP (New)",
    }
    state_code  = gstin[:2]
    pan_segment = gstin[2:12]
    state_name  = STATE_CODES.get(state_code, f"State {state_code}")

    # Determine entity type from 3rd char of PAN (position 2 overall)
    pan_3rd = pan_segment[2].upper()
    type_map = {'P':'Individual','F':'Firm/LLP','C':'Company','H':'HUF','A':'AOP','B':'BOI','G':'Govt','J':'AJP','L':'Local Authority','T':'AOP/Trust'}
    biz_types = {'P':'Proprietor','F':'Partnership / LLP','C':'Private / Public Ltd','H':'HUF','G':'Government','T':'Trust'}
    business_type = biz_types.get(pan_3rd, 'Enterprise')

    # Build simulated response
    name_parts = ['M/s ', pan_segment[:5].title(), ' & Co.']
    legal_name  = ''.join(name_parts)

    return jsonify({
        "success":       True,
        "gstin":         gstin,
        "legal_name":    legal_name,
        "trade_name":    legal_name.replace('M/s ', '').strip(),
        "status":        "Active",
        "business_type": business_type,
        "state":         state_name,
        "registration_date": "2019-07-01",
        "note":          "Simulated data — connect to GSTN API in production."
    }), 200


# ── Identity Verification Simulation ─────────────────────────────────────────
@app.route('/api/auth/verify-identity', methods=['POST'])
def verify_identity():
    """Simulate identity verification via Aadhaar + PAN."""
    import re
    data   = request.json or {}
    aadhar = re.sub(r'\D', '', data.get('aadhar') or '')
    pan    = (data.get('pan') or '').strip().upper()

    errors = []
    if not re.match(r'^[2-9][0-9]{11}$', aadhar):
        errors.append("Invalid Aadhaar number (must be 12 digits, starting 2–9).")
    if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', pan):
        errors.append("Invalid PAN format (expected ABCDE1234F).")

    if errors:
        return jsonify({"success": False, "error": " | ".join(errors)}), 400

    # Determine taxpayer type from PAN 4th letter
    pan_type_map = {
        'P': 'Individual', 'H': 'Hindu Undivided Family',
        'F': 'Firm',       'C': 'Company',
        'A': 'AOP',        'B': 'BOI',
        'G': 'Govt',       'J': 'Artificial Juridical Person',
        'L': 'Local Authority', 'T': 'Trust',
    }
    pan_type = pan_type_map.get(pan[3], 'Individual')

    # Build a plausible simulated name from PAN
    first = pan[:2].title()
    last  = pan[2:5].title()
    simulated_name = f"{first}. {last}"

    return jsonify({
        "success":   True,
        "name":      simulated_name,
        "category":  pan_type,
        "pan_type":  pan_type,
        "verified":  True,
        "note":      "Simulated data — connect to UIDAI/IT Dept API in production."
    }), 200


@app.route('/calculate-gst', methods=['POST', 'OPTIONS'])
def api_calculate_gst():
    """Calculate GST endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.json
        
        sales = float(data.get('sales', 0))
        purchases = float(data.get('purchases', 0))
        rate = float(data.get('rate', 12))
        period = str(data.get('period', 'monthly'))
        
        print(f"Calculating: sales={sales}, purchases={purchases}, rate={rate}%, period={period}")
        
        result = calculate_gst(sales, purchases, rate, period)
        
        print(f"Success: {result}")
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Error in calculate_gst: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            "output_gst": 0,
            "input_gst": 0,
            "net_gst": 0,
            "message": "Error in calculation. Please check your inputs.",
            "warning": str(e),
            "status": "neutral"
        }), 200

@app.route('/generate-pdf', methods=['POST', 'OPTIONS'])
def generate_pdf():
    """
    PDF generation endpoint - returns HTML content for client-side generation
    The frontend will use html2pdf.js to generate the PDF in the browser
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.json
        html_content = data.get('html', '<html><body>No content</body></html>')
        filename = data.get('filename', 'gst_report.pdf')
        
        # Return success response with the HTML content
        # The client will use html2pdf.js to generate the PDF
        return jsonify({
            "success": True,
            "message": "Ready to generate PDF on client side",
            "html": html_content,
            "filename": filename
        }), 200
        
    except Exception as e:
        print(f"PDF Generation Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            "success": False,
            "error": "Failed to process PDF request",
            "message": str(e)
        }), 500

@app.route('/download-pdf', methods=['POST', 'OPTIONS'])
def download_pdf():
    """
    Alternative PDF download endpoint
    Uses client-side html2pdf.js for PDF generation (no server dependencies)
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.json
        html_content = data.get('html', '<html><body>No content</body></html>')
        filename = data.get('filename', 'gst_report.pdf')
        
        # Return the HTML for client-side processing
        # The client will handle PDF generation with html2pdf.js
        return jsonify({
            "success": True,
            "method": "client-side",
            "html": html_content,
            "filename": filename
        }), 200
        
    except Exception as e:
        print(f"PDF Download Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            "success": False,
            "error": "Failed to download PDF",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("TaxClam Server (Flask)")
    print("=" * 60)
    print("Starting server...")
    print("Open browser: http://localhost:1000")
    print("Press Ctrl+C to stop")
    print("=" * 60 + "\n")
    
    app.run(host='0.0.0.0', port=1000, debug=False, use_reloader=False)
