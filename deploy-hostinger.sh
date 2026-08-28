#!/bin/bash
# AfroConnect - Hostinger VPS Deployment Script
# Run this script on your Hostinger VPS

set -e

echo "🚀 AfroConnect Deployment Script for Hostinger VPS"
echo "=================================================="

# Configuration
APP_NAME="afroconnect"
APP_DIR="/var/www/$APP_NAME"
DOMAIN="yourdomain.com"  # Replace with your domain
PORT=3000

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (use: sudo bash deploy-hostinger.sh)${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Running as root${NC}"

# Step 2: Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    echo -e "${GREEN}✓ Node.js installed: $(node -v)${NC}"
else
    echo -e "${GREEN}✓ Node.js already installed: $(node -v)${NC}"
fi

# Step 3: Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Installing PM2...${NC}"
    npm install -g pm2
    echo -e "${GREEN}✓ PM2 installed${NC}"
else
    echo -e "${GREEN}✓ PM2 already installed${NC}"
fi

# Step 4: Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Installing Nginx...${NC}"
    apt update
    apt install -y nginx
    systemctl enable nginx
    echo -e "${GREEN}✓ Nginx installed${NC}"
else
    echo -e "${GREEN}✓ Nginx already installed${NC}"
fi

# Step 5: Create app directory
echo -e "${YELLOW}Setting up application directory...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

# Step 6: Install dependencies and build
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}Building application...${NC}"
npm run build

# Step 7: Setup PM2
echo -e "${YELLOW}Configuring PM2...${NC}"
pm2 delete $APP_NAME 2>/dev/null || true
pm2 start npm --name "$APP_NAME" -- start
pm2 startup systemd -u root --hp /root
pm2 save

echo -e "${GREEN}✓ Application started with PM2${NC}"

# Step 8: Configure Nginx
echo -e "${YELLOW}Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/$APP_NAME <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Service Worker and Manifest
    location ~* (service-worker\.js|sw\.js|manifest\.json)$ {
        proxy_pass http://localhost:$PORT;
        proxy_set_header Host \$host;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://localhost:$PORT;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Images and assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:$PORT;
        add_header Cache-Control "public, max-age=2592000";
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx

echo -e "${GREEN}✓ Nginx configured and reloaded${NC}"

# Step 9: Setup firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
echo -e "${GREEN}✓ Firewall rules added${NC}"

# Step 10: SSL Setup Instructions
echo ""
echo -e "${GREEN}=================================================="
echo -e "✅ DEPLOYMENT COMPLETE!"
echo -e "==================================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Create .env.local file with your Supabase credentials:"
echo "   cd $APP_DIR"
echo "   nano .env.local"
echo ""
echo "   Add these variables:"
echo "   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key"
echo ""
echo "2. Restart the application:"
echo "   pm2 restart $APP_NAME"
echo ""
echo "3. Setup SSL certificate (FREE):"
echo "   apt install certbot python3-certbot-nginx"
echo "   certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "4. Point your domain DNS to this server IP:"
echo "   A Record: @ -> $(curl -s ifconfig.me)"
echo "   A Record: www -> $(curl -s ifconfig.me)"
echo ""
echo -e "${GREEN}Useful Commands:${NC}"
echo "  pm2 status               - Check app status"
echo "  pm2 logs $APP_NAME       - View app logs"
echo "  pm2 restart $APP_NAME    - Restart app"
echo "  pm2 stop $APP_NAME       - Stop app"
echo "  nginx -t                 - Test nginx config"
echo "  systemctl status nginx   - Check nginx status"
echo ""
echo -e "${GREEN}Your app is running at: http://$(curl -s ifconfig.me)${NC}"
echo ""
