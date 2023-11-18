import { Events } from 'discord.js';
import { discord_client } from './bot_client';
import { createVoiceChannel, deleteVoiceChannel } from './function/voice_limit';

discord_client.once(Events.ClientReady, (c) =>
  console.log(`Bot is running with tag: ${c.user.tag}`)
);

discord_client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  if (newState.channel?.name.startsWith('[m]')) {
    await createVoiceChannel(newState);
  }

  if (
    newState.channelId === null ||
    oldState.channelId !== newState.channelId
  ) {
    await deleteVoiceChannel(oldState);
  }
});

discord_client.login(process.env.DISCORD_TOKEN);

export {};
