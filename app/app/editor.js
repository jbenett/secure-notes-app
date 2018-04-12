/**
* editor.js
*
* Javascript file that gives functionality to 
* Creating and editing a note
*/

let $ = require('jquery');

let email = localStorage.getItem("email");
let password = localStorage.getItem("password");
let temp_auth_token = localStorage.getItem("temp_auth_token");

/**
* Save functionality
* When the save button is clicked, the content typed in
* the textbox will be saved as a note to the database.
* If the note already exists, it will be updated.
* If a note doesn't already exist, a new note will be created.
*/
$('#save-btn').click(function(e) {
    e.preventDefault();
    let content = $('#note-content').val();

    // Publish note to DB
    console.log(email, temp_auth_token, content);
    $.post("http://localhost:3000/notes/new", {email: email, temp_auth_token: temp_auth_token, content: content, password: password})
    .done(function(result) {
        // Redirect user to view notes
        window.location.href="notes.html";
    })
    .fail(function(result) {
        alert("Could not add a note. Please try again.");
        window.location.href="notes.html";
    });
});