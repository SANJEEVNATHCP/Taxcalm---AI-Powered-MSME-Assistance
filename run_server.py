#!/usr/bin/env python
"""Simple server runner for GST Stress-Reducer"""

import uvicorn
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

if __name__ == "__main__":
    print("Starting GST Stress-Reducer Server...")
    print("Server will run at: http://localhost:8000")
    print("Auto-reload: Disabled")
    print("=" * 60)
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )
