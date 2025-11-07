# Deployment Guide - AI Chat A2A Server

Complete guide for deploying the AI Chat Application with A2A protocol support.

## Table of Contents

- [Quick Start](#quick-start)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [Environment Configuration](#environment-configuration)
- [Security Considerations](#security-considerations)
- [Monitoring and Health Checks](#monitoring-and-health-checks)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Local Development

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd AiAgent
   ```

2. **Set up the backend**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Generate agent card**:
   ```bash
   python generate_agent_card.py --base-url http://localhost:8000
   ```

5. **Start the server**:
   ```bash
   python -m src.server.app
   ```

6. **Verify installation**:
   ```bash
   curl http://localhost:8000/api/v1/health
   curl http://localhost:8000/api/v1/a2a/agent-card
   ```

### Frontend Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development servers**:
   ```bash
   npm run dev  # Starts both web and desktop apps
   ```

## Production Deployment

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL (optional, for persistent storage)
- Redis (optional, for session management)
- Nginx or Apache (for reverse proxy)
- SSL certificate (Let's Encrypt recommended)

### Backend Production Setup

1. **Install production dependencies**:
   ```bash
   pip install -r requirements.txt
   pip install gunicorn  # Production WSGI server
   ```

2. **Configure environment variables**:
   ```bash
   # backend/.env
   BACKEND_HOST=0.0.0.0
   BACKEND_PORT=8000
   DEBUG=false

   # Security
   A2A_API_KEY=<generate-strong-random-key>

   # CORS (adjust for your domain)
   CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

   # Optional: LLM API keys
   OPENAI_API_KEY=<your-key>
   ANTHROPIC_API_KEY=<your-key>
   ```

3. **Generate production agent card**:
   ```bash
   python generate_agent_card.py \
     --base-url https://your-domain.com \
     --output agent_card.json
   ```

4. **Run with Gunicorn**:
   ```bash
   gunicorn src.server.app:app \
     --workers 4 \
     --worker-class uvicorn.workers.UvicornWorker \
     --bind 0.0.0.0:8000 \
     --access-logfile - \
     --error-logfile -
   ```

### Systemd Service

Create `/etc/systemd/system/ai-chat-backend.service`:

```ini
[Unit]
Description=AI Chat A2A Backend Server
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/ai-chat/backend
Environment="PATH=/var/www/ai-chat/backend/venv/bin"
ExecStart=/var/www/ai-chat/backend/venv/bin/gunicorn src.server.app:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:8000 \
    --access-logfile /var/log/ai-chat/access.log \
    --error-logfile /var/log/ai-chat/error.log
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable ai-chat-backend
sudo systemctl start ai-chat-backend
sudo systemctl status ai-chat-backend
```

### Nginx Configuration

Create `/etc/nginx/sites-available/ai-chat`:

```nginx
# HTTP redirect to HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }

    # A2A protocol well-known endpoint
    location /.well-known/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_cache_valid 200 1h;
    }

    # Frontend (if serving static files)
    location / {
        root /var/www/ai-chat/web/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/ai-chat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Docker Deployment

### Dockerfile

See `backend/Dockerfile` for the container definition.

### Docker Compose

See `docker-compose.yml` for the complete stack configuration.

### Build and Run

```bash
# Build the image
docker build -t ai-chat-backend:latest ./backend

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

### Environment Variables in Docker

```bash
# .env file for docker-compose
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
A2A_API_KEY=your-production-api-key
CORS_ORIGINS=https://your-domain.com
```

## Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BACKEND_HOST` | Server bind address | `0.0.0.0` |
| `BACKEND_PORT` | Server port | `8000` |
| `DEBUG` | Enable debug mode | `false` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `A2A_API_KEY` | A2A authentication key | `random-string-here` |
| `CORS_ORIGINS` | Allowed CORS origins | `https://example.com` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `ANTHROPIC_API_KEY` | Anthropic API key | `sk-ant-...` |
| `LOG_LEVEL` | Logging level | `INFO` |

### Generating Secure API Keys

```bash
# Generate a secure random API key
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Security Considerations

### 1. API Key Management

- **Never commit API keys to version control**
- Use environment variables or secret management tools
- Rotate API keys regularly
- Use different keys for development and production

### 2. CORS Configuration

```python
# Production: Specific origins only
CORS_ORIGINS=https://your-domain.com,https://api.your-domain.com

# Development: Localhost only
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. HTTPS/TLS

- Always use HTTPS in production
- Use Let's Encrypt for free SSL certificates
- Configure strong TLS ciphers
- Enable HSTS headers

### 4. Rate Limiting

Currently implemented limits:
- 60 messages per minute
- 100 concurrent sessions

Consider using nginx rate limiting for additional protection:

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    # ... other config
}
```

### 5. Firewall Configuration

```bash
# UFW example
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## Monitoring and Health Checks

### Health Check Endpoints

1. **General Health**: `GET /api/v1/health`
   ```bash
   curl https://your-domain.com/api/v1/health
   ```

2. **A2A Health**: `GET /api/v1/a2a/health`
   ```bash
   curl https://your-domain.com/api/v1/a2a/health
   ```

3. **Agent Card**: `GET /.well-known/agent-card.json`
   ```bash
   curl https://your-domain.com/.well-known/agent-card.json
   ```

### Monitoring Tools

**Prometheus + Grafana** (recommended):

```yaml
# docker-compose.yml addition
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    depends_on:
      - prometheus
```

**Health Check Script**:

```bash
#!/bin/bash
# health_check.sh

ENDPOINT="https://your-domain.com/api/v1/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $ENDPOINT)

if [ $RESPONSE -eq 200 ]; then
    echo "✅ Service is healthy"
    exit 0
else
    echo "❌ Service is down (HTTP $RESPONSE)"
    exit 1
fi
```

### Log Management

**Centralized Logging**:

```bash
# Install logrotate
sudo apt-get install logrotate

# /etc/logrotate.d/ai-chat
/var/log/ai-chat/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload ai-chat-backend
    endscript
}
```

## Troubleshooting

### Server Won't Start

1. **Check port availability**:
   ```bash
   sudo lsof -i :8000
   ```

2. **Check logs**:
   ```bash
   sudo journalctl -u ai-chat-backend -f
   ```

3. **Verify environment**:
   ```bash
   source venv/bin/activate
   python -c "from dotenv import load_dotenv; load_dotenv(); import os; print(os.getenv('BACKEND_PORT'))"
   ```

### Authentication Errors

1. **Verify API key is set**:
   ```bash
   echo $A2A_API_KEY
   ```

2. **Test without authentication**:
   ```bash
   # Temporarily unset API key
   unset A2A_API_KEY
   python -m src.server.app
   ```

3. **Check agent card**:
   ```bash
   curl http://localhost:8000/api/v1/a2a/agent-card | grep "required"
   ```

### CORS Issues

1. **Check CORS origins**:
   ```bash
   grep CORS_ORIGINS .env
   ```

2. **Test with curl**:
   ```bash
   curl -H "Origin: https://your-domain.com" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS http://localhost:8000/api/v1/a2a/message -v
   ```

### Performance Issues

1. **Increase workers**:
   ```bash
   # More workers for CPU-bound tasks
   gunicorn --workers 8 --worker-class uvicorn.workers.UvicornWorker ...
   ```

2. **Enable connection pooling**:
   ```python
   # For database connections
   # Add to config
   ```

3. **Monitor resource usage**:
   ```bash
   htop
   docker stats  # If using Docker
   ```

### Docker Issues

1. **Container won't start**:
   ```bash
   docker logs <container-id>
   docker inspect <container-id>
   ```

2. **Networking issues**:
   ```bash
   docker network ls
   docker network inspect ai-chat-network
   ```

3. **Volume permissions**:
   ```bash
   docker exec -it <container-id> ls -la /app
   ```

## Backup and Recovery

### Database Backups

```bash
# If using PostgreSQL
pg_dump -U username dbname > backup.sql

# Restore
psql -U username dbname < backup.sql
```

### Configuration Backups

```bash
# Backup script
#!/bin/bash
tar -czf ai-chat-backup-$(date +%Y%m%d).tar.gz \
    backend/.env \
    backend/agent_card.json \
    /etc/nginx/sites-available/ai-chat \
    /etc/systemd/system/ai-chat-backend.service
```

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      replicas: 3
    # ... rest of config

  nginx:
    image: nginx
    # Load balancer configuration
```

### Load Balancer (Nginx)

```nginx
upstream backend_servers {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}

server {
    location /api/ {
        proxy_pass http://backend_servers;
    }
}
```

## Support

For issues and questions:
- GitHub Issues: `<repository-url>/issues`
- Documentation: `<documentation-url>`
- Email: `support@your-domain.com`
