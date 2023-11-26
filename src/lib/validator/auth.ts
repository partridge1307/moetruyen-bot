import { z } from 'zod';

export const AuthValidator = z.object({
  iss: z.string(),
  iat: z.number(),
  exp: z.number(),
  data: z.record(
    z.string().min(1),
    z.record(z.string().min(1), z.string()).or(z.string()).or(z.number())
  ),
});
export type TAuthValidator = z.infer<typeof AuthValidator>;

export const SetUpValidator = z.object({
  userId: z.string(),
  server: z.object({
    id: z.string(),
    name: z.string(),
  }),
  channel: z.object({
    id: z.string(),
    name: z.string(),
  }),
  role: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
});

export const NotifyValidator = z.object({
  chapterId: z.number(),
  channelId: z.string(),
  roleId: z.string().nullable(),
});
