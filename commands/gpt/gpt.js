import * as dotenv from "dotenv";
dotenv.config();
import { SlashCommandBuilder } from "discord.js";
import { streamCompletion } from "@fortaine/openai/stream";
import openai from "../../openai.js";

export default {
  data: new SlashCommandBuilder()
    .setName("b")
    .setDescription("Fale com a bat")
    .addStringOption((option) =>
      option.setName("mensagem").setDescription("Fala ae").setRequired(true)
    ),
  async execute(interaction) {
    await interaction.reply("Calma ae");
    const result = await getOpenApiResponse(interaction);
    await interaction.editReply(result);
  },
};

const getOpenApiResponse = async (interaction) => {
  try {
    const completion = await openai.createChatCompletion(
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            name: interaction.user.id,
            role: "user",
            content: interaction.options.getString("mensagem"),
          },
        ],
        max_tokens: 1500,
        temperature: 0,
        stream: true,
        user: interaction.user.id
      },
      { responseType: "stream" }
    );

    let resposta = "";

    for await (const response of streamCompletion(completion.data)) {
      try {
        const parsed = JSON.parse(response);
        resposta += parsed.choices[0].delta.content ?? "";
      } catch (error) {
        // console.error("Could not JSON parse stream message", response, error);
      }
    }

    return resposta;
  } catch (err) {
    console.log(err);
  }
};
