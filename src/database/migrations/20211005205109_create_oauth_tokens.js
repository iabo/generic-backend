exports.up = async function onUp(knex) {
  await knex.schema.createTable('oauth_tokens', table => {
    table.bigIncrements();
    table.integer('id_user').unsigned().notNull();
    table.bigInteger('id_oauth_client').unsigned();
    table.string('type').notNull();
    table.string('access_token').notNull();
    table
      .timestamp('access_token_expires_on')
      .notNull()
      .defaultTo(knex.fn.now());
    table.string('refresh_token').notNull();
    table
      .timestamp('refresh_token_expires_on')
      .notNull()
      .defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.foreign('id_user').references('users.id');
    table
      .foreign('id_oauth_client')
      .references('oauth_clients.id')
      .onDelete('CASCADE');
    table.index(['type', 'access_token']);
    table.index(['type', 'refresh_token']);
  });
};

exports.down = function onDown(knex) {
  return knex.schema.dropTable('oauth_tokens');
};
