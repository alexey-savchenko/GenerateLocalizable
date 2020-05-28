const exec = require('child_process').exec;
const fs = require('fs');
const readline = require('readline');
const {
  google
} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPE = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
const CREDENTIALS = 'credentials.json';

function getGoogleAuth() {
  return getCredentials()
    .then(authorize)
    .catch(getNewToken)
}

function getCredentials() {
  return new Promise((resolve, reject) => {
    fs.readFile(CREDENTIALS, (err, buffer) => {
      if (err) {
        reject(err);
        return
      }
      resolve(JSON.parse(buffer));
    });
  });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 */
function authorize(credentials) {
  const {
    client_secret,
    client_id,
    redirect_uris
  } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  return new Promise((resolve, reject) => {
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) {
        reject(oAuth2Client);
      } else {
        oAuth2Client.setCredentials(JSON.parse(token));
        resolve(oAuth2Client);
      }
    });
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 */
function getNewToken(oAuth2Client) {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPE,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) reject(err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) reject(err);
          console.log('Token stored to', TOKEN_PATH);
        });
        resolve(oAuth2Client);
      });
    });
  });
}

module.exports = { getGoogleAuth };