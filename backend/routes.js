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
        // Validate all params are set, return error if not present
        let email = req.body.email;
        let password = req.body.password;
        console.log(req.body)

        if (email === undefined || password === undefined) {
            res.status(400);
            res.json({msg: "Bad request. Email and password must be set."});
            return;
        }


        db.get(`SELECT COUNT(*) FROM Users WHERE email = ?`, [email], (result, err) => {
            // Check if email already exists in DB
            if (result !== null) {
                res.status(400);
                res.json({msg: "User already exists in database."});
                return;
            }

            // Create user by inserting new record into users table
            let encrypted_email = email; // TODO: Actually encrpyt this
            db.run(`INSERT INTO Users(email, encrypted_email) VALUES(?, ?)`, [email, encrypted_email], function(err) {
              if (err) {
                console.log("Error inserting data", err);
                res.status(500);
                res.json({msg: "Error inserting data"});
                return;
              }

              // User successfully created.
              res.status(200);
              res.json({msg: "User created!"});
              return;
            });


        });
    });


    /*
    * This endpoint is called the user wants to login.
    * Parameters needed in payload:
    *       - email
    *       - password
    *       - others?
    *
    *
    */
    app.post('/login', (req, res) => {
0
    });
}


module.exports = register_routes;
