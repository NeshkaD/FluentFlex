const User = require("../models/user.model.js");
const Content = require("../models/content.model.js");

// Create user and reply to client with success or error information.
exports.createUser = (req, res) => {
    console.log('user.controller::register called');

    // Validate required fields:
    if (!req.body.username) {
        let returnObj = {
            "success": false,
            "error": "Username cannot be empty"
        };
        res.send(returnObj);
        return;
    }

    if (!req.body.email) {
        let returnObj = {
            "success": false,
            "error": "Email cannot be empty"
        };
        res.send(returnObj);
        return;
    }

    if (!req.body.password) {
        let returnObj = {
            "success": false,
            "error": "Password cannot be empty"
        };
        res.send(returnObj);
        return;
    }

    // Call model method to create User in DB:
    User.createUser(
        req.body.username,
        req.body.email,
        req.body.password,
        (outcomeObj) => {
            let returnObj = {
                "success": true,
                "error": ""
            };

            if (!outcomeObj.usernameUnique) {
                returnObj.success = false;
                returnObj.error += `Username ${req.body.username} is already taken - Please try a different username. `;
            }
            if (!outcomeObj.emailUnique) {
                returnObj.success = false;
                returnObj.error += `Email address ${req.body.email} is already connected to an account. Please use a different email address. `;
            }

            if (outcomeObj.usernameUnique && outcomeObj.emailUnique && !outcomeObj.success) {
                returnObj.success = false;
                returnObj.error = 'Sorry, something went wrong! Please try again.';
            }

            res.send(returnObj); // Send outcome info to client.
        }
    );
};

// Given a userId, reply to client with all info about the user
exports.getUserById = (req, res) => {
    console.log('user.controller::getUserById called');

    // Call model method to obtain user info from the DB:
    User.findUserById(
        req.params.userId,
        (user, err) => {
            if (err) {
                res.sendStatus(500);
            }
            userResponseObj = {
                username: user.username,
                email: user.email
            }
            res.send(userResponseObj); // Send user info to client.
        }
    );
}

// Given the ID for an existing user, update info about that user in the DB
exports.update = (req, res) => {
    console.log('user.controller::update called');
    let userId = req.body.userId;
    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password

    // Call model method to update user info in the DB:
    User.update(userId, username, email, password,
        // Send outcome info to client:
        (db_result) => res.send(
            {
                success: true,
                error: null
            }
        ),
        (db_error) => res.send(
            {
                success: false,
                error: db_error
            }
        )
    );
};

// Given the ID for an existing user, delete that user from the DB
exports.delete = (req, res) => {
    console.log('user.controller::delete called');
    let userId = req.params.userId;

    // Call model method to delete user from the DB:
    User.delete(userId,
        // Send outcome info to client:
        (result) => res.send(
            {
                success: true
            }
        ),
        (db_error) => res.send(
            {
                success: false,
                error: db_error
            }
        )
    );
};

// Handle request to get list of content item info based on a given user ID
exports.getContentInfoListByUserId = (req, res) => {
    console.log('user.controller::getContentInfoListByUserId called');
    let userId = req.params.userId;

    // Call model method to find list of content item info for this user:
    Content.findContentInfosByUserId(
        userId,
        (db_result) => {
            let listReturnObjs = [];
            for (let row of db_result) {
                let returnObj = {
                    "id": row.id,
                    "userId": row.user_id,
                    "type": row.type,
                    "language": row.language,
                    "mediaTitle": row.media_title,
                    "mediaAuthor": row.media_author
                }
                listReturnObjs.push(returnObj); // Add info to the response object
            }
            res.send(listReturnObjs); // Send response to client
        },
        (db_error) => res.send(
            {
                success: false,
                error: db_error
            }
        )
    );
}

// Handle request to authenticate a user
exports.authenticateUser = (req, res) => {
    console.log('user.controller::authenticateUser called');

    // Call model method to find user from the DB by username:
    User.findUserByUsername(
        req.body.username,
        (user) => {
            // Validate user info:
            let isAuthenticated = user.password === req.body.password;
            let userId = null;
            if (isAuthenticated) {
                userId = user.id;
            }
            let return_obj = {
                "isAuthenticated": isAuthenticated,
                "userId": userId
              };
            res.send(return_obj); // Send response with outcome.
        },
        (error_description) => res.send({ // Send error response with outcome.
          "isAuthenticated": false,
          "userId": null
        })
      );
  }