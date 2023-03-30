import * as dotenv from "dotenv";
dotenv.config();
import { SlashCommandBuilder } from "discord.js";
import openai from "../openai";
import { Readable } from "node:stream";
import { ChatCompletionRequestMessage } from "openai";

interface IMessages {
  [key: string]: ChatCompletionRequestMessage[];
}

const messages: IMessages = {};

export const b = {
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
  if (!messages[interaction.user.id]) messages[interaction.user.id] = [];

  messages[interaction.user.id].push({
    name: interaction.user.id,
    role: "user",
    content: interaction.options.getString("mensagem"),
  });

  try {
    const completion = await openai.createChatCompletion(
      {
        model: "gpt-3.5-turbo",
        messages: messages[interaction.user.id],
        max_tokens: 1500,
        temperature: 0,
        stream: true,
        user: interaction.user.id,
      },
      { responseType: "stream" }
    );

    let resposta = "";

    const streamCompletion = await import("@fortaine/openai/stream").then(
      (m) => m.streamCompletion
    );

    for await (const response of streamCompletion(
      completion.data as unknown as Readable
    )) {
      try {
        const parsed = JSON.parse(response);
        resposta += parsed.choices[0].delta.content ?? "";
      } catch (error) {
        // console.error("Could not JSON parse stream message", response, error);
      }
    }

    messages[interaction.user.id].push({
      name: "bat",
      role: "system",
      content: resposta,
    });

    return resposta;
  } catch (err) {
    console.log(err);
  }
};
