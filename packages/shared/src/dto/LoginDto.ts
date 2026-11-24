import { z } from 'zod'

export const phoneSchema = z.object({
    phone: z.string().min(7),
});

export const emailSchema = z.object({
    email: z.email(),
});