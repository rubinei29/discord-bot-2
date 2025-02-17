import { Client, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageActionRowComponentBuilder, VoiceState, TextChannel, Message } from 'discord.js';
import { storage } from './storage';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
});

// Add error event listeners
client.on('error', error => {
  console.error('Discord client error:', error);
});

client.on('shardError', error => {
  console.error('A websocket connection encountered an error:', error);
});

client.on('warn', warning => {
  console.warn('Discord client warning:', warning);
});

const LOBBY_SIZE = 5;
const LOBBY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const QUEUE_TIMEOUT = 20 * 60 * 1000; // 20 minutes
const BOT_CHANNEL_NAME = 'bot-cs';

let controlMessage: Message | null = null;

const BOT_CS_CHANNEL = 'bot-cs';

async function getChannel(guildId: string, channelName: string): Promise<TextChannel | null> {
  const guild = await client.guilds.fetch(guildId);
  const channel = guild.channels.cache.find(
    channel => channel.name === channelName && channel.isTextBased()
  ) as TextChannel;
  return channel || null;
}

async function getBotChannel(guildId: string): Promise<TextChannel | null> {
  return getChannel(guildId, BOT_CS_CHANNEL);
}

async function getBoraChannel(guildId: string): Promise<TextChannel | null> {
  return getChannel(guildId, BOT_CS_CHANNEL);
}

async function createLobbyButtons() {
  const row = new ActionRowBuilder<MessageActionRowComponentBuilder>();
  row.addComponents(
    new ButtonBuilder()
      .setCustomId('join_lobby')
      .setLabel('Join Lobby')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('leave_lobby')
      .setLabel('Leave Lobby')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('join_queue')
      .setLabel('Join Queue')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('leave_queue')
      .setLabel('Leave Queue')
      .setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder<MessageActionRowComponentBuilder>();
  row2.addComponents(
    new ButtonBuilder()
      .setCustomId('next_in_queue')
      .setLabel('Next in Queue')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('list_lobbies')
      .setLabel('List Lobbies')
      .setStyle(ButtonStyle.Secondary)
  );

  return [row, row2];
}

async function updateLobbyStatus(channelId: string) {
  const lobby = await storage.getActiveLobbyByChannel(channelId);
  if (!lobby) return;

  const botChannel = await getBotChannel(lobby.channelId.split('/')[0]);
  if (!botChannel) return;

  const status = await formatLobbyInfo(lobby.id);
  await botChannel.send(status);
}

async function handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
  // User left a voice channel
  if (oldState.channelId && !newState.channelId) {
    const lobby = await storage.getActiveLobbyByChannel(`${oldState.guild.id}/${oldState.channelId}`);
    if (!lobby) return;

    const members = await storage.getLobbyMembers(lobby.id);
    const member = members.find(m => m.userId === oldState.member?.id);

    if (member) {
      const botChannel = await getBotChannel(oldState.guild.id);
      if (!botChannel) return;

      const message = await botChannel.send({
        content: `<@${oldState.member?.id}> Do you want to continue playing?`,
        components: [
          new ActionRowBuilder<MessageActionRowComponentBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('continue_playing')
                .setLabel('Yes')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId('stop_playing')
                .setLabel('No')
                .setStyle(ButtonStyle.Danger)
            )
        ],
      });

      setTimeout(() => message.delete(), 60000); // Delete after 1 minute
    }
  }
}

async function canJoinQueue(lobbyId: number, userId: string): Promise<boolean> {
  const members = await storage.getLobbyMembers(lobbyId);
  const queue = await storage.getQueueForLobby(lobbyId);

  return !members.some(m => m.userId === userId) &&
         !queue.some(q => q.userId === userId);
}

