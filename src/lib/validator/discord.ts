import { z } from 'zod';

export const DiscordValidator = z.object({
  userId: z.string(),
  serverId: z.string().optional(),
});
export type TDiscordValidator = z.infer<typeof DiscordValidator>;
