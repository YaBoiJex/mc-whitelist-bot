const { Client, GatewayIntentBits } = require('discord.js');
const Rcon = require('rcon');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Environment variables
const token = process.env.DISCORD_TOKEN;

// Debug logs so we know variables loaded
console.log("RCON HOST:", process.env.RCON_HOST);
console.log("RCON PORT:", process.env.RCON_PORT);
console.log("DISCORD TOKEN LOADED:", !!process.env.DISCORD_TOKEN);

// RCON connection
const rcon = new Rcon(
  process.env.RCON_HOST,
  Number(process.env.RCON_PORT),
  process.env.RCON_PASSWORD
);

rcon.on('auth', () => {
  console.log("Connected to Minecraft RCON");
});

rcon.on('error', (err) => {
  console.error("RCON Error:", err);
});

rcon.on('end', () => {
  console.log("RCON connection closed");
});

rcon.connect();

// Discord interaction handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'register') {
    const username = interaction.options.getString('username');

    try {
      rcon.send(`whitelist add ${username}`);
      await interaction.reply(`✅ ${username} has been whitelisted!`);
    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: "❌ Failed to whitelist player.",
        ephemeral: true
      });
    }
  }
});

// Bot ready
client.once('ready', () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

// Login
client.login(token);