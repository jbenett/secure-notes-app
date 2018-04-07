let sqlite3 = require('sqlite3').verbose();
var speakeasy = require('speakeasy');
var QRCode = require('qrcode');
// Nodejs encryption with CTR
const crypto = require('./verysecure');

/* temporary: find better solution (probably localStorage or maybe something better?) */
var two_factor_temp_secret = 0;

let db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
});


function encrypt(data, key){
  console.log(data);
  var txt = Buffer.from(data,'ascii');
  return crypto.cipher(txt, key).toString('hex');
}

function decrypt(data, key){
  console.log(data);
  var ctxt = Buffer.from(data,'hex');
  return crypto.cipher(ctxt, key).toString('ascii');
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
                // TODO: Generate and return a temp_auth_token that can be used to make subsequent requests to get notes
                // Redirect user to their notes page!
                return;
            } else {
                res.status(500);
                res.json({msg: "Invalid token."});
                return;
            }

        });


    });

    /*
    * Retrieves (unencrypted) notes for user.
    * Required parameters:
    *     - email
    *     - temp_auth_token
    *
    */
    app.get('/notes', (req, res) => {
        let email = req.query.email;
        let temp_auth_token = req.query.temp_auth_token;

        if (email === undefined || temp_auth_token === undefined) {
            res.status(400);
            res.json({msg: "Bad request. Email and temp_auth_token must be set."});
            return;
        }


        // Verify temp_auth_token against email_id using prepared SQL statement
        db.all(`SELECT Notes.id, Notes.content FROM Notes, Users WHERE Notes.user_id = Users.id AND Users.email = ? and Users.temp_auth_token = ?`, [email, temp_auth_token], (err, result) => {
            if (err || result === undefined) {
              console.error(err);
              res.status(500);
              res.json({msg: "Invalid email or temp_auth_token."});
              return;
            }

            /* Reformat response object so it is in the following format:
            *
            * result_array = [
                {
                    id: 1,
                    note: "Note 1 content"
                },
                {
                    id: 2,
                    note: "Note 2 content"
                },
                ,...,
            * ]
            *
            */
            result_array = [];
            for (row in result) {
                result_array.push({
                    id: result[row]["id"],
                    content: result[row]["content"]
                });
            }

            res.status(200);
            res.json({data: result_array});
            return;
        });

    });

    /*
    * Allows a user to post a new note to the database.
    *
    *
    *
    *
    */
    app.post('/notes/new', (req, res) => {

    });

    /*
    * Allows a user to delete their own notes.
    *
    * Parameters needed:
    *       - email
    *       - temp_auth_token
    *       - an array of note id's to delete
    */
    app.post('/notes/delete', (req, res) => {
        let email = req.body.email;
        let temp_auth_token = req.body.temp_auth_token;
        let delete_ids = req.body.id_array;

        if (email === undefined || temp_auth_token === undefined || delete_ids == undefined) {
            res.status(400);
            res.json({msg: "Bad request. Email and temp_auth_token must be set."});
            return;
        }

        // Sanitize id array, ensure only positive integers:
        for (var i = 0; i < delete_ids.length; i++) {
            if (!parseInt(delete_ids[i]) || parseInt(delete_ids[i]) < 0) {
                res.status(400);
                res.json({msg: "Delete array ids must be integers greater than or equal to 0."});
                return;
            }
        }

        // Verify temp_auth_token against email_id using prepared SQL statement
        db.all(`SELECT Notes.id, Notes.content FROM Notes, Users WHERE Notes.user_id = Users.id AND Users.email = ? and Users.temp_auth_token = ?`, [email, temp_auth_token], (err, result) => {
            if (err || result === undefined) {
              console.error(err);
              res.status(500);
              res.json({msg: "Invalid email or temp_auth_token."});
              return;
            }

            // temp_auth_token valid. delete notes.
            for (var i = 0; i < delete_ids.length; i++) {
                db.run('DELETE FROM Notes WHERE user_id = (SELECT id from Users where email = ?) AND Notes.id = ?', [email, delete_ids[i]], (err) => {
                    if (err) {
                        console.error(err);
                        res.status(500);
                        res.json({msg: "Unable to delete notes. Try again later."});
                        return;
                    }
                });
            }

            // Successfully deleted notes.
            console.log("Deleted notes: ", email, delete_ids);
            res.status(200);
            res.json({msg: "Deleted notes."});
            return;


            /*db.run('DELETE FROM Notes WHERE user_id = (SELECT id from Users where email = ?) AND Notes.id in (?)', [email, "1,2"], (err) => {
                if (err) {
                    console.error(err);
                    res.status(500);
                    res.json({msg: "Unable to delete notes. Try again later."});
                    return;
                } else {
                    // Successfully deleted notes.
                    console.log("Deleted notes: ", email, delete_ids);
                    res.status(200);
                    res.json({msg: "Deleted notes."});
                    return;
                }


            });*/

        });



    });


}


module.exports = register_routes;
