const User = require("../models/user.model.js");
const Content = require("../models/content.model.js");

exports.createUser = (req, res) => {
    console.log('auth.controller::register called');

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

    // TODO: improve auth with tokens
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

            res.send(returnObj);
        }
    );
};

exports.getUserById = (req, res) => {
    console.log('user.controller::getUserById called');
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
            res.send(userResponseObj);
        }
    );
}

exports.update = (req, res) => {
    console.log('user.controller::update called');
    let userId = req.body.userId; // TODO: handle error case where userId is not included in HTTP request body.
    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password
    User.update(userId, username, email, password,
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

exports.delete = (req, res) => {
    console.log('user.controller::delete called');
    let userId = req.params.userId;
    User.delete(userId,
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
