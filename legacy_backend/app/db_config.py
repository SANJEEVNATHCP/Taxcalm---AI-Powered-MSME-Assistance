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


def get_current_timestamp():
    """Get current timestamp in ISO format"""
    from datetime import datetime
    return datetime.now().isoformat()


def init_database():
    """Initialize database with all tables"""
    conn = get_db_connection()
    cursor = conn.cursor() if not USE_RDS else RDSCursor(conn.cursor())
    
    print("🔄 Initializing database...")
    
    # Shared Infrastructure Tables
    
    # Customers Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            gstin TEXT,
            pan_number TEXT,
            billing_address TEXT,
            shipping_address TEXT,
            city TEXT,
            state TEXT,
            state_code TEXT,
            pincode TEXT,
            payment_terms TEXT DEFAULT 'Net30',
            credit_limit DECIMAL(15,2) DEFAULT 0,
            opening_balance DECIMAL(15,2) DEFAULT 0,
            current_balance DECIMAL(15,2) DEFAULT 0,
            status TEXT DEFAULT 'Active',
            user_id INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')
    
    # Bank Accounts Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bank_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_name TEXT NOT NULL,
            account_number TEXT NOT NULL,
            bank_name TEXT NOT NULL,
            branch TEXT,
            ifsc_code TEXT,
            account_type TEXT DEFAULT 'Current',
            currency TEXT DEFAULT 'INR',
            opening_balance DECIMAL(15,2) DEFAULT 0,
            current_balance DECIMAL(15,2) DEFAULT 0,
            opening_date TEXT,
            status TEXT DEFAULT 'Active',
            user_id INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')
    
    # Invoice Management Tables
    
    # Invoices Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_number TEXT UNIQUE NOT NULL,
            customer_id INTEGER NOT NULL,
            invoice_date TEXT NOT NULL,
            due_date TEXT NOT NULL,
            billing_address TEXT,
            shipping_address TEXT,
            subtotal DECIMAL(15,2) DEFAULT 0,
            cgst_amount DECIMAL(15,2) DEFAULT 0,
            sgst_amount DECIMAL(15,2) DEFAULT 0,
            igst_amount DECIMAL(15,2) DEFAULT 0,
            total_tax DECIMAL(15,2) DEFAULT 0,
            discount_amount DECIMAL(15,2) DEFAULT 0,
            grand_total DECIMAL(15,2) DEFAULT 0,
            amount_paid DECIMAL(15,2) DEFAULT 0,
            balance_due DECIMAL(15,2) DEFAULT 0,
            payment_status TEXT DEFAULT 'Unpaid',
            status TEXT DEFAULT 'Draft',
            notes TEXT,
            terms_conditions TEXT,
            bank_account_id INTEGER,
            user_id INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            sent_date TEXT,
            paid_date TEXT,
            FOREIGN KEY (customer_id) REFERENCES customers(id),
            FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id)
        )
    ''')
    
    # Invoice Items Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS invoice_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER NOT NULL,
            line_number INTEGER NOT NULL,
            item_description TEXT NOT NULL,
            hsn_sac_code TEXT,
            quantity DECIMAL(10,2) DEFAULT 1,
            unit_of_measure TEXT DEFAULT 'Nos',
            unit_price DECIMAL(15,2) NOT NULL,
            discount_percent DECIMAL(5,2) DEFAULT 0,
            taxable_amount DECIMAL(15,2) NOT NULL,
            gst_rate DECIMAL(5,2) DEFAULT 0,
            cgst_amount DECIMAL(15,2) DEFAULT 0,
            sgst_amount DECIMAL(15,2) DEFAULT 0,
            igst_amount DECIMAL(15,2) DEFAULT 0,
            total_amount DECIMAL(15,2) NOT NULL,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
        )
    ''')
    
    # Invoice Payments Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS invoice_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER NOT NULL,
            payment_date TEXT NOT NULL,
            amount DECIMAL(15,2) NOT NULL,
            payment_mode TEXT,
            transaction_id INTEGER,
            bank_account_id INTEGER,
            reference_number TEXT,
            notes TEXT,
            user_id INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id),
            FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id)
        )
    ''')
    
    # Recurring Invoices Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS recurring_invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            frequency TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT,
            next_invoice_date TEXT NOT NULL,
            template_data TEXT,
            auto_send INTEGER DEFAULT 0,
            status TEXT DEFAULT 'Active',
            user_id INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (customer_id) REFERENCES customers(id)
        )
    ''')
    
    # Bank Reconciliation Tables
    
    # Bank Statements Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bank_statements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bank_account_id INTEGER NOT NULL,
            statement_date TEXT NOT NULL,
            import_date TEXT NOT NULL,
            file_name TEXT,
            file_hash TEXT,
            opening_balance DECIMAL(15,2) DEFAULT 0,
            closing_balance DECIMAL(15,2) DEFAULT 0,
            total_credits DECIMAL(15,2) DEFAULT 0,
            total_debits DECIMAL(15,2) DEFAULT 0,
            transaction_count INTEGER DEFAULT 0,
            user_id INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id)
        )
    ''')
    
    # Bank Transactions Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bank_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bank_statement_id INTEGER,
            bank_account_id INTEGER NOT NULL,
            transaction_date TEXT NOT NULL,
            value_date TEXT,
            description TEXT,
            reference_number TEXT,
            cheque_number TEXT,
            debit_amount DECIMAL(15,2) DEFAULT 0,
            credit_amount DECIMAL(15,2) DEFAULT 0,
            balance DECIMAL(15,2),
            transaction_type TEXT,
            category TEXT,
            is_reconciled INTEGER DEFAULT 0,
            reconciled_with_invoice INTEGER,
            reconciled_with_transaction INTEGER,
            reconciliation_date TEXT,
            reconciliation_type TEXT,
            notes TEXT,
            user_id INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            FOREIGN KEY (bank_statement_id) REFERENCES bank_statements(id),
            FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
            FOREIGN KEY (reconciled_with_invoice) REFERENCES invoices(id),
            FOREIGN KEY (reconciled_with_transaction) REFERENCES transactions(id)
        )
    ''')
    
    # Reconciliation Rules Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reconciliation_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rule_name TEXT NOT NULL,
            match_field TEXT NOT NULL,
            pattern TEXT NOT NULL,
            category_to_assign TEXT,
            auto_apply INTEGER DEFAULT 0,
            priority INTEGER DEFAULT 0,
            user_id INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')
    
    # Existing Tables - Ensure they exist with new columns
    
    # Transactions Table (with new columns for linking)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_date TEXT NOT NULL,
            type TEXT NOT NULL,
            category TEXT,
            amount DECIMAL(15,2) NOT NULL,
            description TEXT,
            reference_number TEXT,
            payment_mode TEXT,
            invoice_id INTEGER,
            customer_id INTEGER,
            bank_transaction_id INTEGER,
            bank_account_id INTEGER,
            reconciliation_status TEXT DEFAULT 'pending',
            reconciled_date TEXT,
            user_id INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id),
            FOREIGN KEY (customer_id) REFERENCES customers(id),
            FOREIGN KEY (bank_transaction_id) REFERENCES bank_transactions(id),
            FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id)
        )
    ''')
    
    # Audit Log Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT NOT NULL,
            record_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            old_values TEXT,
            new_values TEXT,
            user_id INTEGER,
            ip_address TEXT,
            timestamp TEXT NOT NULL
        )
    ''')
    
    # Create Indexes for Performance
    try:
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_customers_gstin ON customers(gstin)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(payment_status)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON transactions(invoice_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_bank_txn_account ON bank_transactions(bank_account_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_bank_txn_date ON bank_transactions(transaction_date)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_bank_txn_reconciled ON bank_transactions(is_reconciled)')
    except Exception as e:
        print(f"⚠️  Index creation warning: {e}")
    
    conn.commit()
    if hasattr(cursor, 'cursor'):
        cursor.cursor.close()
    else:
        cursor.close()
    conn.close()
    print("✅ Database initialized successfully!")
