export async function init() {
  await env();
}

async function env() {
  const [dotenvx, fs, { glob }, path] = await Promise.all([
    import('@dotenvx/dotenvx'),
    import('node:fs'),
    import('glob'),
    import('node:path'),
  ]);

  if (process.env.NODE_ENV === undefined) {
    process.env.NODE_ENV = 'development';
  }

  const NODE_ENV = process.env.NODE_ENV;

  const entries = await glob(
    [`.env.${NODE_ENV}.local`, `.env.${NODE_ENV}`, '.env.local', '.env'].map(
      (file) => path.resolve(__dirname, '../', file),
    ),
    { absolute: true },
  ).then((entries) => entries.filter((entry) => fs.existsSync(entry)));

  if (entries.length > 0) {
    dotenvx.config({
      path: entries,
      encoding: 'utf8',
      quiet: NODE_ENV !== 'development',
    });
  }
}
