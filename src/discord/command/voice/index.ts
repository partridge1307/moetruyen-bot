import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { TCommand } from '../../../types/globals';
import { TVoiceManagement, cachedVC } from '../../bot_client';

enum SubCommandEnum {
  bitrate = 'bitrate',
  limit = 'limit',
}

const command: TCommand = {
  data: new SlashCommandBuilder()
    .setName('voice')
    .setDescription('Voice commands')
    .addSubcommand((cmd) =>
      cmd
        .setName('limit')
        .setDescription('Modify user limit in voice channel')
        .addNumberOption((opt) =>
          opt
            .setName('number')
            .setDescription('Limit value')
            .setMinValue(0)
            .setMaxValue(99)
            .setRequired(true)
        )
    )
    .addSubcommand((cmd) =>
      cmd
        .setName('bitrate')
        .setDescription('Modify bitrate limit in voice channel')
        .addNumberOption((opt) =>
          opt
            .setName('number')
            .setDescription('Bitrate value')
            .setMinValue(8)
            .setMaxValue(384)
            .setRequired(true)
        )
    ),
  execute: async (interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const subCommand = interaction.options.getSubcommand(
      true
    ) as keyof typeof SubCommandEnum;

    const channel = await VoiceValidator(interaction);
    if (!channel) return;

    const numberValue = interaction.options.getNumber('number', true);

    if (subCommand === 'bitrate')
      return await setBitrateFunc(channel, numberValue, interaction);

    if (subCommand === 'limit') {
      return await setLimtFunc(channel, numberValue, interaction);
    }
  },
};

export default command;

const VoiceValidator = async (interaction: ChatInputCommandInteraction) => {
  try {
    const member = await interaction.guild?.members.fetch(interaction.user.id);
    const channelId = member?.voice.channelId;

    if (!member || !channelId) {
      await interaction.editReply(
        `Yêu cầu không phù hợp. Hãy chắc chắn bạn đã vô Voice`
      );
      return;
    }

    const channel = cachedVC.get(channelId);
    if (!channel) {
      await interaction.editReply('Không tìm thấy Voice. Vui lòng thử lại');
      return;
    }

    if (channel.authorId !== interaction.user.id) {
      await interaction.editReply('Lệnh này yêu cầu bạn phải là chủ Voice');
      return;
    }

    return channel;
  } catch (error) {
    interaction.editReply('Có lỗi xảy ra. Vui lòng thử lại sau');
    return;
  }
};

const setBitrateFunc = async (
  channel: TVoiceManagement,
  numberValue: number,
  interaction: ChatInputCommandInteraction
) => {
  const vc = channel.voiceChannel;
  const boostCount = vc.guild.premiumSubscriptionCount ?? 0;
  const MAX_BITRATE =
    boostCount >= 14 ? 384 : boostCount >= 7 ? 256 : boostCount >= 2 ? 128 : 96;

  await Promise.all([
    vc.setBitrate(
      (numberValue > MAX_BITRATE ? MAX_BITRATE : numberValue) * 1000
    ),
    interaction.editReply({
      content: `Bạn đã chỉnh bitrate Channel <#${vc.id}> lên ${numberValue}kbps`,
    }),
  ]);
};

const setLimtFunc = async (
  channel: TVoiceManagement,
  numberValue: number,
  interaction: ChatInputCommandInteraction
) => {
  const vc = channel.voiceChannel;

  await Promise.all([
    vc.setUserLimit(numberValue),
    interaction.editReply({
      content: `Bạn đã chỉnh giới hạn Channel <#${vc.id}> lên ${
        numberValue === 0 ? 'không giới hạn' : numberValue
      } người`,
    }),
  ]);
};
