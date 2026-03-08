#!/usr/bin/env python
"""
QUICK START - TaxClam Application

This file provides quick start instructions for the unified server.
"""

print("""
================================================================================
                    TAXCLAM - UNIFIED SERVER
================================================================================

Welcome to TaxClam! All services are now consolidated into ONE unified server.

🚀 QUICK START
================================================================================

1. START THE SERVER (Choose one):

   Option A (Recommended):
   $ python start_unified_server.py

   Option B (Direct):
   $ python unified_server.py

   Option C (Custom Port):
   $ python unified_server.py --port 9000

2. OPEN IN BROWSER:

   Main Application:  http://localhost:8000
   API Documentation: http://localhost:8000/docs
   Alternative Docs:  http://localhost:8000/redoc

3. WHAT YOU GET:

   ✓ Finance & Accounting Module
   ✓ GST Calculator
   ✓ Zoom Meeting Scheduler
   ✓ RAG System (Document Search)
   ✓ Google Meet Integration
   ✓ AI Chat Assistant

================================================================================

📖 DOCUMENTATION
================================================================================

See detailed guides in the /docs folder:

   - UNIFIED_SERVER_GUIDE.md       → Complete server documentation
   - START_HERE.md                  → Getting started guide
   - ZOOM_QUICK_START.md            → Zoom integration guide
   - GOOGLE_MEET_QUICK_REFERENCE.md → Google Meet setup
   - FINANCE_QUICK_START.md         → Finance module guide
   - PDF_QUICK_START.md             → PDF export features

================================================================================

🔧 REQUIREMENTS
================================================================================

- Python 3.8+
- Virtual environment (.venv) - already configured
- Dependencies in requirements.txt - already installed

Check environment:
   python -c \"import fastapi; print('All good!')\"

================================================================================

❓ TROUBLESHOOTING
================================================================================

Port 8000 in use?
   $ taskkill /F /IM python.exe

Missing dependencies?
   $ pip install -r requirements.txt

Need more help?
   See docs/UNIFIED_SERVER_GUIDE.md for troubleshooting section

================================================================================

🎯 KEY ENDPOINTS
================================================================================

Health Check:
   GET http://localhost:8000/health

GST Calculator:
   POST http://localhost:8000/api/gst/calculate
   Body: {
     "sales": 100000,
     "purchases": 50000,
     "rate": 18,
     "period": "monthly"
   }

Zoom Scheduler:
   POST http://localhost:8000/api/zoom/schedule
   Body: {
     "input": "Schedule a meeting tomorrow at 3 PM",
     "timezone": "Asia/Kolkata"
   }

Finance Transactions:
   GET http://localhost:8000/api/finance/transactions

Full API Documentation:
   http://localhost:8000/docs

================================================================================

❗ IMPORTANT
================================================================================

All services are now in ONE server. Don't run multiple flask_app.py or
run_server.py instances - they will conflict.

Use THIS unified server for:
- Development
- Testing  
- Production deployment

The old separate servers are deprecated.

================================================================================

Got questions? Check the docs folder or read UNIFIED_SERVER_GUIDE.md

Ready? Start the server now:
   python start_unified_server.py

Happy coding!

================================================================================
""")
