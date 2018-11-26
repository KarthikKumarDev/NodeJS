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

// Export the module 
module.exports = helpers;