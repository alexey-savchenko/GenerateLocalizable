const auth = require('./GoogleAuth')

const fs = require('fs');

const INPUT_FILE_TOKEN = "-i";

let inputToken = process.argv.indexOf(INPUT_FILE_TOKEN);
if (inputToken != -1) {
  let inputFilePath = process.argv[inputToken + 1];
  readLocalizableStringsFile(inputFilePath)
    .then((stringData) => {
      return mapStringsDataToJSON(stringData);
    })
    .then((stringsJSON) => {
      console.log(stringsJSON);
    });
} else {
  console.log("no input token");
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
    const key = matches[0];
    const value = matches[1];
    acc[key] = value;
    return acc
  }, {});

  return stringsDict;
}

function updateGoogleSheet(stringsJSON, sheetID) {
  return new Promise((resolve, reject) => {

  });
}