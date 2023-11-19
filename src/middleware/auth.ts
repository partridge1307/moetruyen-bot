import type { NextFunction, Request, Response } from 'express';
import { JsonWebTokenError, verify } from 'jsonwebtoken';
import { ZodError } from 'zod';
import { AuthValidator } from '../lib/validator/auth';

const authMiddleWare = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).end('Missing auth');

  try {
    const decoded = verify(auth.split(' ')[1], process.env.SECURITY_KEY);
    const validatedValue = AuthValidator.parse(decoded);

    res.locals.data = validatedValue.data;
    next();
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      return res.status(401).end('Could not authorized');
    }

    if (error instanceof ZodError) {
      return res.status(422).end('Invalid');
    }

    return res.status(500).end('Something went wrong');
  }
};

export default authMiddleWare;
