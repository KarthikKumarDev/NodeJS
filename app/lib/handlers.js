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
handlers._users.get = function (data, callback) {
    // Check the validity of phone number
    var phone = typeof (data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        // Get the token from the headers
        var token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
        // Verify the validity of the token
        handlers._tokens.verifyToken(token, phone, function (isTokenValid) {
            if (isTokenValid) {
                // Lookup the User
                _data.read('users', phone, function (err, data) {
                    if (!err && data) {
                        // Remove the password from the object
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(404, { 'Error': 'User does not exists' });
                    }
                });
            } else {
                callback(403, { 'Error': 'Unauthorized' });
            }
        });
    };
};

// Users - Put
// Required data: phone
// Optional data: firstName, lastName, password (atleast one)
handlers._users.put = function (data, callback) {
    var phone = typeof (data.payload.phone) === 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

    // Check for the optional data
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone) {
        // Get the token from the headers
        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        // Verify the validity of the token
        handlers._tokens.verifyToken(token, phone, function (isTokenValid) {
            if (isTokenValid) {
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
                callback(403, { 'Error': 'Unauthorized' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing the required field!' });
    }
};

// Users - Delete
// Required data: phone
// optional data: none
handlers._users.delete = function (data, callback) {

    // Check the validity of phone number
    var phone = typeof (data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        // Get the token from the headers
        var tokenId = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        // Verify the validity of the token
        handlers._tokens.verifyToken(tokenId, phone, function (isTokenValid) {
            if (isTokenValid) {
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
                });
            } else {
                callback(403, { 'Error': 'Unauthorized' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing the required field' });
    }
};

// Tokens
handlers.tokens = function (data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    }
    else {
        callback(405);
    }
};

// Container for all the tokens methods
handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function (data, callback) {
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if (phone && password) {
        // Lookup the User matching the phone number
        _data.read('users', phone, function (err, userData) {
            if (!err && userData) {
                // Hash the sent password and compare it to the password stored in the user object
                var hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.hashedPassword) {
                    // If valid create a new token with a random name and set expiration time of 1 hour
                    var tokenId = helpers.createRandomString(20);

                    var expires = Date.now() + 1000 * 60 * 60;
                    var tokenObject = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    };

                    // Store the token 
                    _data.create('tokens', tokenId, tokenObject, function (err) {
                        if (!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, { 'Error': 'Could not create tokem' });
                        }
                    });
                } else {
                    callback(400, { 'Error': 'Password did not match the specified User\'s password' });
                }

            } else {
                callback(400, { 'Error': 'Could not find the specified user' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required field(s)' });
    }
};

// Tokens - get
// Required Data: Id
// Optional Data: none
handlers._tokens.get = function (data, callback) {
    // Check the validity of id
    var id = typeof (data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        // Lookup the token
        _data.read('tokens', id, function (err, data) {
            if (!err && data) {
                callback(200, data);
            } else {
                callback(404, { 'Error': 'Token does not exists' });
            }
        })
    } else {
        callback(400, { 'Error': 'Missing the required field' });
    }
};


// Tokens - put
// Required Data: id, extend
// Optional Data: none
handlers._tokens.put = function (data, callback) {
    var id = typeof (data.payload.id) === 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    var extend = typeof (data.payload.extend) === 'boolean' && data.payload.extend == true ? data.payload.id : false;

    if (id && extend) {
        _data.read('tokens', id, function (err, tokenData) {
            if (!err && tokenData) {
                // Check the validity of the token
                if (tokenData.expires > Date.now()) {
                    // Update the Token
                    tokenData.expires = Date.now() + 1000 * 60 * 60;
                    _data.update('tokens', id, tokenData, function (err) {
                        if (!err && data) {
                            callback(200);
                        } else {
                            callback(500, { 'Error': 'Unable to update the Token' });
                        }
                    });
                } else {
                    callback(400, { 'Error': 'Token already expired' });
                }
            } else {
                callback(404, { 'Error': 'User does not exists' });
            }
        })
    } else {
        callback(400, { 'Error': 'Missing the required field1' });
    }
};

// Token - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function (data, callback) {
    // Check the validity of id
    var id = typeof (data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
    if (id) {
        // Lookup the User
        _data.read('tokens', id, function (err, tokenData) {
            if (!err && tokenData) {
                _data.delete('tokens', id, function (err) {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, { 'Error': 'Could not delete the Token' })
                    }
                });
            }
            else {
                callback(400, { 'Error': 'Token does not exists' });
            }
        })
    } else {
        callback(400, { 'Error': 'Missing the required field' });
    }
}

// Verify token id validity for the User
handlers._tokens.verifyToken = function (id, phone, callback) {
    // Look up the token
    _data.read('tokens', id, function (err, tokenData) {
        if (!err && tokenData) {
            // Check that the token is for the given User and has not expired
            if (tokenData.phone == phone) {
                if (tokenData.expires > Date.now()){
                callback(true);
                } else {
                    _data.delete('tokens', id, callback);
                }
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
}
module.exports = handlers