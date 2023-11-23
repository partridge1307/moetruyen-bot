import {
  PermissionFlagsBits,
  TextChannel,
  type Guild,
  type GuildBasedChannel,
  type Role,
} from 'discord.js';
import { discord_client } from '../discord/bot_client';

type TGuild = Pick<Guild, 'id' | 'name'>;
type TChannel = Pick<GuildBasedChannel, 'id' | 'name'>;
type TRole = Pick<Role, 'id' | 'name'>;

const fetchServer = async (serverId: string) => {
  return await discord_client.guilds.fetch(serverId).catch(() => null);
};

const fetchUser = async (userId: string) => {
  return await discord_client.users.fetch(userId).catch(() => null);
};

const fetchServers = async (userId: string) => {
  const cachedGuilds = discord_client.guilds.cache;

  const serversPromise = cachedGuilds.map(async (guild) => {
    const isMem = await guild.members.fetch(userId).catch(() => null);

    if (!isMem) return;
    return {
      id: guild.id,
      name: guild.name,
    };
  });
  const servers = (await Promise.all(serversPromise)).filter(
    Boolean
  ) as TGuild[];

  return servers;
};

const fetchChannels = async (userId: string, serverId: string) => {
  const [guild, user] = await Promise.all([
    fetchServer(serverId),
    fetchUser(userId),
  ]);
  if (!guild || !user) return;

  const cachedChannels = guild.channels.cache;

  const channels = cachedChannels
    .filter((channel) => {
      const isTextChannel = channel instanceof TextChannel;

      const isManager = channel
        .permissionsFor(user)
        ?.has(PermissionFlagsBits.ManageChannels);

      const canSendMessage = channel
        .permissionsFor(channel.client.user)
        ?.has(PermissionFlagsBits.SendMessages);

      if (isTextChannel && isManager && canSendMessage) return true;
      else return false;
    })
    .map(({ id, name }) => ({ id, name })) as TChannel[];

  return channels;
};

const fetchRoles = async (userId: string, serverId: string) => {
  const guild = await fetchServer(serverId);
  if (!guild) return;

  const guildMem = await guild.members.fetch(userId).catch(() => null);
  if (!guildMem) return;

  const isMod = guildMem.permissions.has(
    PermissionFlagsBits.ManageGuild || PermissionFlagsBits.Administrator
  );
  if (!isMod) return;

  const roles = guild.roles.cache
    .filter((role) => role.mentionable)
    .map(({ id, name }) => ({ id, name })) as TRole[];

  return roles;
};

export { fetchChannels, fetchRoles, fetchServers, fetchServer };
