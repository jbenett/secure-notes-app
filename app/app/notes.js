// notes.js
//import $ from 'jquery';
let $ = require('jquery');

//expecting to get an array of content from routes.js
let email = localStorage.getItem("email");
let temp_auth_token = localStorage.getItem("temp_auth_token");
$.get("http://localhost:3000/notes", {email: email, temp_auth_token: temp_auth_token})
.done(function(result) {
	let maxLength = 200;
	for (let i = 0; i < result["data"].length; i++) {
		if(result["data"][i]["content"].length < maxLength) {
			$('#notes-section')[0].innerHTML += "<div class=\"note\">\n" + result["data"][i]["content"] + "\n</div>";
		} else {
			$('#notes-section')[0].innerHTML += "<div class=\"note\">\n" + result["data"][i]["content"].substring(0, maxLength) + "...\n</div>";
		}
	}
})
.fail(function(error) {
	alert("Unable to fetch notes.");
	console.error(error);
});
let dummyData = ["Content of note goes here. This is the note content. A content filled with notes. Where there is a note, there is content. Yooooo. After a certain point, chop off the contents of the note.",
"next note lorem ipsum", "Call Sally on Tuesday", "this next meeting is going to be terrible but I should just be happy with where I am in life I guess.",
"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque nunc neque, ultricies eu posuere non, convallis vel leo. Vivamus mollis pharetra aliquet. Proin laoreet dictum turpis sed porta. Maecenas aliquam ut libero nec lobortis. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Sed vestibulum quam accumsan diam bibendum sagittis. Pellentesque felis augue, convallis eget sem a, ornare pulvinar nunc. Donec tempor euismod elementum. Suspendisse quis mi in nibh hendrerit efficitur. Cras maximus odio consequat magna aliquet, in mattis risus laoreet. Praesent at tortor quis felis euismod dictum. Proin egestas lacinia viverra. Phasellus at velit vel sapien pretium volutpat. Nunc ultricies molestie pretium. Aenean mollis bibendum ante, id maximus eros convallis et. Fusce tortor eros, porta nec nisl et, vehicula tincidunt lacus. Ut et rutrum urna, quis rhoncus erat. Mauris lobortis, arcu accumsan sagittis feugiat, diam arcu condimentum orci, nec vestibulum magna felis at magna. Integer dapibus augue non lacus dignissim fringilla. Aenean imperdiet, ex a consequat laoreet, libero mi faucibus urna, sed tincidunt lacus massa eu metus. Aenean tincidunt magna nisi, quis suscipit neque venenatis ac. Phasellus commodo sodales sem, ut condimentum arcu. In ut nisi neque. Nullam non ornare elit, et egestas elit. Sed erat massa, pulvinar ut egestas ut, venenatis ut neque. Suspendisse metus magna, hendrerit eget vehicula id, venenatis sagittis ligula. Praesent feugiat nisl at augue consectetur, condimentum finibus sapien placerat. Fusce neque leo, vehicula eu felis sit amet, tempus convallis tellus. Maecenas posuere ornare felis, quis tristique nisl vestibulum vitae. Sed eleifend facilisis nisl, et imperdiet odio. Mauris ultricies, elit vel ultrices dapibus, nisl nisi tincidunt magna, non consequat libero tortor eu dui. Fusce et tristique tortor. Nam augue purus, dapibus ac tellus sed, vehicula ultricies dolor. Suspendisse purus nulla, rutrum non porta quis, tincidunt non tortor. Suspendisse elementum, dolor at iaculis tempus, ipsum turpis aliquet est, at efficitur leo risus in massa. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Aliquam luctus nisl dictum nunc luctus eleifend. Mauris et elementum felis. Morbi ut orci nec nisi tincidunt commodo. Cras eu odio sed dui auctor malesuada vitae id leo. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Mauris suscipit mattis venenatis. In tortor nisl, dapibus ut placerat sit amet, feugiat ac nulla. Phasellus porttitor in ante laoreet condimentum. Aenean euismod leo non ante sodales, vel dignissim lorem aliquam. Ut ac nisl eget lacus pellentesque rhoncus ac sit amet ex. Quisque id massa vitae ipsum congue dignissim eget quis velit. Nam rhoncus metus in fringilla ullamcorper.",
"On the Mindless Menace of Violence is a speech given by United States Senator and presidential candidate Robert F. Kennedy. He delivered it in front of the City Club of Cleveland at the Sheraton-Cleveland Hotel on April 5, 1968, the day after the assassination of Martin Luther King Jr. With the speech, Kennedy sought to counter the King-related riots and disorder emerging in various cities, and address the growing problem of violence in American society. On April 4, King, a prominent African-American civil rights leader, was assassinated. Race riots subsequently broke out across the United States. After delivering an improvised speech on the matter in Indianapolis, Kennedy withdrew to the hotel he was staying in and suspended his presidential campaign. Community leaders convinced him to keep a single engagement before the City Club of Cleveland. Doing away with his prepared remarks, Kennedy's speechwriters worked early into the morning of April 5 to craft a response to the assassination. Kennedy reviewed and revised the draft en route to Cleveland. Speaking for only ten minutes, Kennedy outlined his view on violence in American society before a crowd of 2,200. He criticized both the rioters and the white establishment who, from his perspective, were responsible for the deterioration of social conditions in the United States. He proposed no specific solutions to the internal division and conflict, but urged the audience to seek common ground and try to cooperate with other Americans. Kennedy's speech received much less attention than his famous remarks in Indianapolis and was largely forgotten by the news media. However, several of his aides considered it to be among his finest orations. Journalist Jack Newfield was of the opinion that the address was a suitable epitaph for the senator, who was assassinated two months later", "The airport was closed for renovation in November 2011. Its reopening ceremony was held on 27 September 2012. It was attended by President of Georgia Mikheil Saakashvili, Prime Minister of Hungary, Viktor Orbán[6] and Wizz Air CEO József Váradi.[7] For preparation works, for the commissioning of the airport and training of staff, the French company Vinci Airports was contracted.[8] There is one duty-free shop and two coffee shops operating at the airport. The airport is currently connected to scheduled marshrutkas operated by Georgian Bus, with services to Kutaisi, Tbilisi and Batumi after each arrival.[9] The airport terminal is located next to the main road between Kutaisi and Batumi, so it is possible to transfer to those cities also by marshrutka.[10] The priority of Kutaisi airport is to attract low tariff airlines. A significant growth in the number of passenger has been noted soon after the reopening of the airport in 2012, mainly due to Wizz Air operations linking Kutaisi with European airports. For 2013 the operator reported 187,939 passengers.[11] In February 2016 Wizz Air announced a new base at Kutaisi Airport and is planning to add second base in 2018.",
"Get grandma a birthday card"]
console.log("Hello");

/*
let maxLength = 200;
for (let i = 0; i < dummyData.length; i++) {
	if(dummyData[i].length < maxLength) {
		$('#notes-section')[0].innerHTML += "<div class=\"note\">\n" + dummyData[i] + "\n</div>";
	} else {
		$('#notes-section')[0].innerHTML += "<div class=\"note\">\n" + dummyData[i].substring(0, maxLength) + "...\n</div>";
	}
}
*/
