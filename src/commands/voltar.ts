// NAO ESTA FUNCIONANDO
import { CommandInteraction, GuildMember, VoiceChannel } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { userVoiceHistory } from "../utils/voiceHistory"; // Certifique-se de que está no caminho correto

export const data = new SlashCommandBuilder()
    .setName("voltar")
    .setDescription("Retorna ao canal de voz original antes de usar /ausente.");

export async function execute(interaction: CommandInteraction) {
    console.log(`[LOG] Comando /voltar chamado por ${interaction.user.tag}`);

    const member = interaction.member as GuildMember;

    if (!member.voice.channel) {
        console.log("[ERRO] Usuário não está em um canal de voz.");
        await interaction.reply({ content: "Você precisa estar em um canal de voz para usar este comando!", ephemeral: true });
        return;
    }

    const previousChannelId = userVoiceHistory.get(member.id);

    if (!previousChannelId) {
        console.log("[ERRO] Nenhum canal salvo para este usuário.");
        await interaction.reply({ content: "Não há registro de onde você estava antes!", ephemeral: true });
        return;
    }

    const previousChannel = interaction.guild?.channels.cache.get(previousChannelId) as VoiceChannel;

    if (!previousChannel) {
        console.log("[ERRO] O canal original não foi encontrado.");
        await interaction.reply({ content: "O canal original não foi encontrado!", ephemeral: true });
        return;
    }

    // Move de volta e remove do histórico
    await member.voice.setChannel(previousChannel);
    userVoiceHistory.delete(member.id);
    console.log(`[LOG] Usuário movido de volta para: ${previousChannel.name}`);

    await interaction.reply({ content: `Você voltou para ${previousChannel.name}.`, ephemeral: true });
}

export default  {
    data,
    execute
}