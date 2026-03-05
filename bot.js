const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const Rcon = require('rcon');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

// Register slash command automatically
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
    console.log('Registering slash command...');

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log('Slash command registered.');
  } catch (error) {
    console.error(error);
  }
})();

// RCON connection
const rcon = new Rcon(
  process.env.RCON_HOST,
  Number(process.env.RCON_PORT),
  process.env.RCON_PASSWORD
);

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