/*
 *  The MIT License (MIT)
 *
 *  Copyright (c) 2014 Ulysse Manceron
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 *
 */

var store = function(param, value) {
	localStorage.setItem(param, value);
};

var retrieve = function(param) {
	return localStorage.getItem(param);
};

// Saves options to localStorage.
var defValue = [
	['separator', 'This string will be insered between each songs, when doing /songPreview.', ' --- '],
	['prefixRename', 'Will try to find this string in the description of the broadcast, and write " {GS Bot} X songs left." after it. If there is no match, it will remove the entire description, so be careful!', 'Broadcaster:'],
	['welcomeMessage', 'Place this in chat after the activation.', 'Server mode enabled. Let\'s take over the world!'],
	['defaultSongPreview', 'The number of songs that will be displayed on /songPreview.', 10],
	['maxSongPreview', 'Since a user can do "/songPreview X" to preview X songs, we need a limit, it is defined here.', 25],
	['closeAllTabsOnStartup', 'If this is checked, all grooveshark tabs will be close upon activation of the bot', true],
	['forceLoginUsername', 'If this field is filled, the bot will try to login with this username. This is overriden by starting the bot with http://broadcast/MY_USERNAME/MY_PASSWORD . If this is blank, grooveshark will use the bot will use the current sessnion.', ''],
	['forceLoginPassword', 'Same as forceLoginUsername, only this is the password.', ''],
	['whitelist', 'The ID of the grooveshark users that can /guest. Separate each ID with a comma.', []],
	['whitelistLevel', 'The default permission mask to give guests.', 63],
	['whitelistIncludesFollowing', 'If checked, all the people you follow will have the ability to /guest.', true],
	['displayAuthorNotAlbum', 'If checked, seek will display the number author instead of the album.', false],
	['blacklist', 'The ID of the grooveshark user in this list will not be able to /guest, even if they are being followed by you, and if you checked whitelistIncludesFollowing. Separate each ID with a comma.', []],
	['whiteListName', 'The rank of person in the whitelist, used when non whitelist people try to guest "Only [this name] can use that feature, sorry!"', 'broadcaster'],
	['historyLength', 'The number of tracks that will be saved in a local "history". When playing from collection, the bot will TRY (no promises) to get a song that was not in this history.', '50'],
	['TimeSlots', 'The timeslotting feature allows you two switch between playlists at given times', "TIMESLOTS"],
	['ShoutOutInterval', 'The interval of your shoutout message, the message will be sent once every x minutes.', '50'],
	['ShoutOutMessage', 'The message to send for your shoutout -- If blank no shoutout will be used', ''],
	['WolframPHPUrl', 'The plugin comes with a php script, this is the location of the webserver that hosts that php.', ''],
];

var content = document.getElementById('content');

var timeSlots = [];//localStorage.getItem("Timeslot_Array") != null ? JSON.parse(localStorage.getItem("Timeslot_Array")) : [];

function save_options() {
  defValue.forEach(function(element) {
	if (typeof(element[2]) == 'boolean')
		store(element[0], document.getElementById(element[0]).checked);
	else if(document.getElementById(element[0]))
		store(element[0], document.getElementById(element[0]).value);
  });
  
  store('TIMESLOTS', document.getElementById("timeslotTD").innerHTML);
  var timeSlotArray = [];
  
  for(var timeslot in timeSlots){
	console.log(timeSlots[timeslot]);
	timeSlotArray.push(timeSlots[timeslot]);
  }
  
  localStorage.setItem('Timeslot_Array', JSON.stringify(timeSlotArray));
  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  status.innerHTML = "Options Saved.";
  setTimeout(function() {
    status.innerHTML = "";
  }, 750);
}

function addEventListenerList(list, event, fn) {
    for (var i = 0, len = list.length; i < len; i++) {
        list[i].addEventListener(event, fn, false);
    }
}

function removeTimeslot()
{
	var node = this.parentNode;
	var key = this.attributes[3].value;
	timeSlots[key] = undefined;
	node.parentNode.removeChild(node);
}

function bindTimeslotEvents()
{
	document.getElementById('addTimeslot').addEventListener("click", addTimeslot);
	var Xs = document.getElementsByClassName('removeTimeslot');
	addEventListenerList(Xs, "click", removeTimeslot); 
}

