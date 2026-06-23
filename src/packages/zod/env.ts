import z from 'zod';
import { variables } from '../../configs/env';

type Env = z.infer<typeof variables>;
export function env<K extends keyof Env>(key: K): Env[K] {
  const parsed = variables.safeParse(process.env);
  if (!parsed.success) throw new Error('Invalid env');
  return parsed.data[key];
}
