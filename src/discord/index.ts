import {
  ApplicationCommandType,
  Collection,
  Events,
  InteractionType,
  VoiceChannel,
} from 'discord.js';
import { cachedCommands, cachedVC, discord_client } from './bot_client';
import './command';
import { createVoiceChannel, deleteVoiceChannel } from './function/voice_limit';

discord_client.once(Events.ClientReady, (c) => {
  const guilds = c.guilds.cache;

  for (const [_, guild] of guilds) {
    const voiceChannels = guild.channels.cache.filter(
      (channel) =>
        channel instanceof VoiceChannel && channel.name.startsWith('m -> ')
    ) as Collection<string, VoiceChannel>;

    voiceChannels.map((vc) => {
      if (!vc.members.size) return vc.delete();

      const username = vc.name.split(' -> ')[1];
      const member = vc.members.find(
        (mem) => mem.user.username.toLowerCase() === username
      );
      if (!member) return;

      cachedVC.set(vc.id, {
        voiceChannel: vc,
        authorId: member.id,
      });
    });
  }
});

discord_client.on(Events.InteractionCreate, async (interaction) => {
  switch (interaction.type) {
    case InteractionType.ApplicationCommand: {
      if (interaction.commandType !== ApplicationCommandType.ChatInput) return;

      const command = cachedCommands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.warn(`[ERROR]: Execute command error: ${error}`);
      }
      break;
    }
    case InteractionType.ApplicationCommandAutocomplete: {
      const command = cachedCommands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.autocomplete?.(interaction);
      } catch (error) {
        console.warn(`[ERROR]: Execute autocomplete error: ${error}`);
      }
      break;
    }
  }
});

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
