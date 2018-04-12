/**
* notes.js
*
* Javascript file that gives functionality to 
* populating notes on the notes page and deleting them.
*/
let $ = require('jquery');
let email = localStorage.getItem("email");
let password = localStorage.getItem("password");
let temp_auth_token = localStorage.getItem("temp_auth_token");


/**
* Page population functionality
* Function iterates through the array containing the content of
* the notes and displays them on the page.
*/
function displayHTML() {
	$('#notes-section')[0].innerHTML = "";
	$.get("http://localhost:3000/notes", {email: email, temp_auth_token: temp_auth_token, password: password })
	.done(function(result) {
		let maxLength = 200;
		for (let i = 0; i < result["data"].length; i++) {
			if(result["data"][i]["content"].length < maxLength) {
				$('#notes-section')[0].innerHTML += "<div class=\"note\">\n<input class=\"check\" value=\"" + result["data"][i]["id"] +"\" type=\"checkbox\">\n" + result["data"][i]["content"] + "\n</div>";
			} else {
				$('#notes-section')[0].innerHTML += "<div class=\"note\">\n<input class=\"check\" value=\"" + result["data"][i]["id"] +"\" type=\"checkbox\">\n" + result["data"][i]["content"].substring(0, maxLength) + "...\n</div>";
			}
		}
	})
	.fail(function(error) {
		alert("Unable to fetch notes.");
		console.error(error);
	});
	return 0;
}

displayHTML();

/**
* Functionality for delete
* The first time a user hits the minus button,
* checkboxes will appear: one for each note.
* When the user hits the minus button again,
* all notes that were checked are deleted and are
* cleared from the screen and deleted from the database.
*/
let toggle = true;
$('#del-btn').click(function() {
	if(toggle) {
		$('.check').show('fade');
		toggle = false;
	} else {
		// Collect ids of the notes and delete them from the database
		let values = [];
		$('#notes-section :checked').each(function() {
	       values.push($(this).val());
	     });
		$.post("http://localhost:3000/notes/delete", {email: email, temp_auth_token: temp_auth_token, id_array: values })
		.done(function(result) {
			console.log("Successfully deleted notes", result);
			displayHTML();
			$('.check').hide('fade');
			toggle = true;
		})
		.fail(function(error) {
			console.error(error);
		});


	}
});
