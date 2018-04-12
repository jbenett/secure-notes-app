require('../renderer.js');
let $ = require('jquery');

var email;
var password;

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