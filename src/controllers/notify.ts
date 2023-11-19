import { Prisma } from '@prisma/client';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  TextChannel,
} from 'discord.js';
import { ZodError } from 'zod';
import { discord_client } from '../discord/bot_client';
import { db } from '../lib/db';
import { NotifyValidator, SetUpValidator } from '../lib/validator/auth';
import { fetchServer } from './discord';
import { format } from 'date-fns';

enum EmbedErrorEnum {
  VALIDATOR_ERR = 'VALIDATOR_ERR',
  APPLICATION_ERR = 'APPLICATION_ERR',
  DATABASE_ERR = 'DATABASE_ERR',
  INVALID_USER = 'INVALID_USER',
  INVALID_GUILD = 'INVALID_GUILD',
  INVALID_CHANNEL = 'INVALID_CHANNEL',
}

class EmbedError extends Error {
  type: keyof typeof EmbedErrorEnum;

  constructor(type: keyof typeof EmbedErrorEnum) {
    super();
    this.type = type;
  }
}

const sendSetUpEmbed = async (data: any) => {
  try {
    const { userId, server, channel, role } = SetUpValidator.parse(data);

    const sendChannel = await discord_client.channels
      .fetch(channel.id)
      .catch(() => null);
    if (!sendChannel || !(sendChannel instanceof TextChannel))
      throw new EmbedError('INVALID_CHANNEL');

    const account = await db.account.findFirstOrThrow({
      where: {
        providerAccountId: userId,
      },
      select: {
        providerAccountId: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    const [user, guild] = await Promise.all([
      discord_client.users.fetch(account.providerAccountId).catch(() => null),
      fetchServer(server.id),
    ]);
    if (!user) throw new EmbedError('INVALID_USER');
    if (!guild) throw new EmbedError('INVALID_GUILD');

    let mentionRole;
    if (!!role) {
      mentionRole = await guild.roles.fetch(role.id).catch(() => null);
    }

    const embed = new EmbedBuilder();
    embed.setAuthor({
      name: discord_client.user?.username ?? 'Moetruyen',
      iconURL: discord_client.user?.displayAvatarURL(),
    });
    embed.setTitle('Thiết lập thông báo đăng truyện');
    embed.setDescription(
      `<@${user.id}> đã thiết lập <#${sendChannel.id}> làm kênh thông báo truyện`
    );
    embed.addFields([
      {
        name: 'Server',
        value: guild.name,
      },
      {
        name: 'Channel',
        value: `<#${sendChannel.id}>`,
      },
    ]);

    if (!!mentionRole) {
      embed.addFields({
        name: 'Role',
        value: `<@${mentionRole.id}>`,
      });
    }

    const linkButton = new ButtonBuilder();
    linkButton.setStyle(ButtonStyle.Link);
    linkButton.setLabel('LINK');
    linkButton.setURL(
      process.env.NODE_ENV === 'development'
        ? 'https://moetruyen.net'
        : `${process.env.MAIN_URL}/user/${account.user.name
            ?.split(' ')
            .join('-')}`
    );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(linkButton);

    sendChannel.send({ embeds: [embed], components: [row] });

    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError)
      throw new EmbedError('DATABASE_ERR');
    if (error instanceof ZodError) throw new EmbedError('VALIDATOR_ERR');

    throw new EmbedError('APPLICATION_ERR');
  }
};

const sendNotifyEmbed = async (data: any) => {
  try {
    const { chapterId, channelId, roleId } = NotifyValidator.parse(data);

    const chapter = await db.chapter.findUniqueOrThrow({
      where: {
        id: chapterId,
        isPublished: true,
      },
      select: {
        id: true,
        volume: true,
        chapterIndex: true,
        name: true,
        createdAt: true,
        manga: {
          select: {
            slug: true,
            name: true,
            image: true,
            review: true,
          },
        },
      },
    });

    const sendChannel = await discord_client.channels
      .fetch(channelId)
      .catch(() => null);
    if (!sendChannel || !(sendChannel instanceof TextChannel))
      throw new EmbedError('INVALID_CHANNEL');

    const embed = new EmbedBuilder();
    embed.setAuthor({
      name: discord_client.user?.username ?? 'Moetruyen',
      iconURL: discord_client.user?.displayAvatarURL(),
    });
    embed.setTitle(`${chapter.manga.name} - Chapter ${chapter.chapterIndex}`);
    embed.setDescription(chapter.manga.review);
    embed.setImage(chapter.manga.image);
    embed.addFields([
      {
        name: 'Volume',
        value: `${chapter.volume}`,
        inline: true,
      },
      {
        name: 'STT',
        value: `${chapter.chapterIndex}`,
        inline: true,
      },
    ]);
    embed.setFooter({
      text: `Tạo từ: ${format(chapter.createdAt, 'd/M/y')}`,
    });

    const chapterButton = new ButtonBuilder();
    chapterButton.setStyle(ButtonStyle.Link);
    chapterButton.setLabel('Xem Chapter');
    chapterButton.setURL(
      process.env.NODE_ENV === 'development'
        ? 'https://moetruyen.net'
        : `${process.env.MAIN_URL}/chapter/${chapter.id}}`
    );

    const mangaButton = new ButtonBuilder();
    mangaButton.setStyle(ButtonStyle.Link);
    mangaButton.setLabel('Xem Manga');
    mangaButton.setURL(
      process.env.NODE_ENV === 'development'
        ? 'https://moetruyen.net'
        : `${process.env.MAIN_URL}/manga/${chapter.manga.slug}}`
    );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      chapterButton,
      mangaButton
    );

    sendChannel.send({
      ...(roleId && { content: `<@${roleId}>` }),
      embeds: [embed],
      components: [row],
    });

    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError)
      throw new EmbedError('DATABASE_ERR');
    if (error instanceof ZodError) throw new EmbedError('VALIDATOR_ERR');
    throw new EmbedError('APPLICATION_ERR');
  }
};

export { sendSetUpEmbed, sendNotifyEmbed };
