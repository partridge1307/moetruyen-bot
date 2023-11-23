import { Prisma } from '@prisma/client';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { db } from '../../../lib/db';
import { SearchMangaAutoComplete } from '../../../lib/query';
import { ObjectValues, checkUserPermission } from '../../../lib/utils';
import { TCommand } from '../../../types/globals';

const CommandTypeEnum = {
  apply: 'apply',
} as const;

const command: TCommand = {
  data: new SlashCommandBuilder()
    .setName('pin')
    .setDescription('Manga pin command')
    .addSubcommand((cmd) =>
      cmd
        .setName('apply')
        .setDescription('Set manga pin')
        .addStringOption((opt) =>
          opt
            .setName('name')
            .setDescription('Manga name')
            .setRequired(true)
            .setAutocomplete(true)
        )
    ),
  autocomplete: async (interaction) => {
    const focusedValue = interaction.options.getFocused(true).value;
    if (!focusedValue) return;

    const result = await SearchMangaAutoComplete({
      searchPhrase: focusedValue,
    });

    await interaction.respond(
      result.map((manga) => ({ name: manga.name, value: manga.slug }))
    );
  },
  execute: async (interaction) => {
    const command = interaction.options.getSubcommand(true) as ObjectValues<
      typeof CommandTypeEnum
    >;

    await interaction.deferReply({ ephemeral: true });

    if (interaction.user.bot) {
      interaction.editReply('You can not use this command');
      return;
    }

    const isModerator = await checkUserPermission({
      permission: ['ADMINISTRATOR', 'MANAGE_MANGA'],
      interaction,
    });

    if (!isModerator) {
      interaction.editReply('You do not have permission to use this command');
      return;
    }

    switch (command) {
      case CommandTypeEnum.apply: {
        await pinManga(interaction);

        break;
      }
    }
  },
};

export default command;

const pinManga = async (interaction: ChatInputCommandInteraction) => {
  const value = interaction.options.getString('name', true);
  if (!value)
    return interaction.editReply(
      'Nội dung tìm kiếm không hợp lệ. Vui lòng thử lại sau'
    );

  try {
    await db.$transaction([
      db.manga.findUniqueOrThrow({
        where: {
          slug: value,
          canPin: false,
        },
      }),
      db.manga.update({
        where: {
          slug: value,
        },
        data: {
          canPin: true,
          creator: {
            update: {
              notifications: {
                create: {
                  type: 'SYSTEM',
                  content: 'Bạn đã được cấp ghim',
                  endPoint: `${process.env.MAIN_URL}/manga/${value}`,
                },
              },
            },
          },
        },
      }),
    ]);

    return interaction.editReply('OK');
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025')
        return interaction.editReply(
          'Không có tìm thấy Manga. Hãy chắc chắn Manga nhập đúng slug Manga và Manga chưa được cấp ghim'
        );
    }

    return interaction.editReply('Something went wrong');
  }
};
