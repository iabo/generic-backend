const { Model } = require('objection');

class OAuthClient extends Model {
  static get tableName() {
    return 'oauth_clients';
  }

  static get idColumn() {
    return 'id';
  }
}

module.exports = OAuthClient;
