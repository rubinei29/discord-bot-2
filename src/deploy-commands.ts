import { REST, Routes } from "discord.js";
import { comandos as commands } from "./commands";

export default async function ({ token, clientId }) {
  // Construct and prepare an instance of the REST module
  const rest = new REST({ version: "10" }).setToken(token);

  // and deploy your commands!
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );
    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
}
