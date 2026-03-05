const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const Rcon = require('rcon');
const fs = require('fs');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

const ALLOWED_ROLES = [
  "1476403422390648984", // Twitch Sidekick
  "1476411329739755684"  // YT Sidekick
];

const DB_FILE = "./whitelist.json";

let whitelistDB = {};

if (fs.existsSync(DB_FILE)) {
  whitelistDB = JSON.parse(fs.readFileSync(DB_FILE));
}

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

let rcon;
let rconReady = false;

function connectRcon() {

  rcon = new Rcon(
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

  rcon.on('end', () => {
    console.log("RCON connection closed. Reconnecting in 5 seconds...");
    rconReady = false;
    setTimeout(connectRcon, 5000);
  });

  rcon.on('error', (err) => {
    console.error("RCON error:", err);
    rconReady = false;
  });

  rcon.connect();
}

connectRcon();

client.on('interactionCreate', async interaction => {

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'register') {

    const hasRole = interaction.member.roles.cache.some(role =>
      ALLOWED_ROLES.includes(role.id)
    );

    if (!hasRole) {

      return interaction.reply({
        content: "❌ You must have the **Twitch Sidekick** or **YT Sidekick** role to register.",
        flags: 64
      });

    }

    if (!rconReady) {

      return interaction.reply({
        content: "⚠️ Minecraft server connection not ready yet.",
        flags: 64
      });

    }

    const discordId = interaction.user.id;
    const username = interaction.options.getString('username');

    if (whitelistDB[discordId]) {

      return interaction.reply({
        content: `❌ You already registered **${whitelistDB[discordId]}**.`,
        flags: 64
      });

    }

    try {

      rcon.send(`whitelist add ${username}`);

      whitelistDB[discordId] = username;

      fs.writeFileSync(DB_FILE, JSON.stringify(whitelistDB, null, 2));

      await interaction.reply(`✅ **${username}** has been whitelisted!`);

      console.log(`${interaction.user.tag} registered ${username}`);

    } catch (err) {

      console.error(err);

      await interaction.reply({
        content: "❌ Failed to whitelist player.",
        flags: 64
      });

    }

  }

});

client.once('clientReady', () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

client.login(token);