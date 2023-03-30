import * as dotenv from "dotenv";
dotenv.config();

// Require the necessary discord classes
import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import { comandos } from "./commands";
import handleEvents from "./events";

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
})();

handleEvents(client);

// Log in to Discord with your client's token
client.login(token);
