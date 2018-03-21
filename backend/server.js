
const express = require('express');
const app = express();

// ExpressJS Middleware

// This will parse our request payload
let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Register routes
require('./routes.js')(app);

app.listen(3000, () => console.log('Example app listening on port 3000!'));