async function handleInteraction(interaction: any) {
  if (!interaction.isButton()) return;

  const { customId, member, guild } = interaction;
  if (!member || !guild) return;

  const botChannel = await getBotChannel(guild.id);
  if (!botChannel) {
    await interaction.reply({
      content: 'Bot channel #bot-cs not found!',
      flags: ['Ephemeral']
    });
    return;
  }

  const channelId = `${guild.id}/${member.voice.channelId}`;

  switch (customId) {
    case 'join_lobby': {
      const lobby = await storage.getActiveLobbyByChannel(channelId) ||
                   await storage.createLobby(channelId);

      const members = await storage.getLobbyMembers(lobby.id);
      if (members.length >= LOBBY_SIZE) {
        await interaction.reply({
          content: 'Lobby is full! You can join the queue.',
          flags: ['Ephemeral']
        });
        return;
      }

      if (members.some(m => m.userId === member.id)) {
        await interaction.reply({
          content: 'You are already in the lobby!',
          flags: ['Ephemeral']
        });
        return;
      }

      await storage.addMemberToLobby(lobby.id, member.id);
      await interaction.reply({
        content: 'Added to lobby!',
        flags: ['Ephemeral']
      });
      await updateLobbyStatus(channelId);
      break;
    }
    case 'leave_lobby': {
      const lobby = await storage.getActiveLobbyByChannel(channelId);
      if (!lobby) {
        await interaction.reply({
          content: 'No active lobby found!',
          flags: ['Ephemeral']
        });
        return;
      }

      const members = await storage.getLobbyMembers(lobby.id);
      const member = members.find(m => m.userId === interaction.user.id);

      if (!member) {
        await interaction.reply({
          content: 'You are not in this lobby!',
          flags: ['Ephemeral']
        });
        return;
      }

      await storage.removeMemberFromLobby(lobby.id, interaction.user.id);
      await interaction.reply({
        content: 'You have been removed from the lobby!',
        flags: ['Ephemeral']
      });
      await updateLobbyStatus(channelId);
      break;
    }
    case 'join_queue': {
      const lobby = await storage.getActiveLobbyByChannel(channelId);
      if (!lobby) {
        await interaction.reply({
          content: 'No active lobby found!',
          flags: ['Ephemeral']
        });
        return;
      }

      if (!await canJoinQueue(lobby.id, member.id)) {
        await interaction.reply({
          content: 'You are already in the lobby or queue!',
          flags: ['Ephemeral']
        });
        return;
      }

      const queueMember = await storage.addToQueue(lobby.id, member.id);
      await interaction.reply({
        content: `Added to queue at position ${queueMember.position}!`,
        flags: ['Ephemeral']
      });
      await updateLobbyStatus(channelId);
      break;
    }
    case 'leave_queue': {
      const lobby = await storage.getActiveLobbyByChannel(channelId);
      if (!lobby) {
        await interaction.reply({
          content: 'No active lobby found!',
          flags: ['Ephemeral']
        });
        return;
      }

      await storage.removeFromQueue(lobby.id, member.id);
      await interaction.reply({
        content: 'Removed from queue!',
        flags: ['Ephemeral']
      });
      await updateLobbyStatus(channelId);
      break;
    }
    case 'next_in_queue': {
      const lobby = await storage.getActiveLobbyByChannel(channelId);
      if (!lobby) {
        await interaction.reply({
          content: 'No active lobby found!',
          flags: ['Ephemeral']
        });
        return;
      }

      const queue = await storage.getQueueForLobby(lobby.id);
      if (queue.length === 0) {
        await interaction.reply({
          content: 'Queue is empty!',
          flags: ['Ephemeral']
        });
        return;
      }

      const next = queue[0];
      await botChannel.send(`<@${next.userId}> it's your turn to join!`);
      await storage.rotateQueue(lobby.id);
      await interaction.reply({
        content: 'Called next player!',
        flags: ['Ephemeral']
      });
      await updateLobbyStatus(channelId);
      break;
    }
    case 'continue_playing': {
      const lobby = await storage.getActiveLobbyByChannel(channelId);
      if (!lobby) return;

      const expiry = new Date(Date.now() + LOBBY_TIMEOUT);
      await storage.updateMemberTimeout(lobby.id, member.id, expiry);
      await interaction.reply({
        content: 'Please return to the voice channel within 10 minutes!',
        flags: ['Ephemeral']
      });
      await updateLobbyStatus(channelId);
      break;
    }
    case 'stop_playing': {
      const lobby = await storage.getActiveLobbyByChannel(channelId);
      if (!lobby) return;

      await storage.removeMemberFromLobby(lobby.id, member.id);
      await interaction.reply({
        content: 'Removed from lobby!',
        flags: ['Ephemeral']
      });

      // Rotate queue
      const queue = await storage.getQueueForLobby(lobby.id);
      if (queue.length > 0) {
        const next = queue[0];
        await botChannel.send(`<@${next.userId}> it's your turn to join!`);
        await storage.rotateQueue(lobby.id);
      }
      await updateLobbyStatus(channelId);
      break;
    }
    case 'list_lobbies': {
      const activeLobbies = await storage.getActiveLobbies();

      if (activeLobbies.length === 0) {
        await interaction.reply({
          content: 'No active lobbies found!',
          flags: ['Ephemeral']
        });
        return;
      }

      let response = '**Active Lobbies**\n\n';
      for (const lobby of activeLobbies) {
        response += await formatLobbyInfo(lobby.id);
        response += '\n---\n';
      }

      await interaction.reply({
        content: response,
        flags: ['Ephemeral']
      });
      break;
    }
  }
}

async function formatLobbyInfo(lobbyId: number) {
  const members = await storage.getLobbyMembers(lobbyId);
  const queue = await storage.getQueueForLobby(lobbyId);

  let info = `**Lobby #${lobbyId}**\n`;
  info += `Players (${members.length}/${LOBBY_SIZE}):\n`;

  if (members.length > 0) {
    members.forEach((member, index) => {
      info += `${index + 1}. <@${member.userId}>\n`;
    });
  } else {
    info += "No players in lobby\n";
  }

  info += `\nQueue (${queue.length} players):\n`;
  if (queue.length > 0) {
    queue.forEach((member, index) => {
      info += `${index + 1}. <@${member.userId}>\n`;
    });
  } else {
    info += "Queue is empty\n";
  }

  return info;
}


client.on('ready', async () => {
  console.log(`Logged in as ${client.user?.tag}! Intents enabled:`, client.options.intents);

  // Find all guilds and create control message in #bora-cs
  const guilds = await client.guilds.fetch();
  for (const [guildId] of guilds) {
    const boraChannel = await getBoraChannel(guildId);
    if (!boraChannel) continue;

    // Create new control message
    controlMessage = await boraChannel.send({
      content: 'Bora CS?!',
      components: await createLobbyButtons(),
    });
  }
});

client.on('guildCreate', async (guild) => {
  const boraChannel = await getBoraChannel(guild.id);
  if (!boraChannel) return;

  // Create control message for new guild
  controlMessage = await boraChannel.send({
    content: 'Bora CS?!',
    components: await createLobbyButtons(),
  });
});

client.on('voiceStateUpdate', handleVoiceStateUpdate);
client.on('interactionCreate', handleInteraction);

client.on('messageCreate', async (message) => {
  if (message.content.toLowerCase() === '!jogarcs') {
    const boraChannel = await getChannel(message.guild!.id, BOT_CS_CHANNEL);
    if (boraChannel) {
      await boraChannel.send({
        content: 'Bora CS?!',
        components: await createLobbyButtons(),
      });
    }
  }
});

export function startBot(token: string) {
  console.log('Attempting to login with token...');
  client.login(token).catch(error => {
    console.error('Failed to login:', error);
    throw error;
  });
}