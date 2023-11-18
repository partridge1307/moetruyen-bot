import { SlashCommandBuilder } from 'discord.js';
import { TCommand } from '../../../types/globals';

const command: TCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check latency'),
  execute: async (interaction) => {
    interaction.reply({
      content: `Ping: ${interaction.client.ws.ping}ms`,
      ephemeral: true,
    });
  },
};

export default command;
