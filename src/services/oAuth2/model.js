const OAuthClient = require('#database/models/OAuthClient');
const OAuthToken = require('#database/models/OAuthToken');
const User = require('#database/models/User');
const logger = require('#services/logger');

module.exports = {
  async getUser(email, password) {
    const user = await User.query().where('email', email).first();
    if (!user) return false;
    const hasVerified = await user.verifyPassword(password);
    if (!hasVerified) {
      return false;
    }
    return {
      id: user.id,
      email: user.email,
      is_verified: user.is_verified,
      is_disabled: user.is_disabled,
      is_deleted: user.is_deleted,
    };
  },
  async getClient(clientId, clientSecret) {
    const client = await OAuthClient.query()
      .where({
        client_id: clientId,
        client_secret: clientSecret,
      })
      .first();
    if (!client) return false;
    return {
      id: client.id,
      clientId: client.client_id,
      clientSecret: client.client_secret,
      redirectUris: [client.redirect_uri],
      grants: ['password', 'refresh_token'],
    };
  },
  async getAccessToken(bearerToken) {
    logger.debug(
      {
        title: 'Get Access Token',
        parameters: [{ name: 'token', value: bearerToken }],
      },
      'getAccessToken',
    );
    if (!bearerToken || bearerToken === 'undefined') return false;
    // Check if is in caché
    const token = await OAuthToken.query()
      .where({
        type: 'oauth',
        access_token: bearerToken,
      })
      .first();
    if (!token) return false;
    const [client, user] = await Promise.all([
      OAuthClient.query().findById(token.id_oauth_client),
      User.query().findById(token.id_user),
    ]);
    const returnObj = {
      id_token: token.id,
      accessToken: token.access_token,
      accessTokenExpiresAt: token.access_token_expires_on,
      client: {
        id: client.id,
        clientId: client.client_id,
        clientSecret: client.client_secret,
        redirectUris: [client.redirect_uri],
        grants: ['password', 'refresh_token'],
      },
      user: {
        id: user.id,
        email: user.email,
        is_verified: user.is_verified,
        is_disabled: user.is_disabled,
        is_deleted: user.is_deleted,
      },
    };
    return returnObj;
  },
  async saveToken(token, client, user) {
    await OAuthToken.query().insert({
      id_user: user.id,
      id_oauth_client: client.id,
      type: 'oauth',
      access_token: token.accessToken,
      access_token_expires_on: token.accessTokenExpiresAt,
      refresh_token: token.refreshToken,
      refresh_token_expires_on: token.refreshTokenExpiresAt,
    });
    return {
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      refreshToken: token.refreshToken,
      refreshTokenExpiresAt: token.refreshTokenExpiresAt,
      client,
      user,
    };
  },
  async getRefreshToken(bearerToken) {
    if (!bearerToken || bearerToken === 'undefined') return false;
    const token = await OAuthToken.query()
      .where('refresh_token', bearerToken)
      .first();
    if (!token) return false;
    const [client, user] = await Promise.all([
      OAuthClient.query().findById(token.id_oauth_client),
      User.query().findById(token.id_user),
    ]);
    return {
      accessToken: token.access_token,
      accessTokenExpiresAt: token.access_token_expires_on,
      client: {
        id: client.id,
        clientId: client.client_id,
        clientSecret: client.client_secret,
        redirectUris: [client.redirect_uri],
        grants: ['password', 'refresh_token'],
      },
      user: {
        id: user.id,
        email: user.email,
        is_verified: user.is_verified,
        is_disabled: user.is_disabled,
        is_deleted: user.is_deleted,
      },
    };
  },
  async revokeToken(bearerToken) {
    if (!bearerToken || bearerToken === 'undefined') return false;
    const token = await OAuthToken.query()
      .where('access_token', bearerToken)
      .first();
    if (!token) return false;
    await token.$query().delete();
    return true;
  },
};
