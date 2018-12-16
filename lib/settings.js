var fs = require("fs");
var jsonminify = require("jsonminify");

exports.title = "MAGNET POS/MN EXPLORER";
exports.port = process.env.PORT || 8080;
exports.jwt_pkey = "a_unique_key";

exports.dbsettings = {
    "user": "mongouser",
    "password": "mongopass",
    "database": "magExplorer",
    "address": "localhost",
    "port": 27017
};

exports.magwallet = {
    "cli": "mag-cli",
    "path": "/usr/local/bin/",
    "host": "localhost",
    "port": 17103,
    "user": "rpcmaguser",
    "pass": "rpcpass"
};


exports.reloadSettings = function reloadSettings() {
    // Discover where the settings file lives
    var settingsFilename = "settings.json";
    settingsFilename = "./" + settingsFilename;

    var settingsStr;
    try {
        //read the settings sync
        settingsStr = fs.readFileSync(settingsFilename).toString();
    } catch (e) {
        console.warn('No settings file found. Continuing using defaults!');
    }

    // try to parse the settings
    var settings;
    try {
        if (settingsStr) {
            settingsStr = jsonminify(settingsStr).replace(",]", "]").replace(",}", "}");
            settings = JSON.parse(settingsStr);
        }
    } catch (e) {
        console.error('There was an error processing your settings.json file: ' + e.message);
        process.exit(1);
    }

    //loop trough the settings
    for (var i in settings) {
        //test if the setting start with a low character
        if (i.charAt(0).search("[a-z]") !== 0) {
            console.warn("Settings should start with a low character: '" + i + "'");
        }

        //we know this setting, so we overwrite it
        if (exports[i] !== undefined) {
            exports[i] = settings[i];
        }
        //this setting is unkown, output a warning and throw it away
        else {
            console.warn("Unknown Setting: '" + i + "'. This setting doesn't exist or it was removed");
        }
    }

};

// initially load settings
exports.reloadSettings();