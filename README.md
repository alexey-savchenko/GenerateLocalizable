# LocGen
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
