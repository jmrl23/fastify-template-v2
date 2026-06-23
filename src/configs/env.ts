import z from 'zod';

export const variables = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3001),
  TRUST_PROXY: z
    .string()
    .min(1)
    .optional()
    .transform((str) => str?.split(',')?.map((item) => item.trim()))
    .pipe(z.array(z.string()))
    .default(['loopback']),
  CORS_ORIGIN: z
    .string()
    .min(1)
    .optional()
    .transform((str) => str?.split(',')?.map((item) => item.trim()))
    .pipe(z.array(z.string()).optional()),
});
