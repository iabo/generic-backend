// const Settings = require('#database/models/Settings');

async function getSettings(ctx) {
  return ctx.ok({ setting1: 'value' });
}

module.exports = {
  getSettings,
};
