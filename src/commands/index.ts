import { Collection } from "discord.js";
import { b } from "./b";

const list = [b];

const commands = new Collection();

list.forEach((c) => commands.set(c.data.name, c));

export default commands;

export const comandos = list.map((c) => c.data.toJSON());
