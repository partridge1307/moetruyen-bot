import { Prisma, type Manga, type User } from '@prisma/client';
import { format } from 'date-fns';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  InteractionEditReplyOptions,
  SlashCommandBuilder,
} from 'discord.js';
import { db } from '../../../lib/db';
import { SearchMangaAutoComplete } from '../../../lib/query';
import { ObjectValues, nFormatter } from '../../../lib/utils';
import { TCommand } from '../../../types/globals';
import { discord_client } from '../../bot_client';

const CommandTypeEnum = {
  INFO: 'info',
} as const;

const command: TCommand = {
  data: new SlashCommandBuilder()
    .setName('manga')
    .setDescription('Manga command')
    .addSubcommand((cmd) =>
      cmd
        .setName('info')
        .setDescription('Thông tin truyện tranh')
        .addStringOption((opt) =>
          opt
            .setName('name')
            .setDescription('Tên truyện')
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

    await interaction.deferReply();

    if (interaction.user.bot) {
      await interaction.editReply('You can not use this command');
      return;
    }

    switch (command) {
      case CommandTypeEnum.INFO: {
        await getManga(interaction);
        break;
      }
    }
  },
};

export default command;

const generateEmbed = (
  manga: Pick<
    Manga,
    'slug' | 'image' | 'cover' | 'name' | 'review' | 'createdAt'
  > & {
    creator: Pick<User, 'name'>;
    _count: {
      followedBy: number;
      chapter: number;
    };
  }
): InteractionEditReplyOptions => {
  const embed = new EmbedBuilder();
  embed.setAuthor({
    name: discord_client.user?.username ?? 'Moetruyen',
    iconURL: discord_client.user?.displayAvatarURL(),
  });
  embed.setURL(
    process.env.NODE_ENV === 'development'
      ? 'https://moetruyen.net'
      : `${process.env.MAIN_URL}/manga/${manga.slug}`
  );
  embed.setTitle(manga.name);
  embed.setDescription(manga.review);
  embed.addFields([
    {
      name: 'Theo dõi',
      value: `${nFormatter(manga._count.followedBy, 1)}`,
    },
    {
      name: 'Chapter',
      value: `${nFormatter(manga._count.chapter, 1)}`,
    },
    {
      name: 'Người đăng',
      value: `${manga.creator.name}`,
    },
    {
      name: 'Tạo từ',
      value: format(manga.createdAt, 'd/M/y'),
    },
  ]);
  embed.setThumbnail(manga.image);
  embed.setImage(manga.cover);
  embed.setFooter({
    text: 'Thông tin truyện tranh',
  });

  const link_button = new ButtonBuilder();
  link_button.setStyle(ButtonStyle.Link);
  link_button.setLabel('LINK');
  link_button.setURL(
    process.env.NODE_ENV === 'development'
      ? 'https://moetruyen.net'
      : `${process.env.MAIN_URL}/manga/${manga.slug}`
  );
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(link_button);

  return {
    embeds: [embed],
    components: [row],
  };
};

const getManga = async (interaction: ChatInputCommandInteraction) => {
  const value = interaction.options.getString('name', true);
  if (!value)
    return interaction.editReply(
      'Nội dung tìm kiếm không hợp lệ. Vui lòng thử lại sau'
    );

  try {
    const manga = await db.manga.findUniqueOrThrow({
      where: {
        slug: value,
      },
      select: {
        slug: true,
        image: true,
        cover: true,
        name: true,
        review: true,
        createdAt: true,
        creator: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            followedBy: true,
            chapter: true,
          },
        },
      },
    });

    const payload = generateEmbed(manga);
    return interaction.editReply(payload);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025')
        return interaction.editReply(
          'Không thể tìm thấy truyện tranh. Vui lòng thử lại sau'
        );
    }

    return interaction.editReply('Có lỗi xảy ra. Vui lòng thử lại sau');
  }
};
