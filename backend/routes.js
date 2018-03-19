let sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
});

function register_routes(app) {
    // When somebody goes to ourdomain.com/, reply with "Hello world"
    app.get('/', (req, res) => {
        // Add "controller code" inside here
        res.send('Hello World!');
    });

    /*
    * This endpoint is called when our app wants to register a user.
    * Parameters needed in payload:
    *       - email
    *       - password (will be used to encrypt user's notes)
    *
    *
    */
    app.post('/register', (req, res) => {
        // TODO: Validate these params, return error if not present
        let email = req.body.email;
        let password = req.body.password;

        // TODO: Check if email already exists. If it does, return error.
        let emailExists = false;

        if (!emailExists) {
            // Create user by inserting new record into users table
            db.run(`INSERT INTO Users(email, password) VALUES(?, ?)`, [email, password], function(err) {
              if (err) {
                res.status(500);
                res.json({msg: "Error inserting data"});
              }
              // get the last insert id

              res.status(200);
              res.json({msg: "User created!"});
            });
        }
    });


    /*
    * This endpoint is called the user wants to login.
    * Parameters needed in payload:
    *       - email
    *       - password
    *
    */
    app.post('/login', (req, res) => {

    });
}


module.exports = register_routes;
