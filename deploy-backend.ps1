# Define Variables
$keyPath = "C:\Users\gpayu\Narra\re_testproj\NarraBackendKeyPair.pem"    # Path to your private key
$localPath = "C:\Users\gpayu\Narra\re_testproj\backend"       # Local backend directory
$remoteUser = "ec2-user"                # EC2 username
$remoteHost = "3.138.113.140"    # EC2 public IP
$remotePath = "/home/ec2-user/narra_backend/Narra/re_testproj/backend"   # Backend path on EC2

# Sync Backend Files to EC2 (using rsync for efficiency)
& rsync -avz --exclude "node_modules" --exclude ".git" --exclude ".env" --exclude "logs" `
    -e "ssh -i ${keyPath}" "${localPath}/" "${remoteUser}@${remoteHost}:${remotePath}"

# SSH into EC2 and Restart PM2
ssh -i "${keyPath}" "${remoteUser}@${remoteHost}" "
  cd ${remotePath} &&
  npm install --only=prod &&
  pm2 restart all
"

Write-Output "Deployment Complete!"