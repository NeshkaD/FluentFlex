const mysql = require('mysql2')
let dbConf = require('../../config/dbConfig.js');

// Create connection object that the server back-end application will use to interact with MySQL DB tables:
let conn = mysql.createConnection(
    {
        host: dbConf.host,
        user: dbConf.user,
        password: dbConf.password,
        database: dbConf.database
    }  
);

// Initialize the connection
conn.connect( (err) => {
    if (err) {
        console.log('mysql connection failed. Error: ' + err.message);
    }
    else {
        console.log('mysql connection established');
    }
});

module.exports = conn;