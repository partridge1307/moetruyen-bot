import { Prisma, type User } from '@prisma/client';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  InteractionEditReplyOptions,
  SlashCommandBuilder,
} from 'discord.js';
import { db } from '../../../lib/db';
import { SearchUserAutoComplete } from '../../../lib/query';
import { ObjectValues, checkUserPermission } from '../../../lib/utils';
import { TCommand } from '../../../types/globals';

const CommandTypeEnum = {
  VERIFY: 'verify',
  LIST: 'verify-list',
} as const;

const ButtonTypeEnum = {
  PREV: 'prev',
  NEXT: 'next',
} as const;

const command: TCommand = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin command')
    .addSubcommand((cmd) =>
      cmd
        .setName('verify')
        .setDescription('Verify user')
        .addStringOption((opt) =>
          opt
            .setName('name')
            .setDescription('Username')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((cmd) =>
      cmd.setName('verify-list').setDescription('Verify list users')
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

    await interaction.deferReply({ ephemeral: true });

    if (interaction.user.bot) {
      interaction.editReply('You can not use this command');
      return;
    }

    const isModerator = await checkUserPermission({
      permission: ['ADMINISTRATOR', 'MANAGE_USER'],
      interaction,
    });

    if (!isModerator) {
      interaction.editReply('You do not have permission to use this command');
      return;
    }

    switch (command) {
      case CommandTypeEnum.LIST: {
        await getVerifyList(interaction);

        break;
      }

      case CommandTypeEnum.VERIFY: {
        await verifyUser(interaction);

        break;
      }
    }
  },
};

export default command;

const generateEmbed = (
  list: { user: Pick<User, 'id' | 'name'> }[],
  page: number
): InteractionEditReplyOptions => {
  const embed = new EmbedBuilder();
  embed.setTitle(`Verify list. Page - ${++page}`);
  embed.addFields(
    list.length
      ? list.map(({ user }) => ({
          name: `ID: ${user.id}`,
          value: `Name: ${user.name}`,
        }))
      : [{ name: 'No users', value: '\u200b' }]
  );
  embed.setFooter({
    text: `Page - ${page}`,
  });

  const prevButton = new ButtonBuilder();
  prevButton.setCustomId('prev');
  prevButton.setStyle(ButtonStyle.Primary);
  prevButton.setEmoji('⏮');

  const nextButton = new ButtonBuilder();
  nextButton.setCustomId('next');
  nextButton.setStyle(ButtonStyle.Primary);
  nextButton.setEmoji('⏭');

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    prevButton,
    nextButton
  );

  return {
    embeds: [embed],
    components: [row],
  };
};

const getList = (page: number) => {
  return db.verifyList.findMany({
    take: 10,
    skip: page * 10,
    select: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

const getVerifyList = async (interaction: ChatInputCommandInteraction) => {
  let page = 0;

  try {
    const list = await getList(page);
    const payload = generateEmbed(list, page);

    await interaction.editReply(payload);

    const collector = interaction.channel?.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === interaction.user.id,
      time: 1000 * 60 * 1,
    });

    collector?.on('collect', async (buttonInteraction) => {
      const buttonId = buttonInteraction.customId;
      if (!buttonId) return;

      await buttonInteraction.deferUpdate();

      if (buttonId === ButtonTypeEnum.PREV) {
        if (page === 0) return;

        const list = await getList(--page);
        const payload = generateEmbed(list, page);

        interaction.editReply(payload);
        return;
      }

      if (buttonId === ButtonTypeEnum.NEXT) {
        const list = await getList(++page);
        const payload = generateEmbed(list, page);

        interaction.editReply(payload);
      }
    });
  } catch (error) {
    return interaction.editReply('Something went wrong');
  }
};

const verifyUser = async (interaction: ChatInputCommandInteraction) => {
  const value = interaction.options.getString('name', true);
  if (!value) return;

  try {
    await db.$transaction([
      db.verifyList.findUniqueOrThrow({
        where: {
          userId: value,
        },
      }),
      db.user.update({
        where: {
          id: value,
        },
        data: {
          verified: true,
          isWaitVeify: {
            delete: {
              userId: value,
            },
          },
          notifications: {
            create: {
              type: 'SYSTEM',
              content: 'Bạn đã được xác thực thành công',
              endPoint: process.env.MAIN_URL,
            },
          },
        },
      }),
    ]);

    return interaction.editReply('OK');
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') return interaction.editReply('Not found');
    }

    return interaction.editReply('Something went wrong');
  }
};
