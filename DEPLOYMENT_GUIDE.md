# TAXCLAM Deployment Guide

## 🚀 Production Deployment Checklist

### 1. Environment Configuration

#### Required Environment Variables
Create a `.env` file with the following variables:

```env
# Security - CRITICAL
JWT_SECRET_KEY=your-256-bit-random-secret-key-here
ENCRYPTION_KEY=base64-encoded-32-byte-key-here
DEBUG=false

# Database (Optional - uses SQLite by default)
DB_HOST=your-rds-host.amazonaws.com
DB_PORT=5432
DB_NAME=taxclam_db
DB_USER=db_user
DB_PASSWORD=secure_password

# Email Service (Required for password resets)
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587

# Application
APP_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
LOG_LEVEL=INFO

# Optional Integrations
OPENROUTER_API_KEY=your-openrouter-key
ZOOM_ACCOUNT_ID=your-zoom-account-id
ZOOM_CLIENT_ID=your-zoom-client-id
ZOOM_CLIENT_SECRET=your-zoom-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### Generating Secure Keys

```bash
# Generate JWT Secret Key
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate Encryption Key  
python -c "import secrets, base64; print(base64.b64encode(secrets.token_bytes(32)).decode())"
```

### 2. Server Setup

#### Option A: Docker Deployment (Recommended)

```bash
# Build Docker image
docker build -t taxclam:latest .

# Run container
docker run -d \
  --name taxclam \
  -p 8000:8000 \
  --env-file .env \
  -v $(pwd)/finance.db:/app/finance.db \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/rag_data:/app/rag_data \
  --restart unless-stopped \
  taxclam:latest
```

#### Option B: Direct Python Deployment

```bash
# Install dependencies
pip install -r requirements.txt

# Setup database
python -c "from app.db_config import init_database; init_database()"

# Setup database indexes for performance
python -c "from app.db_optimizer import setup_database_indexes; setup_database_indexes()"

# Run with Gunicorn (production)
gunicorn unified_server:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  --access-logfile logs/access.log \
  --error-logfile logs/error.log
```

### 3. Reverse Proxy (Nginx) Configuration

Create `/etc/nginx/sites-available/taxclam`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers (additional to app's headers)
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Max upload size
    client_max_body_size 50M;

    # Proxy settings
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /static/ {
        proxy_pass http://localhost:8000/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint (no auth required)
    location /health {
        proxy_pass http://localhost:8000/health;
        access_log off;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/taxclam /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 5. Systemd Service Configuration

Create `/etc/systemd/system/taxclam.service`:

```ini
[Unit]
Description=TAXCLAM Application
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/taxclam
Environment="PATH=/var/www/taxclam/.venv/bin"
ExecStart=/var/www/taxclam/.venv/bin/gunicorn unified_server:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --timeout 120 \
    --access-logfile /var/log/taxclam/access.log \
    --error-logfile /var/log/taxclam/error.log
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Manage the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable taxclam
sudo systemctl start taxclam
sudo systemctl status taxclam
```

### 6. Database Backup Strategy

#### Automated Backups

Create `/usr/local/bin/backup-taxclam.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/taxclam"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/var/www/taxclam"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup SQLite database
cp $APP_DIR/finance.db $BACKUP_DIR/finance_${DATE}.db

# Backup RAG data
tar -czf $BACKUP_DIR/rag_data_${DATE}.tar.gz -C $APP_DIR rag_data/

# Keep last 30 days of backups
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

Add to crontab:
```bash
sudo chmod +x /usr/local/bin/backup-taxclam.sh
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-taxclam.sh
```

### 7. Monitoring & Logging

#### Log Rotation

Create `/etc/logrotate.d/taxclam`:

```
/var/log/taxclam/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload taxclam > /dev/null 2>&1 || true
    endscript
}
```

#### Health Check Monitoring

Setup a cron job to monitor health:

```bash
*/5 * * * * curl -f http://localhost:8000/health || systemctl restart taxclam
```

#### Application Monitoring

View logs:
```bash
# Application logs
tail -f /var/log/taxclam/error.log

# Security audit logs
tail -f /var/www/taxclam/logs/security.log

# Health check
curl http://localhost:8000/api/health/detailed
```

### 8. Security Hardening

#### Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### Fail2Ban Configuration

Install and configure:
```bash
sudo apt-get install fail2ban
```

Create `/etc/fail2ban/jail.local`:
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
```

### 9. Performance Optimization

#### Database Optimization

Run periodically:
```python
from app.db_optimizer import get_query_optimizer

optimizer = get_query_optimizer()
optimizer.optimize_database()
```

#### System Resources

Recommended VPS specs:
- **Minimum**: 1 CPU, 2GB RAM, 20GB Storage
- **Recommended**: 2 CPU, 4GB RAM, 40GB Storage
- **Production**: 4 CPU, 8GB RAM, 100GB Storage

### 10. Post-Deployment Verification

```bash
# Check application health
curl https://yourdomain.com/api/health/detailed

# Test authentication
curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123!@#","confirm_password":"Test123!@#"}'

# Check SSL
curl -I https://yourdomain.com

# Monitor logs
tail -f /var/log/taxclam/error.log
```

### 11. Maintenance Tasks

#### Weekly
- Review security logs
- Check disk space
- Monitor error logs

#### Monthly
- Review and update dependencies
- Optimize database
- Test backup restoration
- Review and rotate API keys

#### Quarterly
- Security audit
- Performance optimization
- Update SSL certificates (automated)

### 12. Troubleshooting

#### Application won't start
```bash
# Check logs
sudo journalctl -u taxclam -n 50

# Check configuration
python -c "from app.db_config import get_db_connection; get_db_connection()"

# Check permissions
sudo chown -R www-data:www-data /var/www/taxclam
```

#### High memory usage
```bash
# Check process stats
ps aux | grep gunicorn

# Restart service
sudo systemctl restart taxclam
```

#### Database locked errors
```bash
# Check for long-running queries
# Enable WAL mode (should be automatic with db_optimizer)
sqlite3 finance.db "PRAGMA journal_mode=WAL;"
```

---

## 📞 Support

For issues or questions:
- Check logs in `/var/log/taxclam/` and `logs/`
- Review health status: `/api/health/detailed`
- Check system resources: `htop` or `top`

## 🔒 Security Note

Never commit `.env` file to version control. Always use environment-specific configurations and rotate secrets regularly.
