var _data = require('./data');
var helpers = require('./helpers');

/*
 *  Request Handlers
 */
// Define the handlers
var handlers = {};

handlers.ping = function (data, callback) {
    callback(200);
};

// Not found handler
handlers.notFound = function (data, callback) {
    callback(404);
};

// Users
handlers.users = function (data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    }
    else {
        callback(405);
    }
};

// Container for the User submethods
handlers._users = {};

// Users - Post
// Required data: firstname, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function (data, callback) {
    // Check that all required fields are filled out
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        // Check whether User already exists
        _data.read('users', phone, function (err, data) {
            if (err) {
                // Hash the password
                var hashedPassword = helpers.hash(password);

                // Create the user Object
                if (hashedPassword) {
                    var userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    };

                    // Store User
                    _data.create('users', phone, userObject, function (err) {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, { 'Error': 'Could not create the new user' });
                        }
                    });
                } else {
                    callback(500, { 'Error': 'Could not hash the password' });
                }
            } else {
                // User already exists
                callback(400, { 'Error': 'A user with that phone number already exists' });
            }
        });
    }
    else {
        callback(400, { 'Error': 'Missing required fields' });
    }
};

// Users - Get
// Required Data: Phone
// Optional Data: none
// @TODO Only let an authenticated user to access only their object 
handlers._users.get = function (data, callback) {
    // Check the validity of phone number
    var phone = typeof (data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        // Lookup the User
        _data.read('users', phone, function (err, data) {
            if (!err && data) {
                // Remove the password from the object
                delete data.hashedPassword;
                callback(200, data);
            } else {
                callback(404, { 'Error': 'User does not exists' });
            }
        })
    } else {
        callback(400, { 'Error': 'Missing the required field' });
    }
};

// Users - Put
// Required data: phone
// Optional data: firstName, lastName, password (atleast one)
// @TODO: User should be able to update only his object
handlers._users.put = function (data, callback) {
    var phone = typeof (data.payload.phone) === 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

    // Check for the optional data
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone) {
        if (firstName || lastName || password) {
            _data.read('users', phone, function (err, userData) {
                if (!err && userData) {

                    if (firstName) {
                        userData.firstName = firstName;
                    }

                    if (lastName) {
                        userData.lastName = lastName;
                    }

                    if (password) {
                        userData.password = helpers.hash(password);
                    }

                    // Update the User
                    _data.update('users', phone, userData, function (err) {
                        if (!err && data) {
                            callback(200);
                        } else {
                            callback(500, { 'Error': 'Unable to update the User' });
                        }
                    });
                } else {
                    callback(404, { 'Error': 'User does not exists' });
                }
            })
        } else {
            callback(400, { 'Error': 'No data to update' });
        }
    } else {
        callback(400, { 'Error': 'Missing the required field1' });
    }
};

// Users - Delete
// Required data: phone
// optional data: none
// @TODO: Only let Authenticated User to delete
handlers._users.delete = function (data, callback) {

    // Check the validity of phone number
    var phone = typeof (data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        // Lookup the User
        _data.read('users', phone, function (err, data) {
            if (!err && data) {
                _data.delete('users', phone, function (err) {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, { 'Error': 'Could not delete the User' })
                    }
                });
            }
            else {
                callback(400, { 'Error': 'User does not exists' });
            }
        })
    } else {
        callback(400, { 'Error': 'Missing the required field' });
    }
};

module.exports = handlers