function addTimeslot() {
	var selectedTime = document.getElementById('timeSelect');
	var selectedText = selectedTime.options[selectedTime.selectedIndex].text;
	var timeslotPlaylist = document.getElementById('timeslotPlaylist').value;
	var timeslotMessage = document.getElementById('timeslotMessage').value;
	var td = document.getElementById('timeslotTD');
	if(timeSlots[selectedText] == undefined || timeSlots[selectedText] == null){
		var timeSlotOBJ = {Name: timeslotPlaylist, Message: timeslotMessage, StartHour: parseInt(selectedTime.value), key: selectedText};
		timeSlots[selectedText] = timeSlotOBJ;
		td.innerHTML += "<span style='padding: 10px;'><br/><span class='timeslotTime' data-time='"+selectedTime+"'> "+selectedText+"</span> | (playlist) <span class='timeslotPlaylist'>"+timeslotPlaylist+"</span> | (message) <span class='timeslotMessage'>"+timeslotMessage+"</span><input type='button' value='X' class='removeTimeslot' data-attr-key='"+selectedText+"'/></span>";
		// // console.log(selectedtime.value);
		// // console.log(selectedtext);
		// // console.log(timeslotplaylist);
		// // console.log(timeslotmessage);
		bindTimeslotEvents();
	} else {
		alert("You can't have more than one Timeslot for each hour");
	}
}

// Restores select box state to saved value from localStorage.
function restore_options() {
  content.innerHTML = '';
  defValue.forEach(function(element) {
	if (retrieve(element[0]) == undefined)
		store(element[0], element[2]);

	var tmp = '<tr><td>' + element[0] + '</td><td>';
	switch (typeof(element[2]))
	{
		case 'boolean':
			tmp += '<input disabled type="checkbox" ' + (element[2] ? 'checked' : '')  + ' /></td><td>';
			tmp += '<input type="checkbox" id="' + element[0] + '" ' + (retrieve(element[0]) == 'true' ? 'checked' : '')  + ' />';
			break;
		case 'object':
			tmp += '<textarea disabled cols="37"></textarea></td><td>';
			tmp += '<textarea id="' + element[0] + '"  cols="37">' + retrieve(element[0]) + '</textarea>';
			break;
		case 'string':
			switch(element[2])
			{
				case "TIMESLOTS":
					tmp += "<span>No default value</span></td><td id='timeslotTD'>";
					var savedTimeslots = retrieve("TIMESLOTS");
					if(savedTimeslots) {
						tmp += savedTimeslots;
					} else {
						tmp += "<select id='timeSelect'>";
						for(var i = 0; i < 24; i++) tmp+= "<option value="+i+">"+(i < 12 ? (i == 0) ? "12AM" : i+"AM" : i== 12 ? "12PM" : (i-12)+"PM")+"</option>";
						tmp += "</select>";
						
						tmp += "<input type='text' id='timeslotPlaylist' placeholder='Playlist Name' />";
						tmp += "<input type='text' id='timeslotMessage' placeholder='Message' />";
						tmp += "<input type='button' id='addTimeslot' value='Add Timeslot'/>";
					}
					break;
				default:
					tmp += '<input disabled size="50" type="name" value="'+ element[2] +'" /></td><td>';
					tmp += '<input size="50" type="name" id="' + element[0] + '" value="'+ retrieve(element[0]) +'" />';
					break;
			}
			break;
		default:
			tmp += '<input disabled size="50" type="name" value="'+ element[2] +'" /></td><td>';
			tmp += '<input size="50" type="name" id="' + element[0] + '" value="'+ retrieve(element[0]) +'" />';
			break;
	}
	tmp += '</td><td>' + element[1] + '</td></tr>';
	content.innerHTML += tmp;
	});
	bindTimeslotEvents();
	
	var timeslotArray = JSON.parse(localStorage.getItem("Timeslot_Array"));
	for(var i = 0; i < timeslotArray.length; i++)
	{
		if(timeslotArray[i])
			timeSlots[timeslotArray[i].key] = timeslotArray[i];
	}
}

function reset_all() {
	if (confirm('Are you sure you want to reset your setting?'))
	{
		var version = retrieve('lastest_version');
		localStorage.clear();
		store('lastest_version', version);
		restore_options();
	}
}

document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
document.querySelector('#factoryreset').addEventListener('click', reset_all);
document.getElementById('version').innerHTML = chrome.app.getDetails().version;
