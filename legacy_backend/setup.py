#!/usr/bin/env python3
"""
TAXCLAM Setup and Initialization Script
Automates initial setup, database creation, and configuration checks
"""

import os
import sys
import subprocess
import secrets
import base64
from pathlib import Path


def print_header(title):
    """Print a formatted header"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def print_success(message):
    """Print success message"""
    print(f"✅ {message}")


def print_warning(message):
    """Print warning message"""
    print(f"⚠️  {message}")


def print_error(message):
    """Print error message"""
    print(f"❌ {message}")


def check_python_version():
    """Check if Python version is compatible"""
    print_header("Checking Python Version")
    
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print_error(f"Python 3.8+ required. Current version: {version.major}.{version.minor}.{version.micro}")
        return False
    
    print_success(f"Python {version.major}.{version.minor}.{version.micro} - Compatible")
    return True


def install_dependencies():
    """Install required dependencies"""
    print_header("Installing Dependencies")
    
    try:
        print("Installing packages from requirements.txt...")
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print_success("All dependencies installed successfully")
            return True
        else:
            print_error("Failed to install dependencies")
            print(result.stderr)
            return False
    except Exception as e:
        print_error(f"Error installing dependencies: {e}")
        return False


def create_env_file():
    """Create .env file with secure defaults"""
    print_header("Creating Environment Configuration")
    
    env_file = Path(".env")
    
    if env_file.exists():
        response = input("⚠️  .env file already exists. Overwrite? (y/N): ")
        if response.lower() != 'y':
            print("Skipping .env creation")
            return True
    
    # Generate secure keys
    jwt_secret = secrets.token_urlsafe(32)
    encryption_key = base64.b64encode(secrets.token_bytes(32)).decode()
    
    env_content = f"""# TAXCLAM Environment Configuration
# Generated: {__import__('datetime').datetime.now().isoformat()}

# === CRITICAL SECURITY SETTINGS ===
# CHANGE THESE IN PRODUCTION!
JWT_SECRET_KEY={jwt_secret}
ENCRYPTION_KEY={encryption_key}
DEBUG=true

# === Database Configuration ===
# Leave empty to use SQLite (default)
DB_HOST=
DB_PORT=5432
DB_NAME=
DB_USER=
DB_PASSWORD=

# === Email Service (SMTP) ===
# Configure for password reset functionality
SMTP_EMAIL=
SMTP_PASSWORD=
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587

# === Application Settings ===
APP_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000
LOG_LEVEL=INFO

# === Optional Integrations ===
OPENROUTER_API_KEY=
ZOOM_ACCOUNT_ID=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# === Notes ===
# 1. JWT_SECRET_KEY: Keep secret, change in production
# 2. ENCRYPTION_KEY: Keep secret, never lose this (data will be unrecoverable)
# 3. DEBUG: Set to 'false' in production
# 4. SMTP: Configure for password reset emails
# 5. Optional services: Add keys only if using those features
"""
    
    try:
        with open(env_file, 'w') as f:
            f.write(env_content)
        print_success(".env file created with secure defaults")
        print_warning("Remember to configure SMTP settings for email functionality")
        print_warning("Set DEBUG=false for production deployment")
        return True
    except Exception as e:
        print_error(f"Failed to create .env file: {e}")
        return False


def initialize_database():
    """Initialize database with tables and indexes"""
    print_header("Initializing Database")
    
    try:
        from app.db_config import init_database
        from app.db_optimizer import setup_database_indexes
        
        print("Creating database tables...")
        init_database()
        print_success("Database tables created")
        
        print("Setting up performance indexes...")
        setup_database_indexes()
        print_success("Database indexes created")
        
        return True
    except Exception as e:
        print_error(f"Database initialization failed: {e}")
        return False


def create_directories():
    """Create necessary directories"""
    print_header("Creating Directories")
    
    directories = ['logs', 'rag_data', 'static', 'static/uploads']
    
    for directory in directories:
        path = Path(directory)
        if not path.exists():
            path.mkdir(parents=True, exist_ok=True)
            print_success(f"Created directory: {directory}")
        else:
            print(f"  Directory exists: {directory}")
    
    return True


def run_health_check():
    """Run system health check"""
    print_header("Running Health Check")
    
    try:
        from app.health_checks import get_health_checker
        
        checker = get_health_checker()
        status = checker.run_all_checks()
        
        print(f"\nOverall Status: {status['overall_status'].upper()}")
        print(f"Healthy Checks: {status['healthy_checks']}/{status['total_checks']}")
        
        # Show any issues
        issues = []
        for name, check in status['checks'].items():
            if check['status'] in ['unhealthy', 'degraded']:
                issues.append(f"{name}: {check.get('message', 'Unknown issue')}")
        
        if issues:
            print_warning("Issues detected:")
            for issue in issues:
                print(f"  - {issue}")
        else:
            print_success("All systems operational")
        
        return True
    except Exception as e:
        print_error(f"Health check failed: {e}")
        return False


def print_next_steps():
    """Print next steps for the user"""
    print_header("Setup Complete!")
    
    print("""
Next Steps:

1. Configure your .env file:
   - Set SMTP credentials for email functionality
   - Set DEBUG=false for production
   - Configure optional integrations as needed

2. Start the development server:
   python unified_server.py

3. Access the application:
   - Web Interface: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/api/health/detailed

4. For production deployment:
   - Read DEPLOYMENT_GUIDE.md
   - Use gunicorn/uvicorn workers
   - Setup Nginx reverse proxy
   - Enable SSL with Let's Encrypt

5. Recommended: Configure backups
   - Database: Copy finance.db regularly
   - RAG data: Backup rag_data/ directory
   - Logs: Archive logs/ directory

For help and documentation:
   - README.md - Overview and features
   - DEPLOYMENT_GUIDE.md - Production deployment
   - CORE_WORK_SUMMARY.md - System improvements
   - /docs - Interactive API documentation
""")


def main():
    """Main setup routine"""
    print("""
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║                  TAXCLAM Setup & Initialization                  ║
║            GST Calculator & Finance Management System            ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
""")
    
    steps = [
        ("Python Version Check", check_python_version),
        ("Install Dependencies", install_dependencies),
        ("Environment Configuration", create_env_file),
        ("Directory Structure", create_directories),
        ("Database Initialization", initialize_database),
        ("Health Check", run_health_check),
    ]
    
    failed = False
    for step_name, step_func in steps:
        try:
            if not step_func():
                failed = True
                print_error(f"{step_name} failed")
                break
        except Exception as e:
            print_error(f"{step_name} failed: {e}")
            failed = True
            break
    
    if not failed:
        print_next_steps()
        print("\n✅ Setup completed successfully!\n")
        return 0
    else:
        print("\n❌ Setup failed. Please fix the errors and try again.\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
