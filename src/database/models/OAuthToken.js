const { Model } = require('objection');

class OAuthToken extends Model {
  static get tableName() {
    return 'oauth_tokens';
  }

  static get idColumn() {
    return 'id';
  }
}

module.exports = OAuthToken;
