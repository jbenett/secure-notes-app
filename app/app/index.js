/**
* index.js
*
* Javascript file that gives functionality to 
* user login.
*/
let $ = require('jquery');

var email;
var password;

/**
* Login functionality for step 1 of 2FA validation.
* Once user inputs their username and password and they are
* validated, the user is prompted to complete 2FA verification
* with a QR code and/or textbox depending on whether it is 
* their first time logging in or not.
*/
$('#login-button').click(function(e) {
    e.preventDefault();
    email = $('#email').val();
    password = $('#password').val();

    $.post("http://localhost:3000/login_step1", {email: email, password: password})
    .done(function(data) {
        $('#step1').hide();
        $('#step2').show();
        if ("qr" in data) {
            $('.login-wrapper').css('height', '500px');
            $('#qrcode-image').attr('src', data['qr']);
            $('#registered').text('Please scan the QR code above into your 2FA app and enter the token generated below');
        }
    })
    .fail(function() {
        alert("Error logging in.");
    });

});

/**
* Login functionality for step 2 of 2FA validation.
* Once the user inputs a valid code from the Google Authenticator
* app, they are logged in and are taken to notes.html.
* If the user does not enter a valid code, an error message pops
* up alerting them of the failure.
*/
$('#login-button2').click(function(e) {
    e.preventDefault();
    var token = $('#token').val();
    $.post("http://localhost:3000/login_step2", {email: email, token: token})
    .done(function(data) {
        alert("Successful login!");
        window.location.href = "notes.html";
        localStorage.setItem("email", email);
        localStorage.setItem("password", password);
        localStorage.setItem("temp_auth_token", data["temp_auth_token"]);
        console.log("Redirected user");
    })
    .fail(function(e) {
        alert("Invalid token.");
    });

});