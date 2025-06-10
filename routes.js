const fs = require('node:fs');
const path = require('node:path');

async function registerRoutes(app) {
  const routesDir = path.join(__dirname, 'routes');
  const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));

  await Promise.all(routeFiles.map(async (file) => {
    const route = require(path.join(routesDir, file));
    if (typeof route === 'function') {
        await route(app);
        app.log.info(`Registered ROUTES FROM ${file}`);
    }
  }));
}

module.exports = registerRoutes;
