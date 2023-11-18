import {
  ChannelType,
  OverwriteType,
  PermissionFlagsBits,
  VoiceState,
} from 'discord.js';
import { cachedVC } from '../bot_client';

const createVoiceChannel = async (voiceState: VoiceState) => {
  const channel = voiceState.channel;
  const member = voiceState.member;
  if (!channel || !member) return;

  try {
    const createdVC = await channel.guild.channels.create({
      name: `m -> ${(member.nickname ?? member.displayName).toLowerCase()}`,
      type: ChannelType.GuildVoice,
      parent: channel.parent,
      userLimit: 7,
      permissionOverwrites: [
        {
          type: OverwriteType.Member,
          id: member.id,
          allow: [PermissionFlagsBits.ManageChannels],
        },
      ],
    });

    await Promise.all([member.voice.setChannel(createdVC)]);

    cachedVC.set(createdVC.id, createdVC);
  } catch (error) {
    console.warn(`[ERROR]: Create voice error: ${error}`);
  }
};

const deleteVoiceChannel = async (voiceState: VoiceState) => {
  if (!voiceState.channelId) return;

  const channel = cachedVC.get(voiceState.channelId);
  const sessionMember = voiceState.member;

  if (!channel || !sessionMember) return;

  try {
    if (!channel.members.size) {
      await channel.delete('Session end');
      cachedVC.delete(voiceState.channelId);

      return;
    }

    const member = channel.members.first();
    if (!member) return;

    channel.edit({
      name: `m -> ${(member.nickname ?? member.displayName).toLowerCase()}`,
    });
  } catch (error) {
    console.warn(`[ERROR]: Delete voice error: ${error}`);
  }
};

export { createVoiceChannel, deleteVoiceChannel };
