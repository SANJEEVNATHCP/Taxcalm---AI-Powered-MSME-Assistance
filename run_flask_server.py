#!/usr/bin/env python
"""
GST Stress-Reducer Flask Server
Simple, stable server for Windows
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import json

app = Flask(__name__, static_folder='static', static_url_path='/static')

# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*"}})

# GST Calculation
def calculate_gst(sales, purchases, rate, period):
    """Calculate GST"""
    rate_decimal = rate / 100
    output_gst = sales * rate_decimal
    input_gst = purchases * rate_decimal
    net_gst = output_gst - input_gst
    
    # Generate message
    period_label = "week" if period.lower() == "weekly" else "month"
    if net_gst > 0:
        message = f"You need to keep aside ₹{net_gst:,.0f} for GST this {period_label}."
    elif net_gst < 0:
        message = f"You may get a GST refund of ₹{abs(net_gst):,.0f} this {period_label}."
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

# Routes
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/caa-meetings')
def caa_meetings():
    """CAA Meetings page"""
    return send_from_directory('static', 'caa-meetings.html')

@app.route('/google-meet')
def google_meet():
    """Google Meet page"""
    return send_from_directory('static', 'google-meet.html')

@app.route('/knowledge-base')
def knowledge_base():
    """Knowledge Base page"""
    return send_from_directory('static', 'knowledge-base.html')

@app.route('/business-trends')
def business_trends():
    """Business Trends page"""
    return send_from_directory('static', 'business-trends.html')

@app.route('/schemes')
def schemes():
    """Schemes page"""
    return send_from_directory('static', 'schemes.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files"""
    if path != "" and os.path.exists(os.path.join('static', path)):
        return send_from_directory('static', path)
    return send_from_directory('static', 'index.html')

@app.route('/health')
def health():
    return jsonify({"status": "ok", "app": "GST Stress-Reducer"})

