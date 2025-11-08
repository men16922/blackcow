#!/bin/bash
set -e

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Yarn
sudo npm install -g yarn

# Install PM2 for process management
sudo npm install -g pm2

# Install Git
sudo apt-get install -y git

# Create application directory
sudo mkdir -p /opt/shopping-fraud-detector
sudo chown -R ubuntu:ubuntu /opt/shopping-fraud-detector

# Create logs directory
sudo mkdir -p /var/log/shopping-fraud-detector
sudo chown -R ubuntu:ubuntu /var/log/shopping-fraud-detector

# Set environment variables
cat > /opt/shopping-fraud-detector/.env << EOF
NODE_ENV=${node_env}
PORT=3000
CLAUDE_API_KEY=${claude_api_key}
LOG_LEVEL=info
EOF

# Secure the .env file
chmod 600 /opt/shopping-fraud-detector/.env

# Install Nginx for reverse proxy
sudo apt-get install -y nginx

# Configure Nginx
sudo tee /etc/nginx/sites-available/shopping-fraud-detector > /dev/null << 'NGINX_EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        access_log off;
        proxy_pass http://localhost:3000/health;
    }
}
NGINX_EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/shopping-fraud-detector /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Setup PM2 to start on boot
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo "✅ Lightsail instance setup completed!"
