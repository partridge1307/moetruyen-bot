import type { Client } from 'discord.js';

export enum NODE_ENV_ENUM {
  production = 'production',
  development = 'development',
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: keyof typeof NODE_ENV_ENUM;
      DISCORD_TOKEN: string;
      DISCORD_ID: string;
    }
  }
}

export {};
