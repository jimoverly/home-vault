# 🏠 Home Vault

**Secure Home Inventory & Document Tracker — Rocky Linux Deployment**

Track valuable items, insurance policies, warranties, and important documents with secure user accounts, password hashing, and session management.

---

## Quick Start

### Automated Setup

Upload the package to your Rocky Linux server, extract, and run:

```bash
tar xzf home-vault.tar.gz   # or: unzip home-vault-deploy.zip
cd home-vault
sudo bash setup.sh
```

The setup script handles everything:
- Installs Node.js 20 from NodeSource
- Installs build tools (gcc, make, python3) for the SQLite native module
- Creates a `homevault` service user (no shell, no login)
- Copies the app to `/opt/home-vault`
- Generates a secure `.env` with a random JWT secret
- Installs dependencies and builds the frontend
- Initializes the SQLite database in `/var/lib/home-vault/`
- Sets file permissions (`.env` is `600`, data dir is `700`)
- Configures SELinux contexts (if enforcing)
- Opens port 3000 in firewalld
- Installs and starts the systemd service

After setup, visit **http://your-server-ip:3000** to create your account.

---

## Manual Setup

If you prefer to do it step by step:

### 1. Install Node.js 20

```bash
sudo dnf install -y curl
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
node -v   # Should show v20.x
```

### 2. Install Build Tools

Required for the `better-sqlite3` native module:

```bash
sudo dnf groupinstall -y "Development Tools"
# Or individually: sudo dnf install -y gcc gcc-c++ make python3
```

### 3. Create Service User and Directories

```bash
sudo useradd --system --shell /usr/sbin/nologin --home-dir /opt/home-vault homevault
sudo mkdir -p /opt/home-vault /var/lib/home-vault /var/log/home-vault
```

### 4. Copy Files and Install

```bash
sudo cp -r ./* /opt/home-vault/
cd /opt/home-vault

# Install all deps, build frontend, prune dev deps
sudo npm ci
sudo npx vite build
sudo npm prune --omit=dev
```

### 5. Configure Environment

```bash
sudo cp .env.example .env
sudo nano .env
```

**Critical: Set a real JWT secret:**
```bash
openssl rand -hex 64
```

Paste the output as the `JWT_SECRET` value. Set `DB_PATH=/var/lib/home-vault/home-vault.db`.

### 6. Initialize Database

```bash
sudo node server/db-init.js
```

### 7. Set Permissions

```bash
sudo chown -R homevault:homevault /opt/home-vault /var/lib/home-vault /var/log/home-vault
sudo chmod 600 /opt/home-vault/.env
sudo chmod 700 /var/lib/home-vault
```

### 8. Install Systemd Service

```bash
sudo cp home-vault.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now home-vault
```

### 9. Open Firewall

```bash
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

---

## Managing the Service

```bash
# Status
sudo systemctl status home-vault

# View logs (live)
sudo journalctl -u home-vault -f

# View recent logs
sudo journalctl -u home-vault --since "1 hour ago"

# Restart
sudo systemctl restart home-vault

# Stop
sudo systemctl stop home-vault

