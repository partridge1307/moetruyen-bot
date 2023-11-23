import { ChatInputCommandInteraction } from 'discord.js';
import { db } from './db';
import type { Permission } from '@prisma/client';

export type ObjectValues<T> = T[keyof T];

export const nonVieRegex =
  /[^a-z0-9A-Z_ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễếệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ]/g;

const tsquerySpecialChars = /[()|&:*!]/g;
export const generateSearchPhrase = (searchPhrase: string) =>
  searchPhrase
    .replace(tsquerySpecialChars, ' ')
    .trim()
    .split(/\s+/)
    .map((phrase) => `${phrase}:*`)
    .join(' | ');

export const nFormatter = (num: number, digits: number) => {
  const lookup = [
    { value: 1e9, symbol: 'T' },
    { value: 1e6, symbol: 'tr' },
    { value: 1e3, symbol: 'k' },
    { value: 1, symbol: '' },
  ];
  const regex = /\.0+$|(\.[0-9]*[1-9])0+$/;

  const item = lookup.find((item) => num >= item.value);

  return item ? (num / item.value).toFixed(digits).replace(regex, '$1') : '0';
};

const getUserPermission = async (interaction: ChatInputCommandInteraction) => {
  return await db.account
    .findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'discord',
          providerAccountId: interaction.user.id,
        },
      },
    })
    .user({
      select: {
        permissions: true,
      },
    });
};

export const checkUserPermission = async ({
  permission,
  interaction,
}: {
  permission: Permission[];
  interaction: ChatInputCommandInteraction;
}) => {
  try {
    const user = await getUserPermission(interaction);

    return user?.permissions.some((perm) => permission.includes(perm));
  } catch (error) {
    return;
  }
};
