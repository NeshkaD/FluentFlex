let db = require('./mysql_db.js');

// constructor
const User = function(user) {
    this.id = user.id;
    this.username = user.username;
    this.password = user.password;
    this.email_address = user.email_address;
};

// This parameter order has been chosen to match the nodejs mysql API being used. 
User.findUserByUsername = (username, callback, err_callback) => {
    db.query(
        'SELECT * FROM user WHERE username = ?',
        [username],
        (error, result) => {
            let error_description = ''
            if (error) {
                error_description = `Failed to find user with username ${username}. Error: ${error}`
                console.log(error_description);
                err_callback(error_description);
            }
            else if (result.length < 1) {
                error_description = `User with username ${username} does not exist!`
                console.log(error_description);
                err_callback(error_description);
            }
            else if (result.length > 1) {
                error_description = `More than one user exists with username ${username}. This indicates a major DB problem.`
                console.log(error_description);
                err_callback(error_description);
            }
            else {
                callback(result[0]);
            }
        }
    );
}

// This parameter order has been chosen to match the nodejs mysql API being used. 
User.findUserById = (userId, callback, err_callback) => {
    db.query(
        'SELECT * FROM user WHERE id = ?',
        [userId],
        (error, result) => {
            let error_description = ''
            if (error) {
                error_description = `Error searchin for user with userId ${userId}: ${error}`
                console.log(error_description);
                err_callback(error_description);
            }
            else if (result.length < 1) {
                error_description = `No user with id ${userId}.`
                console.log(error_description);
                err_callback(error_description);
            }
            else if (result.length > 1) {
                error_description = `Multiple users exist with id ${userId}.`
                console.log(error_description);
                err_callback(error_description);
            }
            else {
                callback(result[0]);
            }
        }
    );
}