### PREREQUISITES
- AWS Account
- Discord Developer Account (to create the bot and get tokens)

#### CREATE A DISCORD BOT
- Go to the Discord Developer Portal (https://discord.com/developers/applications)
- Create a new application and give it a name
- Navigate to the "Bot" tab and click "Add bot"
- Under "Privileged Gateway Intents," enable all intents
- Copy your bot token and paste it in a safe location

#### INVITE BOT TO YOUR SERVER
- Go to the "OAuth2" tab, then "URL Generator" 
- Select scopes: "bot" and "application.commands" 
- Select permissions: "Manage Roles," "View Channels," "Send Messages," and "Read Message History" 
- Copy Generated URL and open it in a browser to invite the bot

### CREATE AN EC2 INSTANCE

#### LOG INTO AWS CONSOLE
- Go to https://aws.amazon.com/console/
- Sign in to your account

#### LAUNCH EC2 INSTANCE
- Go to EC2 dashboard
- Click "Launch Instance"
- Choose Amazon Linux 2023
- Select t2.micro (free tier eligible)
- Create or select a key pair
	- Name your key pair 
	- Choose ".ppk" as your "Private key file format"
	- Click "Create key pair" - this will download the private key file to your computer 
	(IMPORTANT: : Save this file somewhere secure - you cannot download it again and will need it to access your instance)
- Configure security groups:
	- In Network settings, select "My IP" from the dropdown located to the right of "Allow SSH traffic from." 
	- Keep "Allow SSH traffic from" checked 
- Click "Launch Instance"

#### DOWNLOAD & INSTALL PUTTY
- Download and install PuTTY from the official website (https://www.putty.org/)

#### CONNECT TO THE INSTANCE WITH PUTTY
- Open PuTTY 
- In the "Host Name" field, enter: ec2-user@your-instance-ip-address (Replace "your-instance-ip-address" with your actual EC2 instance IP) 
- Make sure the port is set to 22 and connection type is SSH
- In the left sidebar, go to Connection > SSH > Auth > Credentials 
- Under "Private key file for authentication," browse to your .ppk file 
- Click "Open" to connect
- Enter "ec2-user" as the username when prompted

#### SET UP ENVIRONMENT ON EC2 IN PUTTY
```sudo yum update -y

# Install PM2 globally
sudo npm install -g pm2

# Create project directory
mkdir -p ~/wallet-bot
cd ~/wallet-bot
```

#### CREATE INDEX.JS FILE
```nano index.js```
- Paste the complete index.js code
- To paste in PuTTY: Right-click in the terminal window (or press Shift+Insert)
- Save and exit with: Ctrl+X, then Y, then Enter

#### CREATE .ENV FILE
```nano .env```
- Paste .env contents with tokens, logins, etc. added
- Save and exit: Ctrl+X, Y, Enter

#### INSTALL DEPENDENCIES
```
sudo yum update -y

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install project dependencies
npm init -y
npm install discord.js dotenv
```

#### START THE BOT
```pm2 start index.js --name "wallet-bot"

# Configure PM2 to start on reboot
pm2 startup

# Run the command it outputs
pm2 save

# View logs
pm2 logs wallet-bot
```

