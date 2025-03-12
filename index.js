// Required discord.js classes and Node.js modules
const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Discord client with only the necessary intents
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ] 
});

// Get values from environment variables
const TOKEN = process.env.DISCORD_TOKEN;
const ALLOWLIST_ROLE_ID = process.env.ALLOWLIST_ROLE_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

// File to store wallet addresses
const WALLETS_FILE = path.join(__dirname, 'data', 'wallets.json');

// Initialize wallets storage
let wallets = [];
if (fs.existsSync(WALLETS_FILE)) {
  try {
    wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
  } catch (error) {
    console.error('Error reading wallets file:', error);
    // Create empty wallet file if there's an error
    fs.writeFileSync(WALLETS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
} else {
  // Create the data directory if it doesn't exist
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }
  // Create empty wallet file
  fs.writeFileSync(WALLETS_FILE, JSON.stringify([], null, 2), 'utf8');
}

// Save wallets to file
function saveWallets() {
  fs.writeFileSync(WALLETS_FILE, JSON.stringify(wallets, null, 2), 'utf8');
}

// When the bot is ready
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  
  // Register slash commands
  const commands = [
    new SlashCommandBuilder()
      .setName('register')
      .setDescription('Register your wallet address for the NFT allowlist')
      .addStringOption(option => 
        option.setName('wallet')
          .setDescription('Your EVM wallet address')
          .setRequired(true))
      .addStringOption(option => 
        option.setName('twitter')
          .setDescription('Your Twitter/X username')
          .setRequired(true)),
    
    new SlashCommandBuilder()
      .setName('update')
      .setDescription('Update your registered wallet address')
      .addStringOption(option => 
        option.setName('wallet')
          .setDescription('Your new EVM wallet address')
          .setRequired(true))
      .addStringOption(option => 
        option.setName('twitter')
          .setDescription('Your Twitter/X username (can be the same)')
          .setRequired(true)),
    
    new SlashCommandBuilder()
      .setName('viewmywallet')
      .setDescription('View your currently registered wallet address'),
    
    new SlashCommandBuilder()
      .setName('walletlist')
      .setDescription('Admin only: View all registered wallets as CSV'),
      
    new SlashCommandBuilder()
      .setName('exportwallets')
      .setDescription('Admin only: Export wallet data as JSON')
  ];
  
  try {
    console.log('Started refreshing application (/) commands.');
    await client.application.commands.set(commands);
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
});

