import { Prisma, type Team, type User } from '@prisma/client';
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
import { SearchUserAutoComplete } from '../../../lib/query';
import { ObjectValues, nFormatter } from '../../../lib/utils';
import { TCommand } from '../../../types/globals';
import { discord_client } from '../../bot_client';

const CommandTypeEnum = {
  INFO: 'info',
  ME: 'me',
} as const;

const command: TCommand = {
  data: new SlashCommandBuilder()
    .setName('user')
    .setDescription('User command')
    .addSubcommand((cmd) =>
      cmd
        .setName('info')
        .setDescription('Thông tin người dùng')
        .addStringOption((opt) =>
          opt
            .setName('name')
            .setDescription('Tên người dùng')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((cmd) =>
      cmd.setName('me').setDescription('Thông tin bản thân')
    ),
  autocomplete: async (interaction) => {
    const focusedValue = interaction.options.getFocused(true).value;
    if (!focusedValue) return;

    const result = await SearchUserAutoComplete({
      searchPhrase: focusedValue,
    });

    await interaction.respond(
      result.map((user) => ({ name: user.name, value: user.id }))
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
        await getUser(interaction);
        break;
      }
      case CommandTypeEnum.ME: {
        await getMe(interaction);
        break;
      }
    }
  },
};

export default command;

const generateEmbed = (
  user: Pick<User, 'name' | 'banner' | 'image' | 'createdAt'> & {
    team: Pick<Team, 'name'> | null;
    _count: {
      manga: number;
      followedBy: number;
    };
  }
): InteractionEditReplyOptions => {
  const embed = new EmbedBuilder();
  embed.setURL(
    process.env.NODE_ENV === 'development'
      ? 'https://moetruyen.net'
      : `${process.env.MAIN_URL}/user/${user.name?.split(' ').join('-')}`
  );
  embed.setAuthor({
    name: discord_client.user?.username ?? 'Moetruyen',
    iconURL: discord_client.user?.displayAvatarURL(),
  });
  embed.setTitle(user.name);
  embed.addFields([
    {
      name: 'Theo dõi',
      value: `${nFormatter(user._count.followedBy, 1)}`,
    },
    {
      name: 'Truyện tranh',
      value: `${nFormatter(user._count.manga, 1)}`,
    },
    {
      name: 'Gia nhập',
      value: format(user.createdAt, 'd/M/y'),
    },
  ]);

  if (!!user.team) {
    embed.addFields({
      name: 'Team',
      value: user.team.name,
    });
  }

  embed.setThumbnail(user.image);
  embed.setImage(user.banner);
  embed.setFooter({
    text: 'Thông tin người dùng',
  });

  const link_button = new ButtonBuilder();
  link_button.setStyle(ButtonStyle.Link);
  link_button.setLabel('LINK');
  link_button.setURL(
    process.env.NODE_ENV === 'development'
      ? 'https://moetruyen.net'
      : `${process.env.MAIN_URL}/user/${user.name?.split(' ').join('-')}`
  );
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(link_button);

  return {
    embeds: [embed],
    components: [row],
  };
};

const getUser = async (interaction: ChatInputCommandInteraction) => {
  const value = interaction.options.getString('name', true);
  if (!value)
    return interaction.editReply(
      'Nội dung tìm kiếm không hợp lệ. Vui lòng thử lại sau'
    );

  try {
    const user = await db.user.findUniqueOrThrow({
      where: {
        id: value,
      },
      select: {
        banner: true,
        image: true,
        name: true,
        createdAt: true,
        team: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            manga: true,
            followedBy: true,
          },
        },
      },
    });

    const payload = generateEmbed(user);
    return interaction.editReply(payload);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025')
        return interaction.editReply(
          'Không thể tìm thấy người dùng. Vui lòng thử lại sau'
        );
    }

    return interaction.editReply('Có lỗi xảy ra. Vui lòng thử lại sau');
  }
};

const getMe = async (interaction: ChatInputCommandInteraction) => {
  const interactionUser = interaction.user;

  try {
    const user = await db.account
      .findUniqueOrThrow({
        where: {
          provider_providerAccountId: {
            provider: 'discord',
            providerAccountId: interactionUser.id,
          },
        },
      })
      .user({
        select: {
          banner: true,
          image: true,
          name: true,
          createdAt: true,
          team: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              manga: true,
              followedBy: true,
            },
          },
        },
      });

    const payload = generateEmbed(user);
    return interaction.editReply(payload);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025')
        return interaction.editReply(
          'Không có kết quả. Hãy chắc chắn bạn đã liên kết tài khoản Discord của bạn với Moetruyen'
        );
    }

    return interaction.editReply('Có lỗi xảy ra. Vui lòng thử lại sau');
  }
};
