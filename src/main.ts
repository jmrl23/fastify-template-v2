async function main() {
  await (await import('./init.js')).init();

  const [{ app }, { bootstrap }, { detect }] = await Promise.all([
    import('./app.js'),
    import('./bootstrap.js'),
    import('detect-port'),
  ]);

  const host = '0.0.0.0';
  const port = await detect({
    hostname: host,
    port: process.env.PORT ? parseInt(process.env.PORT) : 3001,
  });

  await app.register(bootstrap);

  app.listen(
    {
      host,
      port,
      listenTextResolver(address) {
        return `Listening at ${address}`;
      },
    },
    (error) => {
      if (error) {
        console.error(error);
        process.exit(1);
      }
    },
  );
}

void main();
