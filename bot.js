const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const Rcon = require('rcon');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

// Allowed roles
const ALLOWED_ROLES = [
  "1476403422390648984", // Twitch Sidekick
  "1476411329739755684"  // YT Sidekick
];

// Slash command setup
const commands = [
  new SlashCommandBuilder()
    .setName('register')
    .setDescription('Whitelist yourself on the Minecraft server')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Your Minecraft username')
        .setRequired(true)
    )
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

// Register slash command
(async () => {
  try {
    console.log("Registering slash command...");

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log("Slash command registered.");
  } catch (error) {
    console.error(error);
  }
})();

// RCON connection
let rconReady = false;

const rcon = new Rcon(
  process.env.RCON_HOST,
  Number(process.env.RCON_PORT),
  process.env.RCON_PASSWORD
);

rcon.on('auth', () => {
  console.log("Connected to Minecraft RCON");
  rconReady = true;
});

rcon.on('response', (str) => {
  console.log("Server response:", str);
});

rcon.on('error', (err) => {
  console.error("RCON error:", err);
});

rcon.on('end', () => {
  console.log("RCON connection closed");
  rconReady = false;
});

rcon.connect();

// Command handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'register') {

    // Check role permission
    const hasRole = interaction.member.roles.cache.some(role =>
      ALLOWED_ROLES.includes(role.id)
    );

    if (!hasRole) {
      return interaction.reply({
        content: "❌ You must be a **Twitch Sidekick or YT Sidekick** to whitelist yourself.",
        ephemeral: true
      });
    }

    // Make sure RCON is ready
    if (!rconReady) {
      return interaction.reply({
        content: "⚠️ Minecraft server connection is not ready yet. Try again in a few seconds.",
        ephemeral: true
      });
    }

    const username = interaction.options.getString('username');

    try {

      rcon.send(`whitelist add ${username}`);

      await interaction.reply(`✅ **${username}** has been whitelisted!`);

      console.log(`${interaction.user.tag} whitelisted ${username}`);

    } catch (err) {

      console.error(err);

      await interaction.reply({
        content: "❌ Failed to whitelist player.",
        ephemeral: true
      });

    }
  }
});

client.once('ready', () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

client.login(token);