exports.up = function onUp(knex) {
  return knex('oauth_clients').insert({
    client_id: 'app-4c9bebd0-5bb0-446b-aade-14eb746c1b5c',
    client_secret: 'a73ae8df-ed78-4859-bc8d-ec1f9fdb11b0',
    redirect_uri: '/',
  });
};

exports.down = function onDown(knex) {
  return knex('oauth_clients').del();
};
