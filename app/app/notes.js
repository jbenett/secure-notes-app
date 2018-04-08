// notes.js
//import $ from 'jquery';
let $ = require('jquery');
let email = localStorage.getItem("email");
let temp_auth_token = localStorage.getItem("temp_auth_token");


/**
* Function iterates through the array containing the content of
* the notes and displays them on the page.
*/
function displayHTML() {
	$('#notes-section')[0].innerHTML = "";
	$.get("http://localhost:3000/notes", {email: email, temp_auth_token: temp_auth_token})
	.done(function(result) {
		console.log("Updating notes", result);
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


// let maxLength = 200;
// let temp = 0;
// for (let i = 0; i < dummyData.length; i++) {
// 	if(dummyData[i].length < maxLength) {
// 		$('#notes-section')[0].innerHTML += "<div class=\"note\">\n<input class=\"check\" value=\"" + temp +"\" type=\"checkbox\">\n" + dummyData[i] + "\n</div>";
// 	} else {
// 		$('#notes-section')[0].innerHTML += "<div class=\"note\">\n<input class=\"check\" value=\"" + temp +"\" type=\"checkbox\">\n" + dummyData[i].substring(0, maxLength) + "...\n</div>";
// 	}
// 	temp++;
// }


/**
* Functionality for delete
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
