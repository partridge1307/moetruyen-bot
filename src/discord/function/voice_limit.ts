import { ChannelType, EmbedBuilder, GuildMember, VoiceState } from 'discord.js';
import { cachedVC } from '../bot_client';

const generateEmbed = (member: GuildMember, type: 'CREATED' | 'EDIT') => {
  const embed = new EmbedBuilder();
  embed.setAuthor({
    iconURL: member.displayAvatarURL(),
    name: member.displayName,
  });
  embed.setTitle(
    type === 'CREATED'
      ? 'Temporary Channel Created'
      : 'Temporary Channel Author Changed'
  );
  embed.setDescription(`
  ****COMMAND****:\n\n</voice bitrate:1177333446352322685> Để chỉnh bitrate cho Channel.\n</voice limit:1177333446352322685> Để chỉnh limit cho Channel.`);
  embed.addFields([
    {
      name: 'Author',
      value: member.displayName,
    },
  ]);
  embed.setFooter({
    iconURL: member.guild.client.user.displayAvatarURL(),
    text: member.guild.client.user.tag,
  });

  return embed;
};

const createVoiceChannel = async (voiceState: VoiceState) => {
  const channel = voiceState.channel;
  const member = voiceState.member;
  if (!channel || !member) return;

  try {
    const createdVC = await channel.guild.channels.create({
      name: `m -> ${member.user.username.toLowerCase()}`,
      type: ChannelType.GuildVoice,
      parent: channel.parent,
      userLimit: 7,
    });

    await Promise.all([
      member.voice.setChannel(createdVC),
      createdVC.send({
        content: `<@${member.id}>`,
        embeds: [generateEmbed(member, 'CREATED')],
      }),
    ]);

    cachedVC.set(createdVC.id, {
      voiceChannel: createdVC,
      authorId: member.id,
    });
  } catch (error) {
    console.warn(`[ERROR]: Create voice error: ${error}`);
  }
};

const deleteVoiceChannel = async (voiceState: VoiceState) => {
  const sessionMember = voiceState.member;
  if (!voiceState.channelId || !sessionMember) return;

  const channel = cachedVC.get(voiceState.channelId);
  if (!channel || channel.authorId !== sessionMember.id) return;

  const vc = channel.voiceChannel;

  try {
    if (!vc.members.size) {
      await vc.delete('Session end');
      cachedVC.delete(sessionMember.id);
      return;
    }

    const member = vc.members.first();
    if (!member) return;

    await vc
      .edit({
        name: `m -> ${member.user.username.toLowerCase()}`,
      })
      .then((channel) =>
        channel.send({
          content: `<@${member.id}>`,
          embeds: [generateEmbed(member, 'EDIT')],
        })
      );
    cachedVC.set(vc.id, {
      voiceChannel: vc,
      authorId: member.id,
    });
  } catch (error) {
    console.warn(`[ERROR]: Delete voice error: ${error}`);
  }
};

export { createVoiceChannel, deleteVoiceChannel };
