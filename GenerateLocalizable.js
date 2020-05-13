const exec = require('child_process').exec;
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
const EXPORT_PATH_TOKEN = '-e';
const TARGET_SHEET_ID_TOKEN = '-i';
const TARGET_MODE_TOKEN = '-m';

// Launch modes
const LOCALIZABLE_STINGS_MODE = "strings";
const LOCALIZABLE_PLIST_MODE = "plist";
const LOCALIZABLE_STINGS_PLIST_MODE = "strings+plist";

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
	if (err) return console.log('Error loading client secret file:', err);

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

	authorize(JSON.parse(content))
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

			},
			(rejectedAuthClient) => {
				getNewToken(rejectedAuthClient)
					.then((fulfilledAuthClient) => {
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
			}
		)
});

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
		.then((promises) => { return Promise.all(promises) })
		.then((value) => {
			console.log(value);
		})
		.catch((error) => {
			console.trace();
			console.log("🚨 Error occured: " + error);
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
	return new Promise((resolve, reject) => {
		console.log("Exporting to " + exportDirPath);
		exec("chmod +x WriteLocalizable.swift")
		exec("./WriteLocalizable.swift" + " -i " + sourceJSONFilePath + " -o " + exportDirPath + " -m " + launchMode, (err, stdout, stderr) => {
			if (err) {
				console.trace();
				reject(err)
			} else {
				// console.log("Export of " + launchMode + " succeeded! 🤩");
				resolve("Export of " + launchMode + " succeeded! 🤩")
			}
		});
	});
}