import * as dotenv from "dotenv";
dotenv.config();
import { SlashCommandBuilder } from "discord.js";
import { Configuration, OpenAIApi } from "openai";
import { streamCompletion } from "@fortaine/openai/stream";
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!")
    .addStringOption((option) =>
      option.setName("msg").setDescription("Message to send").setRequired(true)
    ),
  async execute(interaction) {
    await interaction.reply("Working on it");
    const result = await getOpenApiResponse(
      interaction.options.getString("msg")
    );
    await interaction.editReply(result);
  },
};

const getOpenApiResponse = async (message) => {
  try {
    const completion = await openai.createCompletion(
      {
        model: "text-davinci-003",
        prompt: message,
        max_tokens: 1000,
        temperature: 0,
        stream: true,
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
