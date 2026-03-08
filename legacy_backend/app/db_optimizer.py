"""
Database Query Optimizer
Provides optimized database operations with connection pooling, caching, and query optimization
"""

import sqlite3
import logging
from contextlib import contextmanager
from functools import lru_cache
from typing import Dict, List, Any, Optional
import threading
import time

logger = logging.getLogger(__name__)


class ConnectionPool:
    """Simple SQLite connection pool for better performance"""
    
    def __init__(self, database_path: str, max_connections: int = 5):
        self.database_path = database_path
        self.max_connections = max_connections
        self._connections = []
        self._lock = threading.Lock()
        self._in_use = set()
    
    def get_connection(self) -> sqlite3.Connection:
        """Get a connection from the pool"""
        with self._lock:
            # Reuse existing idle connection
            for conn in self._connections:
                if conn not in self._in_use:
                    self._in_use.add(conn)
                    return conn
            
            # Create new connection if pool not full
            if len(self._connections) < self.max_connections:
                conn = sqlite3.connect(self.database_path, check_same_thread=False)
                conn.row_factory = sqlite3.Row
                # Enable WAL mode for better concurrency
                conn.execute('PRAGMA journal_mode=WAL')
                # Optimize for performance
                conn.execute('PRAGMA synchronous=NORMAL')
                conn.execute('PRAGMA cache_size=-64000')  # 64MB cache
                self._connections.append(conn)
                self._in_use.add(conn)
                logger.debug(f"Created new connection. Pool size: {len(self._connections)}")
                return conn
            
            # Wait for available connection (simplified - just return any)
            # In production, implement proper waiting/timeout
            return self._connections[0]
    
    def release_connection(self, conn: sqlite3.Connection):
        """Release connection back to pool"""
        with self._lock:
            if conn in self._in_use:
                self._in_use.discard(conn)
    
    def close_all(self):
        """Close all connections in pool"""
        with self._lock:
            for conn in self._connections:
                try:
                    conn.close()
                except Exception as e:
                    logger.error(f"Error closing connection: {e}")
            self._connections.clear()
            self._in_use.clear()


