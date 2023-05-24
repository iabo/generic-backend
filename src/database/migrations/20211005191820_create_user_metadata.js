exports.up = async function onUp(knex) {
  await knex.schema.createTable('user_metadata', table => {
    table.bigIncrements();
    table.integer('id_user').notNull().unsigned();
    table.string('property');
    table.string('value');
    table.boolean('unique').notNull().defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('update_at').defaultTo(knex.fn.now());
    table.index(['id_user', 'property', 'unique']);
    table.foreign('id_user').references('users.id');
  });
};

exports.down = function onDown(knex) {
  return knex.schema.dropTable('user_metadata');
};
