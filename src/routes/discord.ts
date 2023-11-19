import express from 'express';
import {
  fetchChannels,
  fetchRoles,
  fetchServer,
  fetchServers,
} from '../controllers/discord';
import { TDiscordValidator } from '../lib/validator/discord';

const routes = express.Router();

routes.post('/servers', async (req, res) => {
  const { userId } = res.locals.data as TDiscordValidator;

  try {
    const servers = await fetchServers(userId);

    res.json(servers);
  } catch (error) {
    res.status(500).end('Something went wrong');
  }
});

routes.post('/channels', async (req, res) => {
  const { userId, serverId } = res.locals.data as TDiscordValidator;

  if (!serverId) return res.status(422).end('Invalid body');

  try {
    const [guild, channels, roles] = await Promise.all([
      fetchServer(serverId),
      fetchChannels(serverId),
      fetchRoles(userId, serverId),
    ]);
    if (!channels) return res.status(404).end('Not found server');

    res.json({
      name: guild?.name ?? 'Moetruyen',
      channels,
      roles: roles ?? [],
    });
  } catch (error) {
    res.status(500).end('Something went wrong');
  }
});

export default routes;
