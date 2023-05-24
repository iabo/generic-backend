exports.up = function onUp(knex) {
  return knex.schema.createTable('users', table => {
    table.increments();
    table.string('email').notNull();
    table.string('password');
    table.string('username');
    table.string('first_name');
    table.string('last_name');
    table.string('full_name');
    table.string('phone_number');
    table.boolean('is_admin').notNull().defaultTo(false);
    table.boolean('is_verified').notNull().defaultTo(false);
    table.boolean('is_disabled').notNull().defaultTo(false);
    table.boolean('is_deleted').notNull().defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index('email');
  });
};

exports.down = function onDown(knex) {
  return knex.schema.dropTable('users');
};
