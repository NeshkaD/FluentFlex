const express = require('express')
const cors = require('cors');
const web_app = express();

// CORS config for local testing:
let corsOptions = {
    origin: "http://localhost:4200"
};

web_app.use(cors(corsOptions)); // enable CORS for all http requests to the frontend (Angular) on port 4200
web_app.use(express.json()); // add JSON middleware functionality from Express. Parses requests with JSON payload (request body).
web_app.use(express.urlencoded({ extended: true })); // add URL encode/decode middleware functionality from Express. 'extended' is true to enable JSON-like experience with URL-encoded 

const view_path = __dirname +  '/../front-end/dist/front-end/browser/'; // directory containing the web pages (front end) to be served to client
web_app.use(express.static(view_path));

// define the root route
web_app.get('/', (req, res) => {
  res.sendFile(path + "index.html");
});

require("./src/routes/routes.js")(web_app); // sub-routes are in separate folder. Apply them by passing web_app as argument.

const listen_port = process.env.PORT || 8080; // If port is specified by runtime environment, then use that. Otherwise default to port 8080.
web_app.listen(listen_port, () => console.log(`Server connection established on port ${listen_port}`));

module.exports = web_app;