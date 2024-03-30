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

// TODO: Reduce nesting in the following method with promises.
// This parameter order has been chosen to match the nodejs mysql API being used. 
User.createUser = (username, email_address, password, callback) => {
    outcome = {
        success: true,
        usernameUnique: true,
        emailUnique: true
    }
    let error_description = ''
    db.query('SELECT * FROM user WHERE username = ?', 
    [username],
    (error, result) => {
        if (result.length > 0) {
            outcome.usernameUnique = false;
        }
        db.query('SELECT * FROM user WHERE email = ?',
        [email_address],
        (error, result) => {
            if (result.length > 0) {
                outcome.emailUnique = false;
            }
            if (outcome.usernameUnique && outcome.emailUnique) {
                db.query(
                    'INSERT INTO user (username, email, password) VALUES (?, ?, ?)', // Question mark notation explained here: https://github.com/mysqljs/mysql#escaping-query-values
                    [username, email_address, password],
                    (error, result) => {
                        if (error) {
                            console.log(`Failed to insert new user ${username}, ${email_address}. Error: ${error}`);
                            outcome.success = false;
                            callback(outcome);
                        }
                        else {
                            console.log(`Adding new user with username ${username} and email address ${email_address}`);
                            callback(outcome);
                        }
                    }
                );
            } 
            else {
                outcome.success = false;
                callback(outcome);
            }
        });
    });  
}

User.update = (userId, username, email, password, callback, error_callback) => {
    let query =  'UPDATE user SET';
    let queryArgs = [];
    if (username) {
        query += ' username = ? ,';
        queryArgs.push(username);
    }
    if (email) {
        query += ' email = ? ,';
        queryArgs.push(email);
    }
    if (password) {
        query += ' password = ? ,';
        queryArgs.push(password);
    }
    if (query.endsWith(',') ) {
        query = query.substring(0, query.length - 1);
    }
    queryArgs.push(userId);
    query += 'WHERE id = ?';
    db.query(
        query,
        queryArgs,
        (error, result) => {
            if (error) {
                console.log(`Error while updating user with ID ${userId}: ${error}`);
                error_callback(error);
            }
            else{
                callback(result);
            }
        }
    );
}

User.delete = (userId, callback, error_callback) => {
    db.query('DELETE FROM user WHERE id = ?',
            [userId],
            (error, result) => {
                if (error) {
                    error_callback(error); // error_callback should be a function that takes the error as an argument and handles it
                }
                else {
                    callback(result);
                }
            });
}

module.exports = User;
