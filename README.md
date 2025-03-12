Create a Discord Develop Application:
• Go to the Discord Developer Portal (https://discord.com/developers/applications)
• Create a new application and give it a name
• Navigate to the "Bot" tab and click "Add bot"
• Under "Privileged Gateway Intents," enable all intents
• Copy your bot token and paste it in a safe location

Invite the Bot to Your Server:
• Go to the "OAuth2" tab, then "URL Generator"
• Select scopes: "bot" and "application.commands"
• Select permissions: "Manage Roles," "View Channels," "Send Messages," and "Read Message History"
• Copy Generated URL and open it in a browser to invite the bot

Update the .env file with:
• Your Discord bot token from the Discord Developer Portal
• Your server ID (right-click on your server and "Copy ID")
• Your allow list role ID (right-click on the role and "Copy ID") - this is optional
• Your log channel ID (right-click on the channel and "Copy ID") - this is optional

Update Channel Permissions in Discord:
• Go to your server settings
• Navigate to "Integrations"
• Click on your bot under "Bots and Apps"
• You can choose specific channels where commands are allowed

Create a Registration Channel:
• Set up a dedicated channel for wallet registration
• Add a welcome message with instructions
• Use the bot's /register command there

Create an AWS Account:
• Go to AWS and sign up
• You'll need to provide a credit card, but won't be charged if you stay within Free Tier limits

Set Up an Instance:
• Launch an EC2 Instance
• Select Amazon Linux
• Select Amazon Linux 2023 AMI for the Amazon Machine Image (AMI)
• Select t2.micro for the Instance Type

Create a new key pair:
• Name your key pair
• Choose ".ppk" as your "Private key file format"
• Click "Create key pair" - this will download the private key file to your computer
(IMPORTANT: : Save this file somewhere secure - you cannot download it again and will need it to access your instance)

Finish Setting Up Your Instance:
• In Network settings, select "My IP" from the dropdown located to the right of "Allow SSH traffic from." Keep "Allow SSH traffic from" checked
• Click "Launch Instance"

Download and Install PuTTY:
• Download and install PuTTY from the official website (https://www.putty.org/)

Connect Using PuTTY:
• Open PuTTY
• In the "Host Name" field, enter: ec2-user@your-instance-ip-address
(Replace "your-instance-ip-address" with your actual EC2 instance IP)
• Make sure the port is set to 22 and connection type is SSH
• In the left sidebar, go to Connection > SSH > Auth > Credentials
• Under "Private key file for authentication," browse to your .ppk file
• Click "Open" to connect
• Enter "ec2-user" as the username when prompted

Once connected, you proceed with setting up your discord bot by following these steps:

# Update the system
sudo dnf update -y

# Install Node.js and npm
sudo dnf install -y nodejs

# Create a directory for your bot
mkdir -p ~/wallet-bot
cd ~/wallet-bot

# Create your .env file
nano .env
# Add your bot token and other configuration

# Create your index.js file
nano index.js
# Paste your bot code

# Install dependencies
npm install discord.js dotenv

# Install PM2 to keep the bot running
sudo npm install -g pm2
pm2 start index.js --name "wallet-bot"
pm2 startup
# Run the command it outputs
pm2 save

Your bot should now be running 24/7 on your EC2 instance, and it will automatically restart if the server reboots.