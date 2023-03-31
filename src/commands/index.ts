import { Collection } from "discord.js";
import { b } from "./b";
import { v } from "./v";

const list = [b, v];

const commands = new Collection<any, typeof b>();

list.forEach((c) => commands.set(c.data.name, c));

export default commands;

export const comandos = list.map((c) => c.data.toJSON());
