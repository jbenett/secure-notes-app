let sqlite3 = require('sqlite3').verbose();
var speakeasy = require('speakeasy');
var QRCode = require('qrcode');
// Nodejs encryption with CTR
const crypto = require('crypto'),
    algorithm = 'aes-256-ctr';

/* temporary: find better solution (probably localStorage or maybe something better?) */
var two_factor_temp_secret = 0;

let db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
});

// TODO: Rewrite these
function encrypt(data, key){
  var cipher = crypto.createCipher(algorithm, key);
  var crypted = cipher.update(data,'utf8','hex');
  crypted += cipher.final('hex');
  return crypted;
}

function decrypt(data, key){
  var decipher = crypto.createDecipher(algorithm, key);
  var dec = decipher.update(data,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}


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


        db.get(`SELECT COUNT(*) as count FROM Users where email = ?`, [email], (err, result) => {
            // Check if email already exists in DB
            if (result['count'] !== 0) {
                res.status(400);
                console.log("User " + email + " already exists.");
                res.json({msg: "User already exists in database."});
                return;
            }

            // Create secret key for user for use with 2FA
            let secret_key_2fa = speakeasy.generateSecret();
            console.log(secret_key_2fa.otpauth_url);

            // Create user by inserting new record into users table
            let encrypted_email = encrypt(email, password); // TODO: Actually encrpyt this
            db.run(`INSERT INTO Users(email, encrypted_email, secret_key_2fa) VALUES(?, ?, ?)`, [email, encrypted_email, secret_key_2fa.base32], function(err) {
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
    * Once the user logs in, a QR code will be returned for the user to scan (Only needed to scan once) with their 2FA app
    * Then the user will enter their 2FA code, which the client-side app will send again, with the user details to the /login_step2 route
    */
    app.post('/login_step1', (req, res) => {
        let email = req.body.email;
        let password = req.body.password;

        if (email === undefined || password === undefined) {
            res.status(400);
            res.json({msg: "Bad request. Email and password must be set."});
            return;
        }

        db.get(`SELECT * FROM Users WHERE email = ?`, [email], function(err, result) {
          if (err || result === undefined) {
            console.error(err);
            res.status(500);
            res.json({msg: "Account not found."});
            return;
          }

          // Attempt to unencrypt email with given key (user's password) -- First step of multifactor authentication
          var decrypted_email = decrypt(result["encrypted_email"], password);

          // Not valid key, deny entry!
          if (decrypted_email != result["email"]) {
              console.log("Invalid password. User denied.");
              res.status(500);
              res.json({msg: "Invalid password."});
              return;
          }

          // Otherwise, user is valid, move onto next factor of authentication
            let otpauth_url = "otpauth://totp/EncryptedNotesApp?secret=" + result["secret_key_2fa"];


            QRCode.toDataURL(otpauth_url, function(err, data_url) {
              console.log("Generated QR-code and sent to user for step 2 of multifactor authentication");
              res.json({msg: "Successfully authetnicated step 1 (username + password). Moving onto second factor of autth.", qr: data_url});
              return;
            });

        });
    });

    /*
    * This endpoint is called for the 2FA process when the user
    * wants to verify their passcode
    * Parameters needed in payload:
    *   -token
    *   -??
    *
    */
    app.post('/login_step2', (req, res) => {
        let token = req.body.token; // Token from 2FA app (like google authenticator)
        let email = req.body.email;

        // Get user's 2FA key from database
        db.get(`SELECT secret_key_2fa FROM Users WHERE email = ?`, [email], function(err, result) {
            if (err || result === undefined) {
              console.error(err);
              res.status(500);
              res.json({msg: "Error logging in."});
              return;
            }

            let secret = result['secret_key_2fa'];
            let verified = speakeasy.totp.verify({ secret: secret,
                                           encoding: 'base32',
                                           token: token });

            if (verified) {
                res.status(200);
                res.json({msg: "Second setp of auth successful. Proceeding to note page"});
                // Redirect user to their notes page!
                return;
            } else {
                res.status(500);
                res.json({msg: "Invalid token."});
                return;
            }

        });


    });
}


module.exports = register_routes;
