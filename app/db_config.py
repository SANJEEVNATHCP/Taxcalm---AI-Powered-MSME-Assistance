"""
Database configuration for AWS RDS PostgreSQL
Supports both SQLite (local) and PostgreSQL (RDS)
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Detect which database to use
USE_RDS = os.getenv('DB_HOST') is not None

if USE_RDS:
    # AWS RDS PostgreSQL
    import psycopg2
    from psycopg2 import sql
    
    def get_db_connection():
        """Connect to AWS RDS PostgreSQL"""
        try:
            conn = psycopg2.connect(
                host=os.getenv('DB_HOST'),
                port=int(os.getenv('DB_PORT', 5432)),
                database=os.getenv('DB_NAME'),
                user=os.getenv('DB_USER'),
                password=os.getenv('DB_PASSWORD')
            )
            return conn
        except Exception as e:
            print(f"❌ RDS Connection Error: {e}")
            raise
    
    # Cursor helper for RDS (dict-like rows)
    class RDSCursor:
        def __init__(self, cursor):
            self.cursor = cursor
        
        def fetchone(self):
            result = self.cursor.fetchone()
            if result and self.cursor.description:
                cols = [desc[0] for desc in self.cursor.description]
                return dict(zip(cols, result))
            return result
        
        def fetchall(self):
            results = self.cursor.fetchall()
            if results and self.cursor.description:
                cols = [desc[0] for desc in self.cursor.description]
                return [dict(zip(cols, row)) for row in results]
            return results
        
        def __getattr__(self, name):
            return getattr(self.cursor, name)

else:
    # Local SQLite (fallback)
    import sqlite3
    
    def get_db_connection():
        """Connect to local SQLite database"""
        conn = sqlite3.connect('finance.db')
        conn.row_factory = sqlite3.Row
        return conn
    
    RDSCursor = None


def init_database():
    """Initialize database with all tables"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print("🔄 Initializing database...")
    
    # Create tables (same schema for both SQLite and PostgreSQL)
    # ... (your existing CREATE TABLE statements here)
    
    conn.commit()
    cursor.close()
    conn.close()
    print("✅ Database initialized successfully!")
