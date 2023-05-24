const { Model } = require('objection');

class UserMetadata extends Model {
  static get tableName() {
    return 'user_metadata';
  }

  static get idColumn() {
    return 'id';
  }

  async $beforeUpdate(opt, queryContext) {
    super.$beforeUpdate(opt, queryContext);
    this.updated_at = new Date();
  }
}

module.exports = UserMetadata;
