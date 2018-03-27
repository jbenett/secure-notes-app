let sqlite3 = require('sqlite3').verbose();
var speakeasy = require('speakeasy');
var QRCode = require('qrcode');

/* temporary: find better solution (probably localStorage or maybe something better?) */
var two_factor_temp_secret = 0;

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
        let email = req.body.email;
        let password = req.body.password;

        console.log(req.body);

        db.run(`SELECT count(1) FROM Users WHERE email = ? AND password = ?`, [email, password], function(err) {
          if (err) {
            res.status(500);
            res.json({msg: "Email not found or password not correct"});
          } else {
            res.status(200);
            var secret = speakeasy.generateSecret();

            two_factor_temp_secret = secret.base32;
            
            QRCode.toDataURL(secret.otpauth_url, function(err, data_url) {
              console.log(data_url);
            });

            res.json({msg: "User found!", qr: data_url});
          }
        });
    });

    /*
    * This endpoint is called for the 2FA process when the user
    * wants to verify their passcode
    * Parameters needed in payload:
    *   -passcode
    *   -??
    *
    */
    app.post('/verify', (req, res) => {
        let passcode = req.body.passcode;
        let secret = two_factor_temp_secret;

        console.log(req.body);

        let verified = speakeasy.totp.verify({ secret: base32secret,
                                       encoding: 'base32',
                                       token: passcode });
        if(verified) {
            res.status(200);
            res.json(msg: "verified!");
        } else {
            res.status(500);
            res.json(msg: "incorrect passcode");
        }
    });
}


module.exports = register_routes;
