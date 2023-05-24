const Router = require('@koa/router');
const controller = require('./oAuth2.controller');
const passport = require('koa-passport');
const OAuth2Strategy = require('passport-oauth2');
const logger = require('#services/logger');
const axios = require('axios');

// async function getUserInfo(accessToken) {
//   const response = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//     },
//   });
//   return response.data;
// }

// const router = new Router();

// // Set up OAuth2 strategy
// passport.use(
//   new OAuth2Strategy(
//     {
//       clientID: process.env.OAUTH_CLIENT_ID || '',
//       clientSecret: process.env.OAUTH_CLIENT_SECRET || '',
//       callbackURL: process.env.OAUTH_REDIRECT_URI || '',
//       authorizationURL: process.env.OAUTH_AUTH_URI || '',
//       tokenURL: process.env.OAUTH_TOKEN_URI || '',
//       scope: ['email', 'profile'], // specify the scopes here
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       const userData = await getUserInfo(accessToken);
//       passport.serializeUser((userData, done) => {
//         done(null, userData.id);
//       });
//       logger.debug(`userData: ${JSON.stringify(userData)}`); //yabo :: delete this
//       logger.debug(`accessToken: ${accessToken}`);
//       logger.debug(`refreshToken: ${refreshToken}`);
//       logger.debug(`profile: ${JSON.stringify(profile)}`);
//       return done(null, userData);
//     },
//   ),
// );

// passport.deserializeUser((user, done) => {
//   done(null, user);
// });

// // Authenticate user via OAuth2
// router.get('/google', passport.authenticate('oauth2'));

// // Handle OAuth2 callback
// router.get(
//   '/google/callback',
//   passport.authenticate('oauth2', {
//     successRedirect: '/google/success',
//     failureRedirect: '/google/error',
//   }),
// );

// router.get(
//   '/google/success',
//   passport.authenticate('oauth2'),
//   controller.googleOauth2Success,
// );
// router.get('/google/error', controller.googleOauth2Error);

// module.exports = router;
