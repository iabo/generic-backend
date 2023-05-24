exports.up = function onUp(knex) {
  return knex('users').insert({
    email: 'yabdala@indevs.site',
    password:
      '$argon2i$v=19$m=16,t=2,p=1$S29ubmljaGl3YSE4UGVybGl0YQ$18S6OgZ3WrlE/CyZ7MH6Uw',
    username: 'yabdala',
    first_name: 'Yabdul',
    last_name: 'Abdala',
    Full_name: 'Yabdul Abdala',
    phone_number: '1234567890',
    is_admin: true,
    is_verified: true,
    is_disabled: false,
    is_deleted: false,
  });
};

exports.down = function onDown(knex) {
  return knex('users').del();
};
