# GenerateLocalizable
Easily integrate localization to your iOS apps using Google Sheets, Node.js and Swift!

### Prequisites: 
* Node.js installed
* A Google account

### Preparation

To start localizing you projects there are several steps to be undertaken.

1) Clone this repo or download zip archive.
2) Go to https://developers.google.com/sheets/api/quickstart/nodejs to download required `credentials.json` file.
![Google Sheets APIs site](https://i.imgur.com/8scpWFN.png)
Click `ENABLE THE GOOGLE SHEETS API`

Once process completes download your `credentials.json` file:
![Google Sheets APIs site](https://i.imgur.com/9UKsypz.png)

3) Install googleapis node module by typing to terminal - `npm install googleapis`
4) **Make sure you have initilized localization of your app in Xcode** by adding necessary languages in corresponding dialog window. This step creates `lproj` folders with and integrates them to your `xcodeproj`.

![Google Sheets APIs site](https://i.imgur.com/epIpGXW.png)

### Usage

Your sheet in Google Sheets should have format like this

KEY | Language 1 | Language 2 | Other languages
--- | ---------- | ---------- | ---------------
term_key_0 | Language 1 translation of term | Language 2 translation of term | Language 3 translation of term
term_key_1 | Language 1 translation of term | Language 2 translation of term | Language 3 translation of term
term_key_2 | Language 1 translation of term | Language 2 translation of term | Language 3 translation of term

Language 1, Language 2 etc. are language codes relative to ISO 639-1 (en for English, fr for French etc.).

**Important!** Make sure the sheet that contains localizations has name `LocalizableStrings`.

You will need an `ID` of your Google spreadsheet. You can obtain it from url while spreadsheet is open:

![Google Sheets key](https://i.imgur.com/9i3mRZQ.png)

There are 3 available modes of execution:

* `strings`
* `plist`
* `strings+plist`

To localize `Info.plist` in your app you should add a page to your Google Sheet with name `LocalizablePlist`.

To specify mode you should pass one after `-m` token.
Default is `strings`.

To execute script, locate directory containing contents of this repo in Terminal. 

Type `node GenerateLocalizable.js -m SELECTED_MODE -i YOUR_GOOGLE_SHEET_ID -e EXPORT_PATH`

Where `EXPORT_PATH` can be any path, but most likely you would like to export localization straight to your project.
In this case, specify path to directory where your `*.lproj` folders are stored in your project. For example `/Users/YOUR_USER_NAME/Documents/YOUR_PROJECT_NAME/Resources`.

During first run you will be prompted to authorize, follow the instructions in Terminal.
After authorization, process continues and if everything is OK, message will appear: Success! 🤩
