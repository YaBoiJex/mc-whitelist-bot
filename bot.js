const { Client, GatewayIntentBits } = require('discord.js');
const Rcon = require('rcon');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const token = "YOUR_DISCORD_BOT_TOKEN";

const rcon = new Rcon("YOUR_SERVER_IP", 25575, "YOUR_RCON_PASSWORD");

rcon.on('auth', () => {
  console.log("Connected to Minecraft RCON");
});

rcon.connect();

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'register') {
    const username = interaction.options.getString('username');

    rcon.send(`whitelist add ${username}`);

    await interaction.reply(`✅ ${username} has been whitelisted!`);
  }
});

client.once('ready', () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

client.login(token);