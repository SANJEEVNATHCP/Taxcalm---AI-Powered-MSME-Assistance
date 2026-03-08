#!/usr/bin/env python
"""
🚀 START UNIFIED SERVER
Single command to run all services in one unified server

Usage:
    python start_unified_server.py
"""

import subprocess
import sys
import os

def main():
    print("\n" + "=" * 70)
    print("🚀 STARTING UNIFIED SERVER")
    print("=" * 70)
    print("This command starts ALL services in ONE unified server:")
    print("  ✓ Finance & Accounting")
    print("  ✓ GST Calculator")
    print("  ✓ Zoom Meeting Scheduler")
    print("  ✓ RAG System & AI Chat")
    print("  ✓ Google Meet Integration")
    print("=" * 70)
    print("\n📍 Server will run on: http://localhost:8000")
    print("📍 API Docs: http://localhost:8000/docs")
    print("📍 ReDoc: http://localhost:8000/redoc")
    print("\nPress Ctrl+C to stop the server\n")
    
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    unified_server = os.path.join(script_dir, 'unified_server.py')
    
    # Run the unified server
    try:
        subprocess.run([
            sys.executable, 
            unified_server
        ], check=True)
    except KeyboardInterrupt:
        print("\n" + "=" * 70)
        print("✖️ Server stopped by user")
        print("=" * 70 + "\n")
    except Exception as e:
        print(f"\n❌ Error: {e}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