// Handle command interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'register') {
    // Get the user's input
    const walletAddress = interaction.options.getString('wallet');
    const twitterUsername = interaction.options.getString('twitter');
    const discordUsername = interaction.user.tag;
    const discordId = interaction.user.id;
    
    // Validate the wallet address
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return interaction.reply({ 
        content: 'Please enter a valid EVM wallet address (0x followed by 40 hexadecimal characters).', 
        ephemeral: true 
      });
    }
    
    // Check if wallet is already registered
    if (wallets.some(entry => entry.walletAddress.toLowerCase() === walletAddress.toLowerCase())) {
      return interaction.reply({ 
        content: 'This wallet address has already been registered.', 
        ephemeral: true 
      });
    }
    
    // Check if user has already registered a wallet
    if (wallets.some(entry => entry.discordId === discordId)) {
      return interaction.reply({ 
        content: 'You have already registered a wallet address. Use /update to change your wallet address.', 
        ephemeral: true 
      });
    }
    
    // Add wallet to database
    wallets.push({
      walletAddress,
      discordUsername,
      discordId,
      twitterUsername,
      timestamp: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    });
    
    saveWallets();
    
    // Assign role if specified
    if (ALLOWLIST_ROLE_ID) {
      try {
        const guild = interaction.guild;
        const member = await guild.members.fetch(discordId);
        await member.roles.add(ALLOWLIST_ROLE_ID);
      } catch (error) {
        console.error('Error assigning role:', error);
      }
    }
    
    // Create embed response
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('Wallet Registration Successful')
      .setDescription('Your wallet has been registered for the allowlist!')
      .addFields(
        { name: 'Wallet Address', value: walletAddress },
        { name: 'Discord', value: discordUsername },
        { name: 'Twitter/X', value: twitterUsername }
      )
      .setTimestamp();
    
    // Reply to the user
    await interaction.reply({ embeds: [embed], ephemeral: true });
    
    // Also send a message to a log channel if configured
    if (LOG_CHANNEL_ID) {
      const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
      if (logChannel) {
        embed.setTitle('New Wallet Registration')
          .setDescription(`User <@${discordId}> has registered their wallet!`);
        await logChannel.send({ embeds: [embed] });
      }
    }
  }
  
  // Update wallet command
  else if (commandName === 'update') {
    // Get the user's input
    const newWalletAddress = interaction.options.getString('wallet');
    const newTwitterUsername = interaction.options.getString('twitter');
    const discordId = interaction.user.id;
    
    // Validate the wallet address
    if (!/^0x[a-fA-F0-9]{40}$/.test(newWalletAddress)) {
      return interaction.reply({ 
        content: 'Please enter a valid EVM wallet address (0x followed by 40 hexadecimal characters).', 
        ephemeral: true 
      });
    }
    
    // Check if wallet is already registered by someone else
    if (wallets.some(entry => 
        entry.walletAddress.toLowerCase() === newWalletAddress.toLowerCase() && 
        entry.discordId !== discordId)) {
      return interaction.reply({ 
        content: 'This wallet address has already been registered by another user.', 
        ephemeral: true 
      });
    }
    
    // Check if user has registered a wallet
    const userWalletIndex = wallets.findIndex(entry => entry.discordId === discordId);
    
    if (userWalletIndex === -1) {
      return interaction.reply({ 
        content: 'You have not registered a wallet address yet. Use /register to register your wallet.', 
        ephemeral: true 
      });
    }
    
    // Store old values for logging
    const oldWalletAddress = wallets[userWalletIndex].walletAddress;
    
    // Update wallet in database
    wallets[userWalletIndex].walletAddress = newWalletAddress;
    wallets[userWalletIndex].twitterUsername = newTwitterUsername;
    wallets[userWalletIndex].lastUpdated = new Date().toISOString();
    
    saveWallets();
    
    // Create embed response
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('Wallet Update Successful')
      .setDescription('Your wallet address has been updated!')
      .addFields(
        { name: 'Previous Wallet Address', value: oldWalletAddress },
        { name: 'New Wallet Address', value: newWalletAddress },
        { name: 'Twitter/X', value: newTwitterUsername }
      )
      .setTimestamp();
    
    // Reply to the user
    await interaction.reply({ embeds: [embed], ephemeral: true });
    
    // Also send a message to a log channel if configured
    if (LOG_CHANNEL_ID) {
      const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
      if (logChannel) {
        embed.setTitle('Wallet Address Updated')
          .setDescription(`User <@${discordId}> has updated their wallet address!`);
        await logChannel.send({ embeds: [embed] });
      }
    }
  }
  
  // View own wallet command
  else if (commandName === 'viewmywallet') {
    const discordId = interaction.user.id;
    
    // Find user's wallet
    const userWallet = wallets.find(entry => entry.discordId === discordId);
    
    if (!userWallet) {
      return interaction.reply({ 
        content: 'You have not registered a wallet address yet. Use /register to register your wallet.', 
        ephemeral: true 
      });
    }
    
    // Create embed response
    const embed = new EmbedBuilder()
      .setColor(0x9932CC)
      .setTitle('Your Registered Wallet')
      .addFields(
        { name: 'Wallet Address', value: userWallet.walletAddress },
        { name: 'Twitter/X', value: userWallet.twitterUsername },
        { name: 'Registration Date', value: new Date(userWallet.timestamp).toLocaleString() }
      );
      
    if (userWallet.lastUpdated && userWallet.lastUpdated !== userWallet.timestamp) {
      embed.addFields({ name: 'Last Updated', value: new Date(userWallet.lastUpdated).toLocaleString() });
    }
    
    // Reply to the user
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // Admin command to view all wallets as CSV
  else if (commandName === 'walletlist') {
    // Check if user has admin permission
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ 
        content: 'You do not have permission to use this command.', 
        ephemeral: true 
      });
    }
    
    if (wallets.length === 0) {
      return interaction.reply({
        content: 'No wallets have been registered yet.',
        ephemeral: true
      });
    }
    
    // Create CSV string
    let csv = 'Wallet Address,Discord,Twitter,Registration Date,Last Updated\n';
    wallets.forEach(entry => {
      csv += `${entry.walletAddress},${entry.discordUsername},${entry.twitterUsername},${entry.timestamp},${entry.lastUpdated || entry.timestamp}\n`;
    });
    
    // Write to temporary file
    const csvFilePath = path.join(__dirname, 'data', 'wallets.csv');
    fs.writeFileSync(csvFilePath, csv, 'utf8');
    
    // Send file
    await interaction.reply({
      content: `Total registered wallets: ${wallets.length}`,
      files: [csvFilePath],
      ephemeral: true
    });
    
    // Delete temporary file after sending
    setTimeout(() => {
      try {
        fs.unlinkSync(csvFilePath);
      } catch (error) {
        console.error('Error deleting temporary file:', error);
      }
    }, 5000);
  }
  
  // Admin command to export wallets as JSON
  else if (commandName === 'exportwallets') {
    // Check if user has admin permission
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ 
        content: 'You do not have permission to use this command.', 
        ephemeral: true 
      });
    }
    
    // Send the JSON file
    await interaction.reply({
      content: `Exporting ${wallets.length} registered wallets as JSON.`,
      files: [WALLETS_FILE],
      ephemeral: true
    });
  }
});

// Error handler
client.on('error', error => {
  console.error('Discord client error:', error);
});

// Login to Discord
client.login(TOKEN);