"""
Bank Reconciliation Auto-Matching Engine for TaxCalm
Automatically matches book transactions with bank transactions
"""

from datetime import datetime, timedelta
from fuzzywuzzy import fuzz
import re


class ReconciliationEngine:
    """Auto-match book transactions with bank transactions"""
    
    # Matching confidence thresholds
    HIGH_CONFIDENCE = 95
    MEDIUM_CONFIDENCE = 75
    LOW_CONFIDENCE = 50
    
    def __init__(self, db_connection):
        self.conn = db_connection
        self.cursor = self.conn.cursor()
    
    def auto_match_all(self, bank_account_id, date_range_days=90):
        """
        Run auto-matching for all unmatched transactions
        
        Args:
            bank_account_id: Bank account to reconcile
            date_range_days: Date range to consider for matching (default 90 days)
        
        Returns:
            dict with matching results
        """
        # Get unmatched bank transactions
        bank_transactions = self._get_unmatched_bank_transactions(bank_account_id)
        
        # Get unreconciled book transactions
        book_transactions = self._get_unreconciled_book_transactions(bank_account_id, date_range_days)
        
        matches = []
        high_confidence_matches = []
        medium_confidence_matches = []
        low_confidence_matches = []
        
        for bank_txn in bank_transactions:
            # Try 5-stage matching
            match = self._find_best_match(bank_txn, book_transactions)
            
            if match:
                match_data = {
                    'bank_transaction_id': bank_txn['id'],
                    'book_transaction_id': match['book_txn']['id'],
                    'confidence_score': match['confidence'],
                    'match_reason': match['reason'],
                    'bank_amount': bank_txn['amount'],
                    'book_amount': match['book_txn']['amount'],
                    'bank_date': bank_txn['transaction_date'],
                    'book_date': match['book_txn']['transaction_date'],
                    'bank_description': bank_txn['description'],
                    'book_description': match['book_txn']['description']
                }
                
                matches.append(match_data)
                
                if match['confidence'] >= self.HIGH_CONFIDENCE:
                    high_confidence_matches.append(match_data)
                elif match['confidence'] >= self.MEDIUM_CONFIDENCE:
                    medium_confidence_matches.append(match_data)
                else:
                    low_confidence_matches.append(match_data)
        
        return {
            'total_bank_transactions': len(bank_transactions),
            'total_book_transactions': len(book_transactions),
            'total_matches': len(matches),
            'high_confidence_count': len(high_confidence_matches),
            'medium_confidence_count': len(medium_confidence_matches),
            'low_confidence_count': len(low_confidence_matches),
            'matches': matches,
            'high_confidence_matches': high_confidence_matches,
            'medium_confidence_matches': medium_confidence_matches,
            'low_confidence_matches': low_confidence_matches
        }
    
    def _get_unmatched_bank_transactions(self, bank_account_id):
        """Get all unmatched bank transactions"""
        self.cursor.execute('''
            SELECT * FROM bank_transactions
            WHERE bank_account_id = ? AND reconciliation_status = 'Unmatched'
            ORDER BY transaction_date DESC
        ''', (bank_account_id,))
        
        return [dict(row) for row in self.cursor.fetchall()]
    
    def _get_unreconciled_book_transactions(self, bank_account_id, date_range_days):
        """Get unreconciled book transactions (from transactions table)"""
        cutoff_date = (datetime.now() - timedelta(days=date_range_days)).strftime('%Y-%m-%d')
        
        self.cursor.execute('''
            SELECT * FROM transactions
            WHERE bank_account_id = ? 
            AND reconciliation_status = 'Unreconciled'
            AND transaction_date >= ?
            ORDER BY transaction_date DESC
        ''', (bank_account_id, cutoff_date))
        
        return [dict(row) for row in self.cursor.fetchall()]
    
    def _find_best_match(self, bank_txn, book_transactions):
        """
        Find best matching book transaction for a bank transaction
        Uses 5-stage matching strategy
        """
        # Stage 1: Exact amount + date ±3 days
        match = self._match_stage1_exact_amount_date(bank_txn, book_transactions)
        if match:
            return match
        
        # Stage 2: Reference number match
        match = self._match_stage2_reference_number(bank_txn, book_transactions)
        if match:
            return match
        
        # Stage 3: Invoice number match (for payments)
        match = self._match_stage3_invoice_number(bank_txn, book_transactions)
        if match:
            return match
        
        # Stage 4: Fuzzy description match + similar amount
        match = self._match_stage4_fuzzy_description(bank_txn, book_transactions)
        if match:
            return match
        
        # Stage 5: Pattern rules (from reconciliation_rules table)
        match = self._match_stage5_rules(bank_txn, book_transactions)
        if match:
            return match
        
        return None
    
    def _match_stage1_exact_amount_date(self, bank_txn, book_transactions):
        """Stage 1: Exact amount + date within ±3 days"""
        bank_date = datetime.strptime(bank_txn['transaction_date'], '%Y-%m-%d')
        bank_amount = bank_txn['amount']
        
        for book_txn in book_transactions:
            book_date = datetime.strptime(book_txn['transaction_date'], '%Y-%m-%d')
            book_amount = book_txn['amount']
            
            # Check amount match (±0.10 tolerance)
            amount_match = abs(bank_amount - book_amount) <= 0.10
            
            # Check date match (±3 days)
            date_diff = abs((bank_date - book_date).days)
            date_match = date_diff <= 3
            
            if amount_match and date_match:
                confidence = 99 - (date_diff * 1)  # Reduce confidence for each day difference
                
                return {
                    'book_txn': book_txn,
                    'confidence': confidence,
                    'reason': f'Exact amount match with {date_diff} day(s) difference'
                }
        
        return None
    
    def _match_stage2_reference_number(self, bank_txn, book_transactions):
        """Stage 2: Reference number match"""
        bank_ref = bank_txn.get('reference_number', '').strip()
        
        if not bank_ref or len(bank_ref) < 4:
            return None
        
        for book_txn in book_transactions:
            book_ref = book_txn.get('reference_number', '').strip()
            
            if book_ref and bank_ref == book_ref:
                return {
                    'book_txn': book_txn,
                    'confidence': 98,
                    'reason': f'Reference number match: {bank_ref}'
                }
            
            # Partial match (for long reference numbers)
            if book_ref and len(book_ref) >= 8 and len(bank_ref) >= 8:
                if book_ref in bank_ref or bank_ref in book_ref:
                    return {
                        'book_txn': book_txn,
                        'confidence': 95,
                        'reason': f'Partial reference match: {bank_ref}'
                    }
        
        return None
    
    def _match_stage3_invoice_number(self, bank_txn, book_transactions):
        """Stage 3: Invoice number from description"""
        bank_desc = bank_txn.get('description', '')
        
        # Extract invoice number pattern (INV-YYYY-NNN)
        inv_pattern = r'INV-\d{4}-\d{3,}'
        inv_match = re.search(inv_pattern, bank_desc, re.IGNORECASE)
        
        if not inv_match:
            return None
        
        invoice_number = inv_match.group(0)
        
        # Find book transaction with matching invoice_id
        self.cursor.execute('''
            SELECT t.*, i.invoice_number
            FROM transactions t
            INNER JOIN invoices i ON t.invoice_id = i.id
            WHERE i.invoice_number = ?
        ''', (invoice_number,))
        
        book_txn_row = self.cursor.fetchone()
        
        if book_txn_row:
            book_txn = dict(book_txn_row)
            
            # Verify amount is similar (±10% tolerance for partial payments)
            bank_amount = bank_txn['amount']
            book_amount = book_txn['amount']
            amount_diff_percent = abs(bank_amount - book_amount) / book_amount * 100
            
            if amount_diff_percent <= 10:
                return {
                    'book_txn': book_txn,
                    'confidence': 97,
                    'reason': f'Invoice number match: {invoice_number}'
                }
        
        return None
    
    def _match_stage4_fuzzy_description(self, bank_txn, book_transactions):
        """Stage 4: Fuzzy description match + similar amount"""
        bank_desc = self._clean_description(bank_txn.get('description', ''))
        bank_amount = bank_txn['amount']
        
        if len(bank_desc) < 10:
            return None
        
        best_match = None
        best_score = 0
        
        for book_txn in book_transactions:
            book_desc = self._clean_description(book_txn.get('description', ''))
            book_amount = book_txn['amount']
            
            if len(book_desc) < 10:
                continue
            
            # Fuzzy match score
            fuzzy_score = fuzz.token_set_ratio(bank_desc, book_desc)
            
            # Amount similarity (±5% tolerance)
            amount_diff_percent = abs(bank_amount - book_amount) / book_amount * 100
            amount_similar = amount_diff_percent <= 5
            
            # Combined score
            if amount_similar and fuzzy_score > best_score:
                best_score = fuzzy_score
                best_match = book_txn
        
        if best_match and best_score >= 80:
            return {
                'book_txn': best_match,
                'confidence': best_score,
                'reason': f'Fuzzy description match ({best_score}% similarity)'
            }
        
        return None
    
    def _match_stage5_rules(self, bank_txn, book_transactions):
        """Stage 5: Apply reconciliation rules"""
        # Get applicable rules
        self.cursor.execute('''
            SELECT * FROM reconciliation_rules
            WHERE is_active = 1
            ORDER BY priority DESC
        ''')
        
        rules = [dict(row) for row in self.cursor.fetchall()]
        
        bank_desc = bank_txn.get('description', '').lower()
        
        for rule in rules:
            rule_pattern = rule['pattern'].lower()
            
            # Check if rule pattern matches bank description
            if rule['match_type'] == 'Contains':
                if rule_pattern in bank_desc:
                    # Find book transaction matching rule's book category
                    match = self._find_transaction_by_category(
                        book_transactions,
                        rule['book_category'],
                        bank_txn['amount']
                    )
                    
                    if match:
                        return {
                            'book_txn': match,
                            'confidence': 75,
                            'reason': f'Rule match: {rule["rule_name"]}'
                        }
            
            elif rule['match_type'] == 'StartsWith':
                if bank_desc.startswith(rule_pattern):
                    match = self._find_transaction_by_category(
                        book_transactions,
                        rule['book_category'],
                        bank_txn['amount']
                    )
                    
                    if match:
                        return {
                            'book_txn': match,
                            'confidence': 70,
                            'reason': f'Rule match: {rule["rule_name"]}'
                        }
            
            elif rule['match_type'] == 'Regex':
                if re.search(rule_pattern, bank_desc, re.IGNORECASE):
                    match = self._find_transaction_by_category(
                        book_transactions,
                        rule['book_category'],
                        bank_txn['amount']
                    )
                    
                    if match:
                        return {
                            'book_txn': match,
                            'confidence': 80,
                            'reason': f'Rule match (regex): {rule["rule_name"]}'
                        }
        
        return None
    
    def _find_transaction_by_category(self, book_transactions, category, amount):
        """Find book transaction by category and similar amount"""
        for txn in book_transactions:
            if txn.get('category') == category:
                # Check amount similarity (±10% tolerance)
                amount_diff_percent = abs(amount - txn['amount']) / txn['amount'] * 100
                if amount_diff_percent <= 10:
                    return txn
        
        return None
    
    def _clean_description(self, description):
        """Clean description for fuzzy matching"""
        # Remove common noise words
        noise_words = ['upi', 'neft', 'rtgs', 'imps', 'payment', 'transfer', 'to', 'from', 'ref']
        
        # Convert to lowercase
        cleaned = description.lower()
        
        # Remove special characters
        cleaned = re.sub(r'[^a-z0-9\s]', ' ', cleaned)
        
        # Remove noise words
        for word in noise_words:
            cleaned = re.sub(r'\b' + word + r'\b', '', cleaned)
        
        # Remove extra whitespace
        cleaned = ' '.join(cleaned.split())
        
        return cleaned
    
    def accept_match(self, bank_transaction_id, book_transaction_id, matched_by='System'):
        """Accept a suggested match"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Update bank transaction
        self.cursor.execute('''
            UPDATE bank_transactions
            SET reconciliation_status = 'Matched',
                matched_transaction_id = ?,
                matched_date = ?
            WHERE id = ?
        ''', (book_transaction_id, timestamp, bank_transaction_id))
        
        # Update book transaction
        self.cursor.execute('''
            UPDATE transactions
            SET reconciliation_status = 'Reconciled',
                bank_transaction_id = ?,
                reconciled_date = ?
            WHERE id = ?
        ''', (bank_transaction_id, timestamp, book_transaction_id))
        
        self.conn.commit()
        
        return True
    
    def manual_match(self, bank_transaction_id, book_transaction_id):
        """Manually match transactions"""
        return self.accept_match(bank_transaction_id, book_transaction_id, matched_by='Manual')
    
    def unmatch(self, bank_transaction_id):
        """Unmatch a previously matched transaction"""
        # Get matched book transaction ID
        self.cursor.execute('''
            SELECT matched_transaction_id FROM bank_transactions
            WHERE id = ?
        ''', (bank_transaction_id,))
        
        result = self.cursor.fetchone()
        
        if result:
            book_transaction_id = result[0] if isinstance(result, dict) else result[0]
            
            # Reset bank transaction
            self.cursor.execute('''
                UPDATE bank_transactions
                SET reconciliation_status = 'Unmatched',
                    matched_transaction_id = NULL,
                    matched_date = NULL
                WHERE id = ?
            ''', (bank_transaction_id,))
            
            # Reset book transaction
            if book_transaction_id:
                self.cursor.execute('''
                    UPDATE transactions
                    SET reconciliation_status = 'Unreconciled',
                        bank_transaction_id = NULL,
                        reconciled_date = NULL
                    WHERE id = ?
                ''', (book_transaction_id,))
            
            self.conn.commit()
            
            return True
        
        return False
    
    def get_reconciliation_summary(self, bank_account_id, start_date=None, end_date=None):
        """Get reconciliation summary statistics"""
        params = [bank_account_id]
        date_filter = ''
        
        if start_date:
            date_filter += ' AND bt.transaction_date >= ?'
            params.append(start_date)
        
        if end_date:
            date_filter += ' AND bt.transaction_date <= ?'
            params.append(end_date)
        
        # Bank transactions summary
        self.cursor.execute(f'''
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN reconciliation_status = 'Matched' THEN 1 ELSE 0 END) as matched,
                SUM(CASE WHEN reconciliation_status = 'Unmatched' THEN 1 ELSE 0 END) as unmatched,
                SUM(CASE WHEN transaction_type = 'Credit' THEN amount ELSE 0 END) as total_credits,
                SUM(CASE WHEN transaction_type = 'Debit' THEN amount ELSE 0 END) as total_debits
            FROM bank_transactions bt
            WHERE bank_account_id = ? {date_filter}
        ''', params)
        
        bank_summary = dict(self.cursor.fetchone())
        
        # Book transactions summary
        self.cursor.execute(f'''
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN reconciliation_status = 'Reconciled' THEN 1 ELSE 0 END) as reconciled,
                SUM(CASE WHEN reconciliation_status = 'Unreconciled' THEN 1 ELSE 0 END) as unreconciled,
                SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END) as total_expenses
            FROM transactions t
            WHERE bank_account_id = ? {date_filter}
        ''', params)
        
        book_summary = dict(self.cursor.fetchone())
        
        # Calculate reconciliation percentage
        bank_total = bank_summary['total']
        bank_matched = bank_summary['matched']
        reconciliation_percentage = (bank_matched / bank_total * 100) if bank_total > 0 else 0
        
        return {
            'bank_transactions': bank_summary,
            'book_transactions': book_summary,
            'reconciliation_percentage': round(reconciliation_percentage, 2),
            'unmatched_bank_count': bank_summary['unmatched'],
            'unreconciled_book_count': book_summary['unreconciled']
        }
