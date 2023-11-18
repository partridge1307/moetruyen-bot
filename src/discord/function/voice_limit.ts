import { ChannelType, VoiceState } from 'discord.js';
import { cachedVC } from '../bot_client';

const createVoiceChannel = async (voiceState: VoiceState) => {
  const channel = voiceState.channel;
  const member = voiceState.member;
  if (!channel || !member) return;

  try {
    const createdVC = await channel.guild.channels.create({
      name: `m -> ${member.displayName.toLowerCase()}`,
      type: ChannelType.GuildVoice,
      parent: channel.parent,
      userLimit: 7,
    });

    await member.voice.setChannel(createdVC);

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
  if (!channel) return;

  const vc = channel.voiceChannel;

  try {
    if (!vc.members.size) {
      await vc.delete('Session end');
      cachedVC.delete(sessionMember.id);
      return;
    }

    const member = vc.members.first();
    if (!member) return;

    await vc.edit({
      name: `m -> ${member.displayName.toLowerCase()}`,
    });
    cachedVC.set(vc.id, {
      voiceChannel: vc,
      authorId: member.id,
    });
  } catch (error) {
    console.warn(`[ERROR]: Delete voice error: ${error}`);
  }
};

export { createVoiceChannel, deleteVoiceChannel };
