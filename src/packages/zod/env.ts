import z from 'zod';
import { variables } from '../../configs/env';

type Env = z.infer<typeof variables>;
export function env<K extends keyof Env>(key: K): Env[K] | never {
  const parsedEnv = variables.safeParse(process.env).data;
  if (!parsedEnv) throw new Error('Invalid env');
  if (!parsedEnv[key]) throw new Error(`Missing env ${key}`);
  return parsedEnv[key];
}
