const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const token = "YOUR_DISCORD_BOT_TOKEN";
const clientId = "YOUR_CLIENT_ID";

const commands = [
  new SlashCommandBuilder()
    .setName('register')
    .setDescription('Whitelist yourself')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Your Minecraft username')
        .setRequired(true))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  await rest.put(
    Routes.applicationCommands(clientId),
    { body: commands },
  );
})();