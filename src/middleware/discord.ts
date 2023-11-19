import type { NextFunction, Request, Response } from 'express';
import { DiscordValidator } from '../lib/validator/discord';
import { ZodError } from 'zod';

const discordMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'POST') res.status(422).end('Only accept POST request');

  try {
    const validatedValue = DiscordValidator.parse(req.body);

    res.locals.data = validatedValue;
    next();
  } catch (error) {
    if (error instanceof ZodError) return res.status(422).end('Invalid');

    return res.status(500).end('Something went wrong');
  }
};

export default discordMiddleware;
