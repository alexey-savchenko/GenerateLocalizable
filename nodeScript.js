const exec = require('child_process').exec;
const fs = require('fs');
const readline = require('readline');
const {
  google
} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
const EXPORT_PATH_TOKEN = '-e';
const TARGET_SHEET_ID_TOKEN = '-i';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);

  var targetSheetID = "";
  var targetSheetTokenIndex = process.argv.indexOf(TARGET_SHEET_ID_TOKEN);
  if ((targetSheetTokenIndex + 1) > 0) {
    targetSheetID = process.argv[targetSheetTokenIndex + 1];
  } else {
    return console.log("🚨 Please pass target sheet ID");
  }

  var exportDirPath = require("os").homedir() + "/Documents";
  var exportPathTokenIndex = process.argv.indexOf(EXPORT_PATH_TOKEN);
  if ((exportPathTokenIndex + 1) > 0) {
    exportDirPath = process.argv[exportPathTokenIndex + 1];
  }

  authorize(JSON.parse(content))
    .then(
      fulfilledAuthClient => {
        getTranslations(fulfilledAuthClient, targetSheetID)
          .then(parseToJSON)
          .then(saveToDisk)
          .then(
            (jsonPath) => {
              return makeLocalizableFiles(jsonPath, exportDirPath);
            }
          )
          .catch(error => {
            console.log("🚨 Error occured: " + error);
          });
      },
      rejectedAuthClient => {
        getNewToken(rejectedAuthClient)
          .then(
            (authenticatedClient) => {
              return getTranslations(authenticatedClient, targetSheetID);
            }
          )
          .then(parseToJSON)
          .then(saveToDisk)
          .then(
            (jsonPath) => {
              return makeLocalizableFiles(jsonPath, exportDirPath);
            }
          )
          .catch(error => {
            console.log("🚨 Error occured: " + error);
          });
      }
    )
});

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
      scope: SCOPES,
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

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function getTranslations(auth, targetSheetID) {
  return new Promise((resolve, reject) => {
    const sheets = google.sheets({
      version: 'v4',
      auth
    });
    sheets.spreadsheets.values.get({
      spreadsheetId: targetSheetID,
      range: 'Sheet1!A1:ZZ',
    }, (err, res) => {
      if (err) {
        reject(err);
      }
      const rows = res.data.values;
      resolve(rows);
    });
  });
}

function parseToJSON(rowsArray) {
  return new Promise((resolve) => {
    var output = {};
    var translations = [];

    for (var i = 1; i < rowsArray[0].length; i++) {
      var langObj = {};
      var lang = rowsArray[0][i];
      langObj["language"] = lang;
      var contents = [];
      for (var j = 1; j < rowsArray.length; j++) {
        var term = rowsArray[j][0];
        var def = rowsArray[j][i];
        var termTemp = {};
        termTemp["key"] = term;
        termTemp["value"] = def;
        contents.push(termTemp);
      }
      langObj["terms"] = contents;
      translations.push(langObj);
    }
    output["translations"] = translations;
    resolve(output);
  });
}

function saveToDisk(translationsJSONObject) {
  const tempFilePath = "./temp.json";
  return new Promise((resolve, reject) => {
    fs.writeFile(tempFilePath, JSON.stringify(translationsJSONObject, null, 2), (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(tempFilePath);
      }
    });
  });
}

function makeLocalizableFiles(sourceJSONFilePath, exportDirPath) {
  return new Promise((resolve, reject) => {
    console.log("Exporting to " + exportDirPath);
    exec("./LocGen.swift -i " + sourceJSONFilePath + " -o " + exportDirPath, (err, stdout, stderr) => {
      if (err) {
        reject(err)
      }
      console.log("Success! 🤩");
    });
  });
}