@app.route('/ask-gst', methods=['POST', 'OPTIONS'])
def ask_gst():
    """AI Assistant endpoint for GST questions"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        question = data.get('question', '').lower()
        
        # Simple keyword-based responses
        if 'calculate' in question or 'calculator' in question:
            return jsonify({
                "message": "I can help you calculate GST! Use the GST Calculator section to enter your sales, purchases, and GST rate. I'll instantly show you the tax payable or refundable.",
                "response_type": "text",
                "question": data.get('question', '')
            }), 200
        
        elif 'rate' in question or 'percentage' in question:
            return jsonify({
                "message": "GST rates in India are: 5%, 12%, 18%, and 28%. Most services are 18%. Essential goods are 5%, and luxury items are 28%. What would you like to know more about?",
                "response_type": "text",
                "question": data.get('question', '')
            }), 200
        
        elif 'register' in question or 'registration' in question:
            return jsonify({
                "message": "GST registration is mandatory if your turnover exceeds ₹40 lakhs (₹20 lakhs for services). You can register online at the GST portal. Need help with the process?",
                "response_type": "text",
                "question": data.get('question', '')
            }), 200
        
        elif 'file' in question or 'filing' in question or 'return' in question:
            return jsonify({
                "message": "GST returns (GSTR-1 and GSTR-3B) are filed monthly or quarterly depending on your turnover. GSTR-1 is for outward supplies, GSTR-3B is for payment. Deadlines are typically by the 11th and 20th of the following month.",
                "response_type": "text",
                "question": data.get('question', '')
            }), 200
        
        elif 'invoice' in question or 'bill' in question:
            return jsonify({
                "message": "GST invoices must include: Invoice number, date, GSTIN of supplier and recipient, HSN/SAC code, taxable value, GST rate, and total amount. Keep all invoices for 6 years for compliance.",
                "response_type": "text",
                "question": data.get('question', '')
            }), 200
        
        else:
            return jsonify({
                "message": "I'm your TaxCalm Assistant! I can help with GST calculations, rates, registration, filing returns, invoicing, and compliance. What would you like to know?",
                "response_type": "text",
                "question": data.get('question', '')
            }), 200
        
    except Exception as e:
        print(f"Error in ask_gst: {e}")
        return jsonify({
            "message": "Sorry, I encountered an error. Please try asking your question again.",
            "response_type": "error"
        }), 200

@app.route('/api/ai/status', methods=['GET'])
def ai_status():
    """Check AI service status"""
    return jsonify({
        "status": "active",
        "service": "AI Chat Assistant",
        "features": ["gst_chat", "compliance_check", "basic_guidance"]
    }), 200

@app.route('/api/ai/enhanced-chat', methods=['POST', 'OPTIONS'])
def enhanced_chat():
    """Enhanced AI chat endpoint"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        # Get message from request
        message = data.get('message', '') or data.get('question', '')
        question = message.lower()
        
        # Simple keyword-based responses
        if 'calculate' in question or 'calculator' in question:
            response_msg = "I can help you calculate GST! Use the GST Calculator section to enter your sales, purchases, and GST rate. I'll instantly show you the tax payable or refundable."
        
        elif 'rate' in question or 'percentage' in question or 'what is gst' in question:
            response_msg = "GST rates in India are: 5%, 12%, 18%, and 28%. Most services are 18%. Essential goods are 5%, and luxury items are 28%. What would you like to know more about?"
        
        elif 'register' in question or 'registration' in question:
            response_msg = "GST registration is mandatory if your turnover exceeds ₹40 lakhs (₹20 lakhs for services). You can register online at the GST portal. Need help with the process?"
        
        elif 'file' in question or 'filing' in question or 'return' in question:
            response_msg = "GST returns (GSTR-1 and GSTR-3B) are filed monthly or quarterly depending on your turnover. GSTR-1 is for outward supplies, GSTR-3B is for payment. Deadlines are typically by the 11th and 20th of the following month."
        
        elif 'invoice' in question or 'bill' in question:
            response_msg = "GST invoices must include: Invoice number, date, GSTIN of supplier and recipient, HSN/SAC code, taxable value, GST rate, and total amount. Keep all invoices for 6 years for compliance."
        
        elif 'refund' in question:
            response_msg = "You can claim GST refund for excess input tax credit, zero-rated supplies, or exports. File refund application in Form RFD-01 on GST portal within 2 years from the relevant date."
        
        elif 'compliance' in question or 'deadline' in question:
            response_msg = "Key GST compliance deadlines: GSTR-1 by 11th, GSTR-3B by 20th of next month. Annual return (GSTR-9) by Dec 31st. Stay compliant to avoid penalties!"
        
        elif 'penalty' in question or 'fine' in question:
            response_msg = "Late GST filing attracts ₹50/day penalty (₹20/day for nil returns). Late payment incurs 18% interest per annum. File on time to avoid penalties!"
        
        else:
            response_msg = "I'm your TaxCalm Assistant! I can help with GST calculations, rates, registration, filing returns, invoicing, compliance, and more. What would you like to know?"
        
        return jsonify({
            "success": True,
            "message": response_msg,
            "response_type": "text",
            "question": message
        }), 200
        
    except Exception as e:
        print(f"Error in enhanced_chat: {e}")
        return jsonify({
            "success": False,
            "message": "Sorry, I encountered an error. Please try asking your question again.",
            "response_type": "error"
        }), 200

@app.route('/calculate-gst', methods=['POST', 'OPTIONS'])
@app.route('/api/gst/calculate', methods=['POST', 'OPTIONS'])
def api_calculate_gst():
    """Calculate GST endpoint"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        sales = float(data.get('sales', 0))
        purchases = float(data.get('purchases', 0))
        rate = float(data.get('rate', 12))
        period = str(data.get('period', 'monthly')).lower()
        
        # Validate rate
        if rate < 0 or rate > 100:
            rate = 18
        
        result = calculate_gst(sales, purchases, rate, period)
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Error in calculate_gst: {e}")
        return jsonify({
            "output_gst": 0,
            "input_gst": 0,
            "net_gst": 0,
            "message": f"Error: {str(e)}",
            "warning": str(e),
            "status": "neutral"
        }), 200

if __name__ == '__main__':
    print("=" * 60)
    print("GST Stress-Reducer Server")
    print("=" * 60)
    print("Starting Flask server...")
    print("Open browser: http://localhost:8000")
    print("Press Ctrl+C to stop")
    print("=" * 60)
    app.run(host='0.0.0.0', port=8000, debug=False, use_reloader=False)
