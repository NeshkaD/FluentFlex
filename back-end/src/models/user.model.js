let db = require('./mysql_db.js');

// constructor
const User = function(user) {
    this.id = user.id;
    this.username = user.username;
    this.password = user.password;
    this.email_address = user.email_address;
};

// Find a user in the user table by username:
User.findUserByUsername = (username, callback, err_callback) => {
    // Select from database by username:
    db.query(
        'SELECT * FROM user WHERE username = ?',
        [username],
        (error, result) => {
            // Call the error callback method if DB lookup fails, or if number of results != 1:
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
            // Call success callback:
            else {
                callback(result[0]);
            }
        }
    );
}

// Find a user in the user table by id:
User.findUserById = (userId, callback, err_callback) => {
    // Select from database by user ID:
    db.query(
        'SELECT * FROM user WHERE id = ?',
        [userId],
        (error, result) => {
            // Call the error callback method if DB lookup fails, or if number of results != 1:
            let error_description = ''
            if (error) {
                error_description = `Error searching for user with userId ${userId}: ${error}`
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
            // Call success callback:
            else {
                callback(result[0]);
            }
        }
    );
}

// Create a user in the user table:
User.createUser = (username, email_address, password, callback) => {
    // Possible reasons to reject DB insertion:
    outcome = {
        success: true,
        usernameUnique: true,
        emailUnique: true
    }

    let error_description = ''

    // Select user by username to verify requested new username is unique:
    db.query('SELECT * FROM user WHERE username = ?', 
    [username],
    (error, result) => {
        if (result.length > 0) {
            outcome.usernameUnique = false;
        }

        // Select user by email to verify requested new user email is unique:
        db.query('SELECT * FROM user WHERE email = ?',
        [email_address],
        (error, result) => {
            if (result.length > 0) {
                outcome.emailUnique = false;
            }
            if (outcome.usernameUnique && outcome.emailUnique) {

                // Insert new row into the DB user table for new user:
                db.query(
                    'INSERT INTO user (username, email, password) VALUES (?, ?, ?)',
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

// Update user info for a given user id in the user table:
User.update = (userId, username, email, password, callback, error_callback) => {
    // Build query to update multipl columns in user table:
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

    // Update the user table with updated column values for this user:
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

// Add method to delete a user from the user table by id:
User.delete = (userId, callback, error_callback) => {
    // Delete from DB by id:
    db.query('DELETE FROM user WHERE id = ?',
            [userId],
            (error, result) => {
                // Call error callback if DB error occurs:
                if (error) {
                    error_callback(error);
                }
                // Call success callback:
                else {
                    callback(result);
                }
            });
}

module.exports = User;
