const auth = require('./GoogleAuth')
const fs = require('fs');
const {
  google
} = require('googleapis');

const INPUT_FILE_TOKEN = "-i";
const TARGET_SHEET_ID_TOKEN = "-s";

main(process.argv);

function main(args) {
  let inputFileTokenIndex = args.indexOf(INPUT_FILE_TOKEN);
  let targetSheetTokenIndex = args.indexOf(TARGET_SHEET_ID_TOKEN);

  if (inputFileTokenIndex != -1 && targetSheetTokenIndex != -1) {
    const targetSheetID = args[targetSheetTokenIndex + 1];
    const inputFilePath = args[inputFileTokenIndex + 1];
    readLocalizableStringsFile(inputFilePath)
      .then((stringData) => {
        return mapStringsDataToJSON(stringData);
      })
      .then((stringsJSON) => {
        return auth.getGoogleAuth()
          .then((auth) => {
            return updateGoogleSheet(stringsJSON, targetSheetID, auth)
          });
      })
      .then((complete) => {
        console.log(complete);
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    console.log("Insufficient input");
  }
}

function readLocalizableStringsFile(inputFilePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(inputFilePath, (err, buffer) => {
      if (err) {
        reject(err);
        return
      }
      const stringData = buffer.toString();
      resolve(stringData);
    });
  });
}

function mapStringsDataToJSON(stringsData) {
  const stringsArray = stringsData.split("\n").filter((str) => !str.includes('//') && str.length > 0);
  const regexp = /(?<=((?<=[\s,.:;"']|^)["']))(?:(?=(\\?))\2.)*?(?=\1)/gmu;
  const stringsDict = stringsArray.reduce((acc, element) => {
    const matches = element.match(regexp);
    if (matches[0] != null && matches[1] != null) {
      const key = matches[0];
      const value = matches[1];
      acc[key] = value;
      return acc
    } else {
      return acc
    }
  }, {});

  return stringsDict;
}

function updateGoogleSheet(stringsJSON, spreadsheetId, auth) {

  const api = google.sheets({
    version: 'v4',
    auth
  });

  const valueInputOption = 'RAW';
  const keys = Object
    .keys(stringsJSON)
    .reduce((acc, value) => {
      let c = acc;
      c.push([value]);
      return c
    }, []);
  const values = Object
    .values(stringsJSON)
    .reduce((acc, value) => {
      let c = acc;
      c.push([value]);
      return c
    }, []);

  const keysRange = "LocalizableStrings!A2:A" + (keys.length + 1);
  const valuesRange = "LocalizableStrings!B2:B" + (values.length + 1);

  const updateKeys = updateSheet(api, spreadsheetId, valueInputOption, keysRange, {
    'values': keys
  });
  const updateValues = updateSheet(api, spreadsheetId, valueInputOption, valuesRange, {
    'values': values
  });

  return Promise.all([updateKeys, updateValues]);
}

function updateSheet(api, spreadsheetId, valueInputOption, range, resource) {
  return new Promise((resolve, reject) => {
    api.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption,
      resource,
    }, (err, _result) => {
      if (err) {
        reject(err);
        return;
      } else {
        resolve("Range updated " + range);
      }
    });
  });
}

module.exports = {
  main
};