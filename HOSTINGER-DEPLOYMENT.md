# AfroConnect - Hostinger Deployment Guide

Complete guide to deploy AfroConnect on Hostinger VPS.

## Prerequisites

1. **Hostinger VPS Plan** (recommended: VPS 1 or higher)
2. **Domain name** (can purchase from Hostinger or use existing)
3. **Supabase project** already set up with database
4. **SSH access** to your VPS

---

## Quick Deployment (3 Steps)

### Step 1: Upload Your Code to VPS

**Option A: Using Git (Recommended)**
```bash
# On your VPS
cd /var/www
git clone https://github.com/yourusername/afroconnect.git
cd afroconnect
```

**Option B: Using FileZilla/SFTP**
1. Download FileZilla
2. Connect to your VPS (Host: your-vps-ip, Port: 22)
3. Upload entire `afroconnect` folder to `/var/www/`

**Option C: Using SCP**
```bash
# On your local machine
scp -r C:/Users/Admin/afroconnect root@your-vps-ip:/var/www/
```

### Step 2: Run Deployment Script

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Navigate to app directory
cd /var/www/afroconnect

# Make script executable
chmod +x deploy-hostinger.sh

# Run deployment script
bash deploy-hostinger.sh
```

### Step 3: Configure Environment Variables

```bash
# Create .env.local file
nano /var/www/afroconnect/.env.local
```

Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Save and restart:
```bash
pm2 restart afroconnect
```

---

## SSL Certificate Setup (HTTPS)

After your domain is pointing to the VPS:

```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Get SSL certificate (FREE)
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose redirect HTTP to HTTPS (option 2)
```

Auto-renewal is configured automatically!

---

## Domain DNS Configuration

Point your domain to your VPS:

1. Go to your domain registrar (Hostinger DNS panel)
2. Add these DNS records:

```
Type    Name    Value               TTL
A       @       your-vps-ip         3600
A       www     your-vps-ip         3600
```

Wait 5-30 minutes for DNS propagation.

---

## Using PM2 Ecosystem File (Advanced)

For better control, use the ecosystem config:

```bash
cd /var/www/afroconnect

# Create logs directory
mkdir -p logs

# Start with ecosystem file
pm2 delete afroconnect
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save
```

---

## Useful Commands

### Application Management
```bash
# View app status
pm2 status

# View real-time logs
pm2 logs afroconnect

# Restart app
pm2 restart afroconnect

# Stop app
pm2 stop afroconnect

# View detailed info
pm2 info afroconnect

# Monitor CPU/Memory
pm2 monit
```

### Nginx Management
```bash
# Test configuration
nginx -t

# Reload nginx
systemctl reload nginx

# Restart nginx
systemctl restart nginx

# View nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### System Management
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check running processes
ps aux | grep node
```

---

## Updating Your Application

When you make changes:

```bash
# SSH into VPS
ssh root@your-vps-ip

# Navigate to app
cd /var/www/afroconnect

# Pull latest changes (if using git)
git pull

# Install new dependencies (if any)
npm install

# Rebuild application
npm run build

# Restart with PM2
pm2 restart afroconnect

# Clear nginx cache (if needed)
systemctl reload nginx
```

---

## Performance Optimization

### 1. Enable Gzip (Already in nginx config)
✓ Included in deployment script

### 2. PM2 Cluster Mode (Already configured)
✓ Running 2 instances for load balancing

### 3. Database Connection Pooling
Already optimized with Supabase

### 4. CDN (Optional)
Consider Cloudflare for:
- DDoS protection
- Global CDN
- Additional caching
- Free SSL

---

## Monitoring & Logs

### Check Application Logs
```bash
# PM2 logs
pm2 logs afroconnect --lines 100

# Application error logs
cat /var/www/afroconnect/logs/pm2-error.log

# Application output logs
cat /var/www/afroconnect/logs/pm2-out.log
```

### Setup Log Rotation
```bash
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## Backup Strategy

### Database (Supabase)
- Automatic backups by Supabase
- Can download from Supabase dashboard

### Application Files
```bash
# Create backup
cd /var/www
tar -czf afroconnect-backup-$(date +%Y%m%d).tar.gz afroconnect

# Download to local machine
scp root@your-vps-ip:/var/www/afroconnect-backup-*.tar.gz ./
```

---

## Troubleshooting

### App Not Starting
```bash
# Check PM2 logs
pm2 logs afroconnect

# Check if port 3000 is in use
lsof -i :3000

# Kill process on port 3000
kill -9 $(lsof -t -i:3000)

# Restart
pm2 restart afroconnect
```

### Nginx 502 Bad Gateway
```bash
# Check if app is running
pm2 status

# Check nginx error logs
tail -f /var/log/nginx/error.log

# Restart both
pm2 restart afroconnect
systemctl restart nginx
```

### Domain Not Working
```bash
# Check DNS propagation
nslookup yourdomain.com

# Check nginx config
nginx -t

# Verify domain in nginx config
cat /etc/nginx/sites-available/afroconnect
```

### SSL Certificate Issues
```bash
# Renew certificate manually
certbot renew

# Test auto-renewal
certbot renew --dry-run
```

---

## Security Best Practices

### 1. Setup Firewall
```bash
# Enable UFW
ufw enable

# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Check status
ufw status
```

### 2. Change SSH Port (Optional)
```bash
nano /etc/ssh/sshd_config
# Change: Port 22 to Port 2222
systemctl restart sshd

# Update firewall
ufw allow 2222/tcp
ufw delete allow 22/tcp
```

### 3. Disable Root Login (Optional)
Create a new user and disable root SSH access.

### 4. Regular Updates
```bash
# Update system packages
apt update && apt upgrade -y

# Update Node.js packages
cd /var/www/afroconnect
npm update
```

---

## Cost Estimation

**Hostinger VPS 1:**
- RAM: 4GB
- CPU: 2 cores
- Storage: 50GB
- Cost: ~$6-8/month

**Supabase (Free tier):**
- Database: 500MB
- Storage: 1GB
- Bandwidth: 2GB
- Cost: $0/month

**Domain:**
- Cost: ~$10-15/year

**SSL Certificate:**
- Let's Encrypt: FREE

**Total Monthly Cost: ~$6-8/month**

---

## Support

If you encounter issues:

1. Check PM2 logs: `pm2 logs afroconnect`
2. Check nginx logs: `tail -f /var/log/nginx/error.log`
3. Verify environment variables: `cat .env.local`
4. Restart services: `pm2 restart afroconnect && systemctl restart nginx`

---

## Production Checklist

Before going live:

- [ ] Domain pointing to VPS IP
- [ ] SSL certificate installed (HTTPS working)
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] PM2 running in cluster mode
- [ ] Nginx configured with gzip
- [ ] Firewall enabled
- [ ] Regular backups configured
- [ ] Error monitoring setup
- [ ] Test all features (Events, RSVP, Messaging, Notifications)
- [ ] Mobile responsiveness verified
- [ ] PWA install working
- [ ] Page load speed optimized

---

**Your AfroConnect platform is now live! 🚀**
