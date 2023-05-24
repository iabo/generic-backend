const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const Keys = require('#keys');
const OAuthToken = require('#database/models/OAuthToken');

async function setToken(user) {
  const accessToken = uuidv4();
  const newRefreshToken = uuidv4();
  const token = jwt.sign(
    {
      id: user.id,
      is_admin: user.is_admin,
      id_role: user.id_role,
      refreshToken: newRefreshToken,
      type: 'normal',
    },
    Keys.private,
    {
      expiresIn: '1day',
      algorithm: 'RS256',
    },
  );
  await OAuthToken.query().insert({
    id_user: user.id,
    type: 'jwt',
    access_token: accessToken,
    access_token_expires_on: new Date(),
    refresh_token: newRefreshToken,
    refresh_token_expires_on: new Date(),
  });

  return token;
}

module.exports = {
  setToken,
};
