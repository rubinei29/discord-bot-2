import { Collection } from "discord.js";
import ausente from './ausente'
import voltar from './voltar'

const list = [ausente, voltar];

const commands = new Collection<any, typeof ausente>();

list.forEach((c) => commands.set(c.data.name, c));

export default commands;

export const comandos = list.map((c) => c.data.toJSON());
