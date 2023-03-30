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
    const result = await getOpenApiResponse(
      interaction.options.getString("mensagem")
    );
    console.log(interaction)
    await interaction.editReply(result, interaction.id);
  },
};

const getOpenApiResponse = async (message, id) => {
  console.log(id)
  try {
    const completion = await openai.createCompletion(
      {
        model: "text-davinci-003",
        prompt: message,
        max_tokens: 1500,
        temperature: 0,
        stream: true,
        user: id

      },
      { responseType: "stream" }
    );

    // await interaction.reply(message);
    let resposta = "";

    for await (const response of streamCompletion(completion.data)) {
      try {
        const parsed = JSON.parse(response);
        const { text } = parsed.choices[0];
        resposta += text;
      } catch (error) {
        // console.error("Could not JSON parse stream message", response, error);
      }
    } 

    return resposta;
  } catch (err) {
    console.log(err);
  }
};
