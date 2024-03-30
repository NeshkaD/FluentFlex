let db = require('./mysql_db.js');

// constructor
const User = function(user) {
    this.id = user.id;
    this.username = user.username;
    this.password = user.password;
    this.email_address = user.email_address;
};
