function main() {
  var localizationJSON = exportSheetAsJSON()
  addFileToDrive(localizationJSON)
}

function exportSheetAsJSON() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var rows = sheet.getDataRange();
  var numRows = rows.getNumRows();
  var numCols = rows.getNumColumns();
  var values = rows.getValues();

  var output = {};

  for (var i = 1; i < values[0].length; i++) {
    var lang = values[0][i];
    var contents = {};
    for (var j = 1; j < values.length; j++) {
      var term = values[j][0];
      var def = values[j][i];
      contents[term] = def;
    }
    output[lang] = contents;
  }
  return output;
};

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
    localizationsFolder.createFile(name + ".json", JSON.stringify(file, null, 2), MimeType.JAVASCRIPT);
  } else {
    var localizationsFolder = DriveApp.createFolder('Localization')
    localizationsFolder.createFile(name + ".json", JSON.stringify(file, null, 2), MimeType.JAVASCRIPT);
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