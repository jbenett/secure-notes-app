const express = require('express');
const app = express();

// Register routes
require('./routes.js')(app);

app.listen(3000, () => console.log('Example app listening on port 3000!'));
