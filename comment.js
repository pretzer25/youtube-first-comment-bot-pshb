const fs = require('fs');
require('dotenv').config();
const { google, google: { auth: { OAuth2 } } } = require('googleapis');
const express = require('express');
const cookieParser = require('cookie-parser');
const open = require('open');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-first-comment-bot-pshb.json
const SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl'];
const TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
  process.env.USERPROFILE) + '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'youtube-first-comment-bot-pshb.json';
const authPort = process.env.AUTH_PORT || 3000;

module.exports = (async () => {
  // Load client secrets from a local file.
  var auth = await authorize(JSON.parse("" + await fs.promises.readFile('client_secret.json')
    .catch(err => console.log('Error loading client secret file: ' + err))));

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   *
   * @param {Object} credentials The authorization client credentials.
   * @return {Promise} A promise that resolves to the OAuth2 client to
   *    get token for client.
   */
  function authorize(credentials) {
    const clientSecret = credentials.installed.client_secret;
    const clientId = credentials.installed.client_id;
    const redirectUrl = `http://localhost:${authPort}/auth`;
    const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    return new Promise((resolve, reject) =>
      fs.promises.readFile(TOKEN_PATH).then(token => {
        oauth2Client.setCredentials(JSON.parse("" + token).tokens);
        resolve(oauth2Client);
      }, () => {
        getNewToken(oauth2Client).then(r => resolve(r), r => reject(r));
      })
    );
  }

  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   *
   * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for
   *     client.
   * @return {Promise} A promise that resolves to oauth2Client
   */
  function getNewToken(oauth2Client) {
    open(oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES
    }));

    return new Promise((resolve, reject) => {
      const app = express();
      app.use(cookieParser());
      app.get('/auth', (req, res) => {
        // Create an OAuth2 client object from the credentials in our config file
        if (req.query.error) {
          // The user did not give us permission.
          reject(req.query.error);
          return res.status(500).end(req.query.error);
          // return res.redirect('/');
        } else {
          oauth2Client.getToken(req.query.code).then(async token => {
            oauth2Client.credentials = token;
            oauth2Client.setCredentials(token.tokens);
            await storeToken(token);
            resolve(oauth2Client);
            return res.status(200).end("success");
          }, err => {
            console.log('Error while trying to retrieve access token', err);
            reject(err);
            return res.status(500).end(err);
          });
        }
        console.log("closing");

        server.close();
      });
      let server = app.listen(authPort, () => console.log(`Listening on port ${authPort}`));
    });
  }

  /**
   * Store token to disk be used in later program executions.
   *
   * @param {Object} token The token to store to disk.
   */
  async function storeToken(token) {
    try {
      fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }
    let err = await fs.promises.writeFile(TOKEN_PATH, JSON.stringify(token));
    if (err) throw err;
    console.log('Token stored to ' + TOKEN_PATH);
  }

  const comments = JSON.parse("" + await fs.promises.readFile("comments.json"));

  const service = google.youtube({ version: 'v3' });

  return (videoId, channelId) => {
    service.commentThreads.insert({
      auth,
      "part": [
        "snippet"
      ],
      "resource": {
        "snippet": {
          "videoId": videoId,
          "topLevelComment": {
            "snippet": {
              "textOriginal": comments[channelId].comment
            }
          }
        }
      }
    }).then(response => {
      console.log("Response", response);
      console.log(`Comment "${comments[channelId].comment}" is left on ${comments[channelId].name}'s video ${videoId}`);
    }, err => console.error("Execute error", err));
  };
})();