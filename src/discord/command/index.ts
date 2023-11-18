import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { TCommand } from '../../types/globals';
import { cachedCommands } from '../bot_client';

let commands = [];
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  const folders = readdirSync(__dirname).filter(
    (folder) => !folder.endsWith('.ts') && !folder.endsWith('.js')
  );

  for (const folder of folders) {
    const files = readdirSync(join(__dirname, folder)).filter(
      (folder) => folder.endsWith('.ts') || folder.endsWith('.js')
    );

    for (const file of files) {
      const command = (await import(join(__dirname, folder, file)))
        .default as TCommand;

      if (!command.data || !command.execute) continue;

      cachedCommands.set(command.data.name, command);
      commands.push(command.data.toJSON());
    }
  }

  try {
    await rest.put(Routes.applicationCommands(process.env.DISCORD_ID), {
      body: commands,
    });
  } catch (error) {
    console.warn(`[ERROR]: Load command error: ${error}`);
  }
})();

export {};
