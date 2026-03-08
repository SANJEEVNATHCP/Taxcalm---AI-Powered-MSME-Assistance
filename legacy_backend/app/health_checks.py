"""
Health Check System
Monitors system components, database connectivity, external services, and resource usage
"""

import os
import sys
import time
import psutil
import sqlite3
from datetime import datetime
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)


class HealthChecker:
    """System health monitoring"""
    
    def __init__(self):
        self.start_time = time.time()
        self.checks = []
    
    def get_uptime(self) -> float:
        """Get system uptime in seconds"""
        return time.time() - self.start_time
    
    def format_uptime(self) -> str:
        """Format uptime as human-readable string"""
        seconds = int(self.get_uptime())
        days = seconds // 86400
        hours = (seconds % 86400) // 3600
        minutes = (seconds % 3600) // 60
        secs = seconds % 60
        
        parts = []
        if days: parts.append(f"{days}d")
        if hours: parts.append(f"{hours}h")
        if minutes: parts.append(f"{minutes}m")
        if secs or not parts: parts.append(f"{secs}s")
        
        return " ".join(parts)
    
    def check_database(self) -> Dict[str, Any]:
        """Check database connectivity"""
        try:
            from app.db_config import get_db_connection
            
            start = time.time()
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Simple query to test connection
            cursor.execute('SELECT 1')
            cursor.fetchone()
            
            conn.close()
            latency = (time.time() - start) * 1000  # ms
            
            return {
                'status': 'healthy',
                'latency_ms': round(latency, 2),
                'message': 'Database connection successful'
            }
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'Database connection failed'
            }
    
    def check_rag_system(self) -> Dict[str, Any]:
        """Check RAG system availability"""
        try:
            from app.rag_system import get_rag_instance
            
            rag = get_rag_instance()
            if rag and rag.collection:
                count = rag.collection.count()
                return {
                    'status': 'healthy',
                    'documents_count': count,
                    'message': 'RAG system operational'
                }
            else:
                return {
                    'status': 'degraded',
                    'message': 'RAG system initialized but collection empty'
                }
        except ImportError:
            return {
                'status': 'unavailable',
                'message': 'RAG system not installed'
            }
        except Exception as e:
            logger.error(f"RAG health check failed: {e}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'RAG system check failed'
            }
    
    def check_email_service(self) -> Dict[str, Any]:
        """Check email service configuration"""
        try:
            smtp_configured = bool(os.getenv('SMTP_PASSWORD'))
            smtp_email = os.getenv('SMTP_EMAIL')
            
            if smtp_configured:
                return {
                    'status': 'healthy',
                    'smtp_email': smtp_email,
                    'message': 'Email service configured'
                }
            else:
                return {
                    'status': 'degraded',
                    'message': 'Email service not configured (SMTP_PASSWORD missing)'
                }
        except Exception as e:
            return {
                'status': 'unknown',
                'error': str(e),
                'message': 'Email service check failed'
            }
    
    def check_system_resources(self) -> Dict[str, Any]:
        """Check system resource usage"""
        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            status = 'healthy'
            warnings = []
            
            if cpu_percent > 80:
                status = 'degraded'
                warnings.append('High CPU usage')
            
            if memory.percent > 80:
                status = 'degraded'
                warnings.append('High memory usage')
            
            if disk.percent > 85:
                status = 'degraded'
                warnings.append('Low disk space')
            
            return {
                'status': status,
                'cpu_percent': round(cpu_percent, 2),
                'memory_percent': round(memory.percent, 2),
                'memory_available_mb': round(memory.available / (1024 * 1024), 2),
                'disk_percent': round(disk.percent, 2),
                'disk_free_gb': round(disk.free / (1024 ** 3), 2),
                'warnings': warnings,
                'message': 'System resources monitored'
            }
        except Exception as e:
            logger.error(f"System resources check failed: {e}")
            return {
                'status': 'unknown',
                'error': str(e),
                'message': 'Resource check failed'
            }
    
    def check_environment(self) -> Dict[str, Any]:
        """Check environment configuration"""
        required_vars = [
            'JWT_SECRET_KEY',
            'ENCRYPTION_KEY'
        ]
        
        optional_vars = [
            'OPENROUTER_API_KEY',
            'ZOOM_ACCOUNT_ID',
            'GOOGLE_CLIENT_ID',
            'DB_HOST'
        ]
        
        missing_required = [var for var in required_vars if not os.getenv(var)]
        missing_optional = [var for var in optional_vars if not os.getenv(var)]
        
        if missing_required:
            return {
                'status': 'unhealthy',
                'missing_required': missing_required,
                'missing_optional': missing_optional,
                'message': 'Critical environment variables missing'
            }
        elif missing_optional:
            return {
                'status': 'degraded',
                'missing_optional': missing_optional,
                'message': 'Some optional features not configured'
            }
        else:
            return {
                'status': 'healthy',
                'message': 'All environment variables configured'
            }
    
    def check_python_version(self) -> Dict[str, Any]:
        """Check Python version compatibility"""
        version = sys.version_info
        version_str = f"{version.major}.{version.minor}.{version.micro}"
        
        if version.major < 3 or (version.major == 3 and version.minor < 8):
            return {
                'status': 'unhealthy',
                'version': version_str,
                'message': 'Python 3.8+ required'
            }
        else:
            return {
                'status': 'healthy',
                'version': version_str,
                'message': 'Python version compatible'
            }
    
    def run_all_checks(self) -> Dict[str, Any]:
        """Run all health checks and return comprehensive status"""
        checks = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'uptime': self.format_uptime(),
            'uptime_seconds': round(self.get_uptime(), 2),
            'checks': {
                'database': self.check_database(),
                'rag_system': self.check_rag_system(),
                'email_service': self.check_email_service(),
                'system_resources': self.check_system_resources(),
                'environment': self.check_environment(),
                'python_version': self.check_python_version()
            }
        }
        
        # Determine overall status
        statuses = [check['status'] for check in checks['checks'].values()]
        
        if 'unhealthy' in statuses:
            overall_status = 'unhealthy'
        elif 'degraded' in statuses:
            overall_status = 'degraded'
        else:
            overall_status = 'healthy'
        
        checks['overall_status'] = overall_status
        checks['healthy_checks'] = statuses.count('healthy')
        checks['total_checks'] = len(statuses)
        
        logger.info(f"Health check completed - Overall status: {overall_status}")
        
        return checks
    
    def get_quick_status(self) -> Dict[str, str]:
        """Get quick health status (fast check)"""
        try:
            uptime = self.format_uptime()
            db_check = self.check_database()
            
            return {
                'status': 'ok' if db_check['status'] == 'healthy' else 'degraded',
                'uptime': uptime,
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }


# Global health checker instance
_health_checker = None

def get_health_checker() -> HealthChecker:
    """Get or create health checker singleton"""
    global _health_checker
    if _health_checker is None:
        _health_checker = HealthChecker()
    return _health_checker
