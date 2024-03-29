const express = require('express')
const cors = require('cors');
const web_app = express();

let corsOptions = {
    origin: "http://localhost:4200"
};

web_app.use(cors(corsOptions)); // enable CORS for http requests from Angular frontend.
web_app.use(express.json()); // add JSON middleware from Express that parses requests.
web_app.use(express.urlencoded({ extended: true })); // add URL encode/decode middleware from Express. 'extended' enables JSON-like experience for URL-encoded.

const view_path = __dirname + '/src/views/'; //  not currently used to serve any frontend
web_app.use(express.static(view_path));

web_app.get('/', (req, res) => { // define root route.
  res.sendFile(path + "index.html");
});

require("./src/routes/routes.js")(web_app); // Add subroutes to web_app.

const listen_port = process.env.PORT || 8080; // If port specified at runtime then use it. Else default port is 8080.
web_app.listen(listen_port, () => console.log(`Server connection established on port ${listen_port}`)); // Listen for requests.

module.exports = web_app;