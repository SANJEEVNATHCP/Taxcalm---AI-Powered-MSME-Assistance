"""
Migration Script: Add Invoice and Bank Reconciliation Fields
Adds new columns to existing transactions table without breaking current data
"""

import sqlite3
import os
import sys
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db_config import get_db_connection, USE_RDS

def add_column_safely(cursor, table_name, column_name, column_type, default_value=None):
    """Add column to table if it doesn't exist"""
    try:
        # Check if column exists
        if USE_RDS:
            cursor.cursor.execute(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='{table_name}' AND column_name='{column_name}'
            """)
            exists = cursor.cursor.fetchone()
        else:
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = [row[1] for row in cursor.fetchall()]
            exists = column_name in columns
        
        if not exists:
            default_clause = f"DEFAULT {default_value}" if default_value else ""
            alter_sql = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type} {default_clause}"
            
            if USE_RDS:
                cursor.cursor.execute(alter_sql)
            else:
                cursor.execute(alter_sql)
            
            print(f"✅ Added column '{column_name}' to table '{table_name}'")
            return True
        else:
            print(f"ℹ️  Column '{column_name}' already exists in '{table_name}'")
            return False
    except Exception as e:
        print(f"⚠️  Error adding column '{column_name}': {e}")
        return False

def run_migration():
    """Run the migration to add invoice and bank fields"""
    print("🔄 Starting migration: Add Invoice & Bank Reconciliation Fields")
    print(f"   Database: {'PostgreSQL (RDS)' if USE_RDS else 'SQLite (Local)'}")
    print(f"   Date: {datetime.now().isoformat()}\n")
    
    conn = None
    changes_made = False
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Add new columns to transactions table
        print("📊 Migrating 'transactions' table...")
        
        changes_made |= add_column_safely(cursor, 'transactions', 'invoice_id', 'INTEGER', 'NULL')
        changes_made |= add_column_safely(cursor, 'transactions', 'customer_id', 'INTEGER', 'NULL')
        changes_made |= add_column_safely(cursor, 'transactions', 'bank_transaction_id', 'INTEGER', 'NULL')
        changes_made |= add_column_safely(cursor, 'transactions', 'bank_account_id', 'INTEGER', 'NULL')
        changes_made |= add_column_safely(cursor, 'transactions', 'reconciliation_status', 'TEXT', "'pending'")
        changes_made |= add_column_safely(cursor, 'transactions', 'reconciled_date', 'TEXT', 'NULL')
        
        # Commit changes
        conn.commit()
        
        print("\n" + "="*60)
        if changes_made:
            print("✅ Migration completed successfully!")
            print("   Summary: New columns added to support invoice and bank reconciliation")
            print("   Existing data: Preserved (NULL values for new columns)")
        else:
            print("ℹ️  Migration skipped - all columns already exist")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        if conn:
            conn.rollback()
        sys.exit(1)
    finally:
        if conn:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    run_migration()
