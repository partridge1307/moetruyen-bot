import express from 'express';
import { ZodError } from 'zod';
import { sendNotifyEmbed, sendSetUpEmbed } from '../controllers/notify';
import { TAuthValidator } from '../lib/validator/auth';

const routes = express.Router();

routes.post('/set-up', async (req, res) => {
  const data = res.locals.data as TAuthValidator['data'];

  sendSetUpEmbed(data).catch((err) => console.log(err));
  res.end('OK');
});

routes.post('notify', (req, res) => {
  const data = res.locals.data as TAuthValidator['data'];

  sendNotifyEmbed(data).catch((err) => console.log(err));
  res.end('OK');
});

export default routes;
