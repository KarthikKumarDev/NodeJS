/*
 * Helpers for various tasks 
 */

var crypto = require('crypto');
var config = require('./config');

// Container for all the helpers
var helpers = {};

// Create a SHA256 hash
helpers.hash = function (str) {
    if (typeof (str) == 'string' && str.length > 0) {
        return crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    } else {
        return false;
    }
};

// Parse a JSON string to an Object in all cases without throwing errors
helpers.parseJsonToObject = function (str) {
    try {
        var object = JSON.parse(str);
        return object;
    } catch (e) {
        return {};
    }
}

helpers.createRandomString = function (strLength) {
    strLength = typeof (strLength) == 'number' && strLength > 0 ? strLength : false;
    if (strLength) {
        // Define all the possible characters
        var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz123456789';

        // Start the final string
        var str = '';
        for (i = 1; i <= strLength; i++) {
            // Get a random character from the possibleCharacter string 
            var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            // Append this character to the final string 
            str += randomCharacter;
        }
        return str;
    } else {
        return false;
    }
}

// Export the module 
module.exports = helpers;