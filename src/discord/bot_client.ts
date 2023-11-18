import {
  BitFieldResolvable,
  Client,
  GatewayIntentBits,
  VoiceChannel,
} from 'discord.js';
import { TCommand } from '../types/globals';

const intents: BitFieldResolvable<keyof typeof GatewayIntentBits, number> = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildInvites,
  GatewayIntentBits.GuildVoiceStates,
];

let client;
if (process.env.NODE_ENV === 'production') client = new Client({ intents });
else {
  const cachedDiscord = globalThis as unknown as {
    discord: Client;
  };

  if (!cachedDiscord.discord) cachedDiscord.discord = new Client({ intents });

  client = cachedDiscord.discord;
}

export type TVoiceManagement = {
  voiceChannel: VoiceChannel;
  authorId: string;
};

export const cachedVC = new Map<string, TVoiceManagement>();
export const cachedCommands = new Map<string, TCommand>();

export const discord_client = client;
