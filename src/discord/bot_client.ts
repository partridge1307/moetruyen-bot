import {
  BitFieldResolvable,
  Client,
  GatewayIntentBits,
  TextChannel,
  VoiceChannel,
} from 'discord.js';

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

export const cachedVC = new Map<string, VoiceChannel>();

export const discord_client = client;
