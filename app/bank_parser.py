"""
Bank Statement Parser for TaxCalm
Parses bank statements from various Indian banks (CSV/Excel formats)
"""

import pandas as pd
import re
from datetime import datetime
from io import BytesIO
import traceback


class BankStatementParser:
    """Parse bank statements from multiple Indian banks"""
    
    # Bank formats configuration
    BANK_FORMATS = {
        'SBI': {
            'date_column': 'Txn Date',
            'description_column': 'Description',
            'debit_column': 'Debit',
            'credit_column': 'Credit',
            'balance_column': 'Balance',
            'reference_column': 'Ref No./Cheque No.',
            'date_format': '%d %b %Y',
            'skip_rows': 0
        },
        'HDFC': {
            'date_column': 'Date',
            'description_column': 'Narration',
            'debit_column': 'Withdrawal Amt.',
            'credit_column': 'Deposit Amt.',
            'balance_column': 'Closing Balance',
            'reference_column': 'Chq./Ref.No.',
            'date_format': '%d/%m/%y',
            'skip_rows': 0
        },
        'ICICI': {
            'date_column': 'Transaction Date',
            'description_column': 'Transaction Remarks',
            'debit_column': 'Withdrawal',
            'credit_column': 'Deposit',
            'balance_column': 'Balance',
            'reference_column': 'Cheque Number',
            'date_format': '%d-%m-%Y',
            'skip_rows': 0
        },
        'AXIS': {
            'date_column': 'Tran Date',
            'description_column': 'Particulars',
            'debit_column': 'Dr',
            'credit_column': 'Cr',
            'balance_column': 'Balance',
            'reference_column': 'Chq No',
            'date_format': '%d-%m-%Y',
            'skip_rows': 0
        },
        'KOTAK': {
            'date_column': 'Date',
            'description_column': 'Description',
            'debit_column': 'Debit',
            'credit_column': 'Credit',
            'balance_column': 'Balance (INR)',
            'reference_column': 'Reference Number',
            'date_format': '%d-%m-%Y',
            'skip_rows': 0
        }
    }
    
    def __init__(self, bank_name='SBI'):
        """Initialize parser with bank format"""
        self.bank_name = bank_name.upper()
        
        if self.bank_name not in self.BANK_FORMATS:
            raise ValueError(f"Unsupported bank: {bank_name}. Supported banks: {', '.join(self.BANK_FORMATS.keys())}")
        
        self.format_config = self.BANK_FORMATS[self.bank_name]
    
    def detect_file_type(self, file_content, filename):
        """Detect if file is CSV or Excel"""
        if filename.endswith('.csv'):
            return 'csv'
        elif filename.endswith(('.xls', '.xlsx')):
            return 'excel'
        else:
            # Try to detect from content
            try:
                file_content.seek(0)
                first_bytes = file_content.read(4)
                file_content.seek(0)
                
                # Excel files start with specific magic bytes
                if first_bytes[:2] == b'\xd0\xcf' or first_bytes[:2] == b'PK':
                    return 'excel'
                else:
                    return 'csv'
            except:
                return 'csv'
    
    def parse_file(self, file_content, filename):
        """
        Parse bank statement file
        
        Args:
            file_content: File-like object (BytesIO or UploadedFile)
            filename: Original filename
        
        Returns:
            dict with:
                - transactions: List of parsed transactions
                - summary: Summary statistics
                - errors: List of parsing errors
        """
        file_type = self.detect_file_type(file_content, filename)
        file_content.seek(0)
        
        try:
            if file_type == 'csv':
                df = pd.read_csv(file_content, skiprows=self.format_config['skip_rows'])
            else:
                df = pd.read_excel(file_content, skiprows=self.format_config['skip_rows'])
            
            return self.parse_dataframe(df)
            
        except Exception as e:
            traceback.print_exc()
            return {
                'success': False,
                'error': f'Failed to parse file: {str(e)}',
                'transactions': [],
                'summary': {}
            }
    
    def parse_dataframe(self, df):
        """Parse DataFrame into transactions"""
        errors = []
        transactions = []
        
        # Normalize column names (strip whitespace)
        df.columns = df.columns.str.strip()
        
        # Verify required columns exist
        required_cols = [
            self.format_config['date_column'],
            self.format_config['description_column']
        ]
        
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            return {
                'success': False,
                'error': f"Missing required columns: {', '.join(missing_cols)}. Available columns: {', '.join(df.columns)}",
                'transactions': [],
                'summary': {}
            }
        
        # Parse each row
        for idx, row in df.iterrows():
            try:
                transaction = self._parse_row(row, idx)
                if transaction:
                    transactions.append(transaction)
            except Exception as e:
                errors.append({
                    'row': idx + 1,
                    'error': str(e)
                })
        
        # Calculate summary
        summary = self._calculate_summary(transactions, df)
        
        return {
            'success': True,
            'transactions': transactions,
            'summary': summary,
            'errors': errors,
            'total_rows': len(df),
            'parsed_rows': len(transactions)
        }
    
    def _parse_row(self, row, idx):
        """Parse a single row into transaction dict"""
        # Skip empty rows
        if pd.isna(row[self.format_config['date_column']]):
            return None
        
        # Parse date
        date_str = str(row[self.format_config['date_column']])
        try:
            transaction_date = datetime.strptime(date_str, self.format_config['date_format'])
        except:
            # Try alternate formats
            try:
                transaction_date = pd.to_datetime(date_str)
            except:
                raise ValueError(f"Could not parse date: {date_str}")
        
        # Get description
        description = str(row[self.format_config['description_column']]).strip()
        
        # Get amounts
        debit = self._parse_amount(row.get(self.format_config.get('debit_column', ''), 0))
        credit = self._parse_amount(row.get(self.format_config.get('credit_column', ''), 0))
        
        # Determine transaction type
        if credit > 0:
            transaction_type = 'Credit'
            amount = credit
        elif debit > 0:
            transaction_type = 'Debit'
            amount = debit
        else:
            # Skip rows with no amount
            return None
        
        # Get balance if available
        balance = None
        if self.format_config.get('balance_column') in row.index:
            balance = self._parse_amount(row[self.format_config['balance_column']])
        
        # Get reference number
        reference = ''
        if self.format_config.get('reference_column') and self.format_config['reference_column'] in row.index:
            ref_value = row[self.format_config['reference_column']]
            reference = str(ref_value).strip() if pd.notna(ref_value) else ''
        
        # Extract additional metadata
        metadata = self._extract_metadata(description, reference)
        
        return {
            'transaction_date': transaction_date.strftime('%Y-%m-%d'),
            'transaction_type': transaction_type,
            'amount': amount,
            'description': description,
            'reference_number': reference,
            'balance': balance,
            'row_number': idx + 1,
            **metadata
        }
    
    def _parse_amount(self, value):
        """Parse amount string to float"""
        if pd.isna(value) or value == '' or value is None:
            return 0.0
        
        # Convert to string and clean
        amount_str = str(value).strip()
        
        # Remove currency symbols and commas
        amount_str = re.sub(r'[₹$,\s]', '', amount_str)
        
        # Handle negative amounts in parentheses
        if amount_str.startswith('(') and amount_str.endswith(')'):
            amount_str = '-' + amount_str[1:-1]
        
        try:
            return float(amount_str)
        except ValueError:
            return 0.0
    
    def _extract_metadata(self, description, reference):
        """Extract metadata from transaction description"""
        metadata = {
            'upi_id': None,
            'upi_txn_id': None,
            'ifsc_code': None,
            'account_number': None,
            'cheque_number': None
        }
        
        # Extract UPI ID
        upi_pattern = r'([a-zA-Z0-9\.\-_]+@[a-zA-Z]+)'
        upi_match = re.search(upi_pattern, description)
        if upi_match:
            metadata['upi_id'] = upi_match.group(1)
        
        # Extract UPI Transaction ID
        upi_txn_pattern = r'UPI/(\d+)'
        upi_txn_match = re.search(upi_txn_pattern, description, re.IGNORECASE)
        if upi_txn_match:
            metadata['upi_txn_id'] = upi_txn_match.group(1)
        
        # Extract IFSC Code
        ifsc_pattern = r'\b([A-Z]{4}0[A-Z0-9]{6})\b'
        ifsc_match = re.search(ifsc_pattern, description)
        if ifsc_match:
            metadata['ifsc_code'] = ifsc_match.group(1)
        
        # Extract Account Number (last 4 digits usually shown)
        account_pattern = r'A/c\s*[xX*]+(\d{4})'
        account_match = re.search(account_pattern, description, re.IGNORECASE)
        if account_match:
            metadata['account_number'] = account_match.group(1)
        
        # Extract Cheque Number
        cheque_pattern = r'(?:CHQ|CHEQUE|CQ)\s*(?:NO\.?)?[:\s]*(\d+)'
        cheque_match = re.search(cheque_pattern, description, re.IGNORECASE)
        if cheque_match:
            metadata['cheque_number'] = cheque_match.group(1)
        elif reference and reference.isdigit():
            metadata['cheque_number'] = reference
        
        return metadata
    
    def _calculate_summary(self, transactions, df):
        """Calculate summary statistics"""
        if not transactions:
            return {}
        
        credit_txns = [t for t in transactions if t['transaction_type'] == 'Credit']
        debit_txns = [t for t in transactions if t['transaction_type'] == 'Debit']
        
        total_credits = sum(t['amount'] for t in credit_txns)
        total_debits = sum(t['amount'] for t in debit_txns)
        
        # Get date range
        dates = [datetime.strptime(t['transaction_date'], '%Y-%m-%d') for t in transactions]
        start_date = min(dates)
        end_date = max(dates)
        
        # Get opening and closing balance if available
        opening_balance = None
        closing_balance = None
        
        if self.format_config.get('balance_column') in df.columns:
            balances = df[self.format_config['balance_column']].dropna()
            if len(balances) > 0:
                # First non-null balance (might need adjustment based on bank format)
                # Some banks show balance after transaction, others before
                closing_balance = self._parse_amount(balances.iloc[-1])
                
                # Calculate opening balance
                net_change = total_credits - total_debits
                opening_balance = closing_balance - net_change
        
        return {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'total_transactions': len(transactions),
            'credit_count': len(credit_txns),
            'debit_count': len(debit_txns),
            'total_credits': round(total_credits, 2),
            'total_debits': round(total_debits, 2),
            'net_change': round(total_credits - total_debits, 2),
            'opening_balance': round(opening_balance, 2) if opening_balance else None,
            'closing_balance': round(closing_balance, 2) if closing_balance else None
        }
    
    def validate_statement(self, transactions, summary):
        """
        Validate statement for common issues
        
        Returns:
            dict with validation results
        """
        issues = []
        warnings = []
        
        # Check date sequence
        dates = [datetime.strptime(t['transaction_date'], '%Y-%m-%d') for t in transactions]
        if dates != sorted(dates):
            warnings.append('Transactions are not in chronological order')
        
        # Check for date gaps > 90 days
        for i in range(1, len(dates)):
            gap = (dates[i] - dates[i-1]).days
            if gap > 90:
                warnings.append(f'Large date gap found: {gap} days between {dates[i-1].date()} and {dates[i].date()}')
        
        # Validate balance consistency (if available)
        if summary.get('opening_balance') and summary.get('closing_balance'):
            calculated_closing = summary['opening_balance'] + summary['net_change']
            actual_closing = summary['closing_balance']
            
            difference = abs(calculated_closing - actual_closing)
            if difference > 0.10:  # Allow 10 paisa tolerance
                issues.append(f'Balance mismatch: Calculated closing ({calculated_closing:.2f}) != Actual closing ({actual_closing:.2f}). Difference: {difference:.2f}')
        
        # Check for duplicate transactions
        seen = set()
        for txn in transactions:
            key = (txn['transaction_date'], txn['amount'], txn['description'][:50])
            if key in seen:
                warnings.append(f'Potential duplicate transaction: {txn["transaction_date"]} - ₹{txn["amount"]} - {txn["description"][:30]}...')
            seen.add(key)
        
        # Check for unusual amounts
        amounts = [t['amount'] for t in transactions]
        if amounts:
            avg_amount = sum(amounts) / len(amounts)
            for txn in transactions:
                if txn['amount'] > avg_amount * 100:  # More than 100x average
                    warnings.append(f'Unusually large transaction: ₹{txn["amount"]:.2f} on {txn["transaction_date"]}')
        
        return {
            'is_valid': len(issues) == 0,
            'issues': issues,
            'warnings': warnings
        }


def detect_bank_from_filename(filename):
    """Auto-detect bank from filename"""
    filename_upper = filename.upper()
    
    for bank in ['SBI', 'HDFC', 'ICICI', 'AXIS', 'KOTAK']:
        if bank in filename_upper:
            return bank
    
    return 'SBI'  # Default


def detect_bank_from_content(df):
    """Auto-detect bank from DataFrame columns"""
    columns = [col.lower() for col in df.columns]
    
    # SBI keywords
    if 'txn date' in ' '.join(columns) and 'ref no' in ' '.join(columns):
        return 'SBI'
    
    # HDFC keywords
    if 'narration' in columns and 'withdrawal amt' in ' '.join(columns):
        return 'HDFC'
    
    # ICICI keywords
    if 'transaction remarks' in ' '.join(columns):
        return 'ICICI'
    
    # Axis keywords
    if 'tran date' in ' '.join(columns) and 'particulars' in columns:
        return 'AXIS'
    
    # Kotak keywords
    if 'balance (inr)' in ' '.join(columns):
        return 'KOTAK'
    
    return None
