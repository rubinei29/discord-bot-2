import * as dotenv from "dotenv";
dotenv.config();

// Require the necessary discord classes
import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import commands, {comandos} from "./commands";

const token = process.env.DISCORD_TOKEN as string;
const clientId = process.env.DISCORD_CLIENT_ID as string;

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

(async () => {
  const rest = new REST({ version: "10" }).setToken(token);

  try {
    console.log(
      `Started refreshing ${comandos.length} application (/) commands.`
    );
    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(Routes.applicationCommands(clientId), {
      body: comandos,
    });
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})()

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command: any = commands.get(interaction.commandName);

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
