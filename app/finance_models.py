"""
Finance & Compliance Module - Database Models
SQLite-based models for accounting, GST, income tax, payroll, and reports
"""

import sqlite3
import os
from datetime import datetime
import json
import logging
from cryptography.fernet import Fernet

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database path
DATABASE_PATH = os.path.join(os.path.dirname(__file__), '..', 'finance.db')

# Encryption key (should be stored securely in production)
ENCRYPTION_KEY = Fernet.generate_key()
cipher = Fernet(ENCRYPTION_KEY)

def encrypt_data(data):
    """Encrypt sensitive data."""
    if data:
        return cipher.encrypt(data.encode()).decode()
    return None

def decrypt_data(data):
    """Decrypt sensitive data."""
    if data:
        return cipher.decrypt(data.encode()).decode()
    return None

def get_db_connection():
    """Get database connection with context management."""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        logger.error(f"Database connection error: {e}")
        raise

def add_column_if_not_exists(cursor, table, column, column_type):
    """Add a column to a table if it does not exist."""
    try:
        cursor.execute(f"SELECT {column} FROM {table} LIMIT 1")
    except sqlite3.OperationalError:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {column_type}")
        logger.info(f"Added column '{column}' to table '{table}'")

def init_database():
    """Initialize all database tables with error handling."""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Example: Create users table
        try:
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'User',
                    gstin TEXT,
                    aadhar_num TEXT,
                    pan_num TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            ''')
            logger.info("Users table initialized.")
        except sqlite3.Error as e:
            logger.error(f"Error creating users table: {e}")

        # Add columns if they don't exist
        add_column_if_not_exists(cursor, 'users', 'identity_verified', 'INTEGER DEFAULT 0')
        add_column_if_not_exists(cursor, 'users', 'gstin', 'TEXT')
        add_column_if_not_exists(cursor, 'users', 'aadhar_num', 'TEXT')
        add_column_if_not_exists(cursor, 'users', 'pan_num', 'TEXT')

        # Commit changes
        conn.commit()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
    finally:
        if conn:
            conn.close()
            logger.info("Database connection closed.")

# Initialize database on import
try:
    init_database()
except Exception as e:
    print(f"Database initialization error: {e}")
