import { Collection } from "discord.js";
import ping from './test/ping.js'
import server from './test/server.js'
import user from './test/user.js'
import gpt from './gpt/gpt.js'

const list = [ping, server, user, gpt]

const commands = new Collection();

list.forEach(c => commands.set(c.data.name, c))


export default commands

export const comandos = list.map(c => c.data.toJSON())