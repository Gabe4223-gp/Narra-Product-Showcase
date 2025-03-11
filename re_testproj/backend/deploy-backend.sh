#!/bin/bash

# Define Variables
$keyPath = "$(HOME)/.ssh/NarraBackendKeyPair.pem"    # Path to your private key
$localPath = "$(pwd)"       # Local backend directory
$remoteUser = "ec2-user"                # EC2 username
$remoteHost = "3.138.113.140"    # EC2 public IP
$remotePath = "/home/ec2-user/narra_backend/Narra/re_testproj/backend"   # Backend path on EC2

# Ensure the private key exists
if [ ! -f "$(KEY_PATH)" ]; then
  echo "Error: SSH key file not found at $(KEY_PATH)"
  exit 1
fi

# Ensure we can reach the EC2 instance before attempting sync
echo "Checking SSH connection..."
ssh -i "$(KEY_PATH)" -o ConnectTimeout=10 "$(REMOTE_USER)@$(REMOTE_HOST)" "exit"

if [ $? -ne 0 ]; then
  echo "Error: Unable to connect to EC2 instance at $(REMOTE_HOST)"
  exit 1
fi

# Sync Backend Files to EC2 (using rsync)
echo "Starting file sync..."
rsync -avz --exclude "node_modules" --exclude ".git" --exclude ".env" --exclude "logs" \
    -e "ssh -i $(KEY_PATH)" "$(LOCAL_PATH)/" "$(REMOTE_USER)@$(REMOTE_HOST):$(REMOTE_PATH)"

# SSH into EC2 and Restart PM2
echo "Running remote commands on EC2..."
ssh -i "$(KEY_PATH)" "$(REMOTE_USER)@$(REMOTE_HOST)" << EOF
  cd $(REMOTE_PATH)
  npm install --only=prod
  pm2 restart all
EOF

echo "Deployment Complete!"
