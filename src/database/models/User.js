const { Model } = require('objection');
const Argon2 = require('argon2');

class User extends Model {
  static get tableName() {
    return 'users';
  }

  static get modelPaths() {
    return [__dirname];
  }

  static get idColumn() {
    return 'id';
  }

  async $beforeUpdate(opt, queryContext) {
    super.$beforeUpdate(opt, queryContext);
    this.updated_at = new Date();
  }

  verifyPassword(password) {
    return Argon2.verify(this.password, password, {
      type: Argon2.argon2id,
    });
  }

  static verifyPassword(hashPassword, password) {
    return Argon2.verify(hashPassword, password, {
      type: Argon2.argon2id,
    });
  }

  static get relationMappings() {
    return {};
  }
}

module.exports = User;