# Start
sudo systemctl start home-vault
```

---

## Nginx Reverse Proxy + SSL

To serve on port 443 with a domain name and Let's Encrypt SSL:

### Install Nginx and Certbot

```bash
sudo dnf install -y nginx certbot python3-certbot-nginx
sudo systemctl enable --now nginx
```

### Create Nginx Config

```bash
sudo nano /etc/nginx/conf.d/home-vault.conf
```

```nginx
server {
    listen 80;
    server_name vault.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Get SSL Certificate

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d vault.yourdomain.com
```

### Open HTTPS in Firewall

```bash
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --remove-port=3000/tcp   # No longer needed externally
sudo firewall-cmd --reload
```

### SELinux: Allow Nginx to Proxy

```bash
sudo setsebool -P httpd_can_network_connect 1
```

---

## SELinux Notes

Rocky Linux runs SELinux in enforcing mode by default. The setup script handles this, but if you hit permission errors:

```bash
# Check current mode
getenforce

# View Home Vault denials
sudo ausearch -m AVC -c node --recent

# Set contexts for app and data directories
sudo semanage fcontext -a -t httpd_sys_content_t "/opt/home-vault(/.*)?"
sudo semanage fcontext -a -t httpd_sys_rw_content_t "/var/lib/home-vault(/.*)?"
sudo restorecon -Rv /opt/home-vault /var/lib/home-vault

# Allow Node.js on port 3000
sudo semanage port -a -t http_port_t -p tcp 3000
```

---

## Backup & Restore

### Backup

The database is a single SQLite file. Back it up while the service is running (SQLite WAL mode is safe for this):

```bash
# Quick backup
sudo cp /var/lib/home-vault/home-vault.db /root/home-vault-backup-$(date +%Y%m%d).db

# Or use sqlite3 .backup for a guaranteed-consistent copy
sudo -u homevault sqlite3 /var/lib/home-vault/home-vault.db ".backup /tmp/home-vault-backup.db"
```

### Automated Daily Backup (cron)

```bash
sudo crontab -e
```

Add:
```
0 2 * * * /usr/bin/sqlite3 /var/lib/home-vault/home-vault.db ".backup /root/backups/home-vault-$(date +\%Y\%m\%d).db"
```

### Restore

```bash
sudo systemctl stop home-vault
sudo cp /root/home-vault-backup-20260228.db /var/lib/home-vault/home-vault.db
sudo chown homevault:homevault /var/lib/home-vault/home-vault.db
sudo systemctl start home-vault
```

---

## Updating the Application

```bash
# 1. Stop the service
sudo systemctl stop home-vault

# 2. Back up current version
sudo cp -r /opt/home-vault /opt/home-vault.bak

# 3. Copy new files (excluding .env and data)
sudo rsync -a --exclude='.env' --exclude='node_modules' --exclude='dist' new-version/ /opt/home-vault/

# 4. Rebuild
cd /opt/home-vault
sudo npm ci
sudo npx vite build
sudo npm prune --omit=dev

# 5. Fix permissions and restart
sudo chown -R homevault:homevault /opt/home-vault
sudo systemctl start home-vault
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Service won't start | `journalctl -u home-vault -n 50 --no-pager` |
| Permission denied on DB | `sudo chown homevault:homevault /var/lib/home-vault/*` |
| SELinux blocking | `sudo ausearch -m AVC -c node --recent` then apply fix |
| Port 3000 not reachable | `sudo firewall-cmd --list-ports` — add if missing |
| better-sqlite3 build fails | `sudo dnf install gcc gcc-c++ make python3` then `npm rebuild` |
| Can't reach via nginx | `sudo setsebool -P httpd_can_network_connect 1` |
| Forgot JWT secret | Change it in `/opt/home-vault/.env` and restart (all sessions invalidated) |

---

## File Locations

| What | Path |
|------|------|
| Application | `/opt/home-vault/` |
| Environment config | `/opt/home-vault/.env` |
| SQLite database | `/var/lib/home-vault/home-vault.db` |
| Systemd service | `/etc/systemd/system/home-vault.service` |
| Logs | `journalctl -u home-vault` |
| Service user | `homevault` (no login shell) |

---

## Security Features

- **bcrypt** password hashing (configurable rounds, default 12)
- **JWT** sessions in httpOnly cookies (secure flag in production, SameSite=strict)
- **Account lockout** after 5 failed login attempts (60-second cooldown)
- **Rate limiting** — 100 req/15min general, 10 req/15min auth endpoints
- **Helmet.js** security headers
- **Audit log** tracks all auth events with IP addresses
- **Per-user data isolation** — all queries scoped to user_id
- **Systemd hardening** — NoNewPrivileges, ProtectSystem=strict, PrivateTmp
- **Dedicated service user** — no shell, no login, no home directory access

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 on Rocky Linux |
| Frontend | React 18, Vite |
| Backend | Express 4 |
| Database | SQLite (better-sqlite3) — zero-config, file-based |
| Auth | bcryptjs, jsonwebtoken |
| Security | helmet, express-rate-limit, httpOnly cookies, CORS |
| Process | systemd (auto-restart, journald logging) |

---

## License

MIT
