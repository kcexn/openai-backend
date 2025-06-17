const fs = require('node:fs');
const path = require('node:path');

function isObject(obj) {
    return typeof obj === 'object' && obj !== null;
}
async function registerRoutes(app) {
  const routesDir = __dirname; 
  const routeFiles = fs.readdirSync(routesDir)
    .filter(file => file !== 'index.js');

  await Promise.all(routeFiles.map(async (file) => {
    const routePath = path.join(routesDir, file);
    const route = require(routePath);
    if(typeof route === 'function') {
        await route(app);
        app.log.info(`Registered ROUTES FROM ${path.relative(path.join(__dirname, '..'), routePath)}`);
    }
  }));
}

module.exports = registerRoutes;
