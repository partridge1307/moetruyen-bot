import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import authMiddleWare from './middleware/auth';
import discordMiddleware from './middleware/discord';
import DiscordRoutes from './routes/discord';
import NotifyRoutes from './routes/notify';

const app = express();

app.use(
  cors({
    origin: process.env.COR_URL,
  })
);
app.use(helmet());
app.use(express.json());

app.use('/api/private', authMiddleWare, NotifyRoutes);

app.use('/api/discord', discordMiddleware, DiscordRoutes);

export { app };