class QueryOptimizer:
    """
    Optimizes database queries and provides caching
    """
    
    def __init__(self, connection_pool: ConnectionPool):
        self.pool = connection_pool
        self._cache = {}
        self._cache_ttl = {}
        self._cache_lock = threading.Lock()
    
    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = self.pool.get_connection()
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            logger.error(f"Database error: {e}")
            raise
        finally:
            self.pool.release_connection(conn)
    
    def execute_query(
        self,
        query: str,
        params: tuple = (),
        fetch_one: bool = False,
        cache_key: Optional[str] = None,
        cache_ttl: int = 300
    ) -> Any:
        """
        Execute optimized query with optional caching
        
        Args:
            query: SQL query
            params: Query parameters
            fetch_one: If True, fetch single row
            cache_key: Cache key for result caching
            cache_ttl: Cache time-to-live in seconds
        
        Returns:
            Query results
        """
        # Check cache
        if cache_key:
            cached = self._get_from_cache(cache_key)
            if cached is not None:
                logger.debug(f"Cache hit for key: {cache_key}")
                return cached
        
        # Execute query
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            
            if query.strip().upper().startswith('SELECT'):
                if fetch_one:
                    result = cursor.fetchone()
                    result = dict(result) if result else None
                else:
                    result = [dict(row) for row in cursor.fetchall()]
                
                # Cache result if requested
                if cache_key:
                    self._set_cache(cache_key, result, cache_ttl)
                
                return result
            else:
                # For INSERT/UPDATE/DELETE
                return cursor.rowcount
    
    def execute_batch(self, query: str, params_list: List[tuple]) -> int:
        """
        Execute batch operations for better performance
        
        Args:
            query: SQL query
            params_list: List of parameter tuples
        
        Returns:
            Total number of affected rows
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.executemany(query, params_list)
            return cursor.rowcount
    
    def _get_from_cache(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired"""
        with self._cache_lock:
            if key in self._cache:
                # Check expiration
                if time.time() < self._cache_ttl[key]:
                    return self._cache[key]
                else:
                    # Expired
                    del self._cache[key]
                    del self._cache_ttl[key]
        return None
    
    def _set_cache(self, key: str, value: Any, ttl: int):
        """Set cache value with TTL"""
        with self._cache_lock:
            self._cache[key] = value
            self._cache_ttl[key] = time.time() + ttl
    
    def clear_cache(self, pattern: Optional[str] = None):
        """Clear cache, optionally matching a pattern"""
        with self._cache_lock:
            if pattern:
                keys_to_delete = [k for k in self._cache if pattern in k]
                for key in keys_to_delete:
                    del self._cache[key]
                    del self._cache_ttl[key]
            else:
                self._cache.clear()
                self._cache_ttl.clear()
    
    def optimize_database(self):
        """Run database optimization tasks"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                # Analyze query patterns
                cursor.execute('ANALYZE')
                
                # Clean up deleted rows
                cursor.execute('VACUUM')
                
                logger.info("Database optimized successfully")
        except Exception as e:
            logger.error(f"Database optimization failed: {e}")
    
    def create_index_if_not_exists(self, table: str, columns: List[str], unique: bool = False):
        """Create index for better query performance"""
        try:
            index_name = f"idx_{table}_{'_'.join(columns)}"
            unique_clause = "UNIQUE" if unique else ""
            columns_str = ", ".join(columns)
            
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(f'''
                    CREATE {unique_clause} INDEX IF NOT EXISTS {index_name}
                    ON {table}({columns_str})
                ''')
                logger.info(f"Created index: {index_name}")
        except Exception as e:
            logger.error(f"Failed to create index: {e}")
    
    def get_table_stats(self, table: str) -> Dict[str, Any]:
        """Get statistics about a table"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                # Row count
                cursor.execute(f'SELECT COUNT(*) as count FROM {table}')
                count = cursor.fetchone()['count']
                
                # Table info
                cursor.execute(f'PRAGMA table_info({table})')
                columns = [dict(row) for row in cursor.fetchall()]
                
                # Indexes
                cursor.execute(f'PRAGMA index_list({table})')
                indexes = [dict(row) for row in cursor.fetchall()]
                
                return {
                    'table': table,
                    'row_count': count,
                    'column_count': len(columns),
                    'columns': columns,
                    'indexes': indexes
                }
        except Exception as e:
            logger.error(f"Failed to get table stats: {e}")
            return {}


# Global instances
_connection_pool = None
_query_optimizer = None


def get_query_optimizer(database_path: str = 'finance.db') -> QueryOptimizer:
    """Get or create query optimizer singleton"""
    global _connection_pool, _query_optimizer
    
    if _query_optimizer is None:
        _connection_pool = ConnectionPool(database_path, max_connections=10)
        _query_optimizer = QueryOptimizer(_connection_pool)
        logger.info("Query optimizer initialized")
    
    return _query_optimizer


def setup_database_indexes():
    """Setup recommended indexes for better performance"""
    optimizer = get_query_optimizer()
    
    # Indexes for common queries
    indexes = [
        ('users', ['email']),
        ('users', ['username']),
        ('transactions', ['user_id', 'transaction_date']),
        ('transactions', ['type', 'category']),
        ('gst_registrations', ['user_id']),
        ('gst_registrations', ['gstin']),
        ('invoices', ['user_id', 'invoice_date']),
        ('invoices', ['customer_id']),
        ('bank_accounts', ['user_id']),
        ('bank_transactions', ['bank_account_id', 'transaction_date']),
    ]
    
    for table, columns in indexes:
        try:
            optimizer.create_index_if_not_exists(table, columns)
        except Exception as e:
            # Table might not exist yet
            logger.debug(f"Could not create index for {table}.{columns}: {e}")
    
    logger.info("Database indexes setup completed")
