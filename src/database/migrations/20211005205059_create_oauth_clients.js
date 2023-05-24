exports.up = async function onUp(knex) {
  await knex.schema.createTable('oauth_clients', table => {
    table.bigIncrements();
    table.string('client_id').notNull();
    table.string('client_secret').notNull();
    table.text('redirect_uri').notNull();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['client_id', 'client_secret']);
  });
};

exports.down = function onDown(knex) {
  return knex.schema.dropTable('oauth_clients');
};
