import { z } from 'zod';

export const messageCreateSchema = z.object({
  subject: z.string().min(3, 'subject must be at least 3 chars').max(120),
  body: z.string().min(1, 'body is required').max(2000),
});

export const messageReplySchema = z.object({
  reply: z.string().min(1, 'reply is required').max(2000),
});
