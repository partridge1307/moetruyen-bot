import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';

export enum NODE_ENV_ENUM {
  production = 'production',
  development = 'development',
}

export type TCommand = {
  data: SlashCommandSubcommandsOnlyBuilder;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: keyof typeof NODE_ENV_ENUM;
      DISCORD_TOKEN: string;
      DISCORD_ID: string;
      COR_URL: string;
      SECURITY_KEY: string;
      MAIN_URL: string;
    }
  }
}

export {};
