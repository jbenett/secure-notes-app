function testPassword(p) {
    // return true if the password contains:
    // at least one digit
    // at least one special character
    // at least one alphabetic
    // and no blank space
    return /^(?=.*\d)(?=(.*\W))(?=.*[a-zA-Z])(?!.*\s)/.test(p);
}

$("#submit-btn").click(function(e) {
    e.preventDefault();
    var email = $('#email').val();
    var password = $('#password').val();
    if (email == "" || (password == "")) {
      $('#response-div').removeClass();
      $('#response-div').addClass("results");
      $('#response-div').addClass("failure");
      $('#response').html("Please fill out necessary fields");
    }
    else if (!testPassword(password)) {
      $('#response-div').removeClass();
      $('#response-div').addClass("results");
      $('#response-div').addClass("failure");
      $('#response').html("Password does not meet character requirements.");
    }
    else if (password.length < 8){
      $('#response-div').removeClass();
      $('#response-div').addClass("results");
      $('#response-div').addClass("failure");
      $('#response').html("Password is not long enough.");
    }
    else {
      $.post("http://localhost:3000/register", {email: email, password: password})
      .done(function(data) {
          $('#response-div').removeClass();
          $('#response-div').addClass("results");
          $('#response-div').addClass("success");
          $('#response').html("Account Created Successfully");
      })
      .fail(function() {
          $('#response-div').removeClass();
          $('#response-div').addClass("results");
          $('#response-div').addClass("failure");
          $('#response').html("Account Already Exists");
      });
    }
});
