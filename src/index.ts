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

const rest = new REST({ version: "10" }).setToken(token);

rest.put(Routes.applicationCommands(clientId), {
  body: comandos,
}).then(() => console.log(`Refreshed ${comandos.length} application (/) commands.`))

handleEvents(client);

// Log in to Discord with your client's token
client.login(token);
