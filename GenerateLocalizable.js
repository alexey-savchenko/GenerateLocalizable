const exec = require('child_process').exec;
const fs = require('fs');
const auth = require('./GoogleAuth')
const {
	google
} = require('googleapis');
const SCOPE = ['https://www.googleapis.com/auth/spreadsheets'];

const TOKEN_PATH = 'token.json';
const EXPORT_PATH_TOKEN = '-e';
const TARGET_SHEET_ID_TOKEN = '-i';
const TARGET_MODE_TOKEN = '-m';

// Launch modes
const LOCALIZABLE_STINGS_MODE = "strings";
const LOCALIZABLE_PLIST_MODE = "plist";
const LOCALIZABLE_STINGS_PLIST_MODE = "strings+plist";

// Check scopes stored in token
fs.readFile(TOKEN_PATH, (err, content) => {
	if (!err) {
		let _content = JSON.parse(content);
		let scope = _content.scope;
		if (scope != SCOPE) {
			fs.unlinkSync(TOKEN_PATH)
		}
	}
})

let targetSheetID = "";
let targetSheetTokenIndex = process.argv.indexOf(TARGET_SHEET_ID_TOKEN);
if ((targetSheetTokenIndex + 1) > 0) {
	targetSheetID = process.argv[targetSheetTokenIndex + 1];
} else {
	return console.log("🚨 Please pass target sheet ID");
}

let exportDirPath = require("os").homedir() + "/Documents";
let exportPathTokenIndex = process.argv.indexOf(EXPORT_PATH_TOKEN);
if ((exportPathTokenIndex + 1) > 0) {
	exportDirPath = process.argv[exportPathTokenIndex + 1];
}

let launchMode = LOCALIZABLE_STINGS_MODE
let launchModeTokenIndex = process.argv.indexOf(TARGET_MODE_TOKEN);
if ((launchModeTokenIndex + 1) > 0) {
	launchMode = process.argv[launchModeTokenIndex + 1];
}

console.log("Requesting " + launchMode);

auth
	.getGoogleAuth()
	.then(
		(fulfilledAuthClient) => {
			let jobs = [];

			switch (launchMode) {
				case LOCALIZABLE_STINGS_MODE:
					jobs.push(getLocalizableStrings(fulfilledAuthClient, targetSheetID))
					break
				case LOCALIZABLE_PLIST_MODE:
					jobs.push(getLocalizablePlistStrings(fulfilledAuthClient, targetSheetID))
					break
				case LOCALIZABLE_STINGS_PLIST_MODE:
					jobs.push(getLocalizableStrings(fulfilledAuthClient, targetSheetID))
					jobs.push(getLocalizablePlistStrings(fulfilledAuthClient, targetSheetID))
					break
			}

			processLocalizationJobs(jobs, exportDirPath);
		})
	.catch((rejectedAuthClient) => {
		console.log("Cannot authenticate");
		console.log(rejectedAuthClient);
	})

function processLocalizationJobs(jobs, exportDirPath) {
	Promise
		.all(jobs)
		.then((rawSheetDataArray) => {
			return rawSheetDataArray
				.map((value) => {
					return [value[0], parseToJSON(value[1])];
				})
				.map((value) => {
					return saveToDisk(value[0], value[1])
				});
		})
		.then((promises) => {
			return Promise.all(promises)
		})
		.then((value) => {
			return value.map(val => {
				return makeLocalizableFiles(val[1], exportDirPath, val[0]);
			});
		})
		.then((promises) => {
			return Promise.all(promises)
		})
		.then((value) => {
			console.log(value);
		})
		.catch((error) => {
			console.trace();
			console.log("🚨 Error occured: " + error);
		});
}

function getLocalizableStrings(auth, targetSheetID) {
	return new Promise((resolve, reject) => {
		const sheets = google.sheets({
			version: 'v4',
			auth
		});
		sheets.spreadsheets.values.get({
			spreadsheetId: targetSheetID,
			range: 'LocalizableStrings!A1:ZZ',
		}, (err, res) => {
			if (err) {
				console.trace();
				reject(err);
			}
			const rows = res.data.values;
			console.log("Got plist strings data");
			resolve(["strings", rows]);
		});
	});
}

function getLocalizablePlistStrings(auth, targetSheetID) {
	return new Promise((resolve, reject) => {
		const sheets = google.sheets({
			version: 'v4',
			auth
		});
		sheets.spreadsheets.values.get({
			spreadsheetId: targetSheetID,
			range: 'LocalizablePlist!A1:ZZ',
		}, (err, res) => {
			if (err) {
				console.trace();
				reject(err);
			}
			const rows = res.data.values;
			console.log("Got plist data");
			resolve(["plist", rows]);
		});
	});
}

function parseToJSON(rowsArray) {
	let output = {};
	let translations = [];

	for (let i = 1; i < rowsArray[0].length; i++) {
		let langObj = {};
		let lang = rowsArray[0][i];
		langObj["language"] = lang;
		let contents = [];
		for (let j = 1; j < rowsArray.length; j++) {
			let term = rowsArray[j][0];
			let def = rowsArray[j][i];
			let termTemp = {};
			termTemp["key"] = term;
			termTemp["value"] = def;
			contents.push(termTemp);
		}
		langObj["terms"] = contents;
		translations.push(langObj);
	}
	output["translations"] = translations;
	return output;
}

function saveToDisk(objectType, translationsJSONObject) {
	return new Promise((resolve, reject) => {
		const rand = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		const tempDirPath = './temp';
		const tempFilePath = tempDirPath + "/temp-" + rand + ".json";

		if (!fs.existsSync(tempDirPath)) {
			fs.mkdirSync(tempDirPath);
		}

		console.log(tempFilePath);
		fs.writeFile(tempFilePath, JSON.stringify(translationsJSONObject, null, 2), (error) => {
			if (error) {
				console.trace();
				reject(error);
			} else {
				resolve([objectType, tempFilePath]);
			}
		});
	});
}

function makeLocalizableFiles(sourceJSONFilePath, exportDirPath, launchMode) {
	return compileSwift().then(() => {
		return new Promise((resolve, reject) => {
			exec("./WriteLocalizable" + " -i " + sourceJSONFilePath + " -o " + exportDirPath + " -m " + launchMode, (err, stdout, stderr) => {
				if (err) {
					console.trace();
					reject(err)
				} else {
					resolve("Export of " + launchMode + " succeeded! 🤩")
				}
			});
		});
	});

	function compileSwift() {
		return new Promise((resolve, reject) => {
			exec("swiftc WriteLocalizable.swift");
			setTimeout(resolve, 2000);
		});
	}
}