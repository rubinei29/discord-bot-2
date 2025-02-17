// NAO ESTA FUNCIONANDO
import { CommandInteraction, GuildMember, VoiceChannel } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { userVoiceHistory } from "../utils/voiceHistory"; // Certifique-se de que está no caminho correto

export const data = new SlashCommandBuilder()
    .setName("ausente")
    .setDescription("Move você para o canal de ausentes e salva seu canal atual.");

export async function execute(interaction: CommandInteraction) {
    console.log(`[LOG] Comando /ausente chamado por ${interaction.user.tag}`);

    const member = interaction.member as GuildMember;

    if (!member.voice.channel) {
        console.log("[ERRO] Usuário não está em um canal de voz.");
        await interaction.reply({ content: "Você precisa estar em um canal de voz para usar este comando!", ephemeral: true });
        return;
    }

    const currentChannel = member.voice.channel;
    console.log(`[LOG] Usuário está atualmente no canal: ${currentChannel.name}`);

    const targetChannel = interaction.guild?.channels.cache.find(
        (ch) => ch.name === "Ausente" && ch.type === 2
    ) as VoiceChannel;

    if (!targetChannel) {
        console.log("[ERRO] Canal de ausentes não encontrado.");
        await interaction.reply({ content: "Canal de ausentes não encontrado!", ephemeral: true });
        return;
    }

    // Salva o canal original do usuário no mapa
    userVoiceHistory.set(member.id, currentChannel.id);
    console.log(`[LOG] Canal de origem salvo: ${currentChannel.id}`);

    // Move o usuário
    await member.voice.setChannel(targetChannel);
    console.log(`[LOG] Usuário movido para: ${targetChannel.name}`);

    await interaction.reply({ content: `Você foi movido para ${targetChannel.name}. Para voltar, use **/voltar**.`, ephemeral: true });
}


export default  {
    data,
    execute
}