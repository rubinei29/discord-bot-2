import * as dotenv from "dotenv"
dotenv.config()

// Require the necessary discord.js classes
import { Client, Events, GatewayIntentBits } from "discord.js";
import deployCommands from './deploy-commands.js'

import commands from "./commands/index.js"

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

deployCommands({
  token,
  clientId,
});

client.commands = commands

// const __filename = fileURLToPath(import.meta.url);
// console.log(1, __filename)
// const __dirname = path.dirname(__filename)
// console.log(2, __dirname)

// const foldersPath = path.join("file:///", __dirname, "commands");
// console.log(3, foldersPath)

// const formatPath =  foldersPath

// const commandFolders = fs.readdirSync(foldersPath);


client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Log in to Discord with your client's token
client.login(token);
