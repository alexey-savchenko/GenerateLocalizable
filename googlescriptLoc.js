function onOpen() {
  var menuEntries = [{name: "Export JSON", functionName: "main"}];
  SpreadsheetApp.getActiveSpreadsheet().addMenu("Export JSON", menuEntries);
}
function main() {
  var _rowData = rowData();
  var localizationJSON = exportAsJSON(_rowData);
  addFileToDrive(localizationJSON);
}

function rowData() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var rows = sheet.getDataRange();
  return rows.getValues();
}

function exportAsJSON(rowData) {
  var output = {};
  var translations = [];

  for (var i = 1; i < rowData[0].length; i++) {
    var langObj = {};
    var lang = rowData[0][i];
    langObj["language"] = lang;
    var contents = [];
    for (var j = 1; j < rowData.length; j++) {
      var term = rowData[j][0];
      var def = rowData[j][i];
      var termTemp = {};
      termTemp["key"] = term;
      termTemp["value"] = def;
      contents.push(termTemp);
    }
    langObj["terms"] = contents;
    translations.push(langObj);
  }
  output["translations"] = translations;

  return output;
};

function testExport() {
  var testValue = [
    ["KEY", "EN"],
    ["key0", "val0"],
    ["key1", "val1"]
  ];

  Logger.log(exportAsJSON(testValue));
}

function addFileToDrive(file) {
  var name = SpreadsheetApp.getActiveSpreadsheet().getName();
  var foldersIterator = DriveApp.getFoldersByName('Localization')
  if (foldersIterator.hasNext()) {
    var localizationsFolder = foldersIterator.next()
    //clean previous files
    var previousFiles = localizationsFolder.getFilesByName(name)
    while (previousFiles.hasNext()) {
      var file = previousFiles.next()
      file.setTrashed(true)
    }
    localizationsFolder.createFile(name + ".json", JSON.stringify(file, null, 2), MimeType.PLAIN_TEXT);
  } else {
    var localizationsFolder = DriveApp.createFolder('Localization')
    localizationsFolder.createFile(name + ".json", JSON.stringify(file, null, 2), MimeType.PLAIN_TEXT);
  }
}

function transpose(a) {

  // Calculate the width and height of the Array
  var w = a.length || 0;
  var h = a[0] instanceof Array ? a[0].length : 0;

  // In case it is a zero matrix, no transpose routine needed.
  if (h === 0 || w === 0) {
    return [];
  }

  /**
   * @var {Number} i Counter
   * @var {Number} j Counter
   * @var {Array} t Transposed data is stored in this array.
   */
  var i, j, t = [];

  // Loop through every item in the outer array (height)
  for (i = 0; i < h; i++) {

    // Insert a new row (array)
    t[i] = [];

    // Loop through every item per item in outer array (width)
    for (j = 0; j < w; j++) {

      // Save transposed data.
      t[i][j] = a[j][i];
    }
  }

  return t;
};

// testExport();