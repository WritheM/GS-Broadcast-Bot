/*
 *  The MIT License (MIT)
 *
 *  Copyright (c) 2014 Ulysse Manceron
 *
 *	Edited By: Mike Gleeson, 2014
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
 
var votelock = false;
var contestUsers = [];
var contestStatus = false;
var chatDelay = 1;
var songleft;
var allSongsId = [];
var lastPlayedSongs = [];
var actionTable = {};
var lastPlay;
var forcePlay = false;
var playingRandom = false;
var followingList = [];
var upvoteCounter = 0;
var downvoteCounter = 0;
var currentTimeslot = null;//{Name:"Collection", Message: "Back to the Mix!", StartHour: 15};
var records = {ListenerCount: 0, SongRecords: { MostUpvoted: '', UpvoteCount: 0, MostDownvoted: '', DownvoteCount: 0}}; 

var timeSlots = [];//[{Name:"Collection", Message: "Back to the Mix!", StartHour: 10}, {Name:"Chill", Message: "Time to chill out while the music spills out.", StartHour: 15}, {Name:"Electronic Energy", Message: "Time to take it up a notch!", StartHour: 13}]

// GroovesharkUtils
var GU = {
 'setTimeslot': function(timeSlot)
	{
		if(currentTimeslot == timeSlot) return;
		currentTimeslot = timeSlot;
		$("#trash").click();
		var PID = $(".name:contains("+currentTimeslot.Name+")").parent().parent().attr('data-playlist-id');
		GU.playPlaylist(currentTimeslot.Message, PID);
		
	},
 'inBroadcast': function()
    {
        return $('#bc-take-over-btn').hasClass('hide');
    },
 'sendMsg': function(msg)
    {
		chatDelay+=500;
		setTimeout(function(){
			var broadcast = GS.getCurrentBroadcast();
			if (broadcast === false)
				return;

			var maxMsgLength = 256; // the max number of caracters that can go in the gs chat
			var index = 0;

			msg = '⁞ᴿᵃᵈᶦᵒ ᴴᵒˢᵗ⁞ ' + msg;
			while ((Math.floor(msg.length / maxMsgLength) + (msg.length % maxMsgLength != 0)) >= ++index)
			{
				broadcast.sendChatMessage(msg.substr((index - 1) * maxMsgLength, maxMsgLength));
			}
			chatDelay-=500;
			if(chatDelay < 0) chatDelay = 0;
		}, chatDelay);
    },
 'songInQueue': function()
    {
        return $('#queue-num-total').text() - $('#queue-num').text();
    },
 'removeMsg': function()
    {
        $('.chat-message').addClass('parsed');
    },
 'openSidePanel': function()
    {
         if ($('.icon-sidebar-open-m-gray')[0])
            $('.icon-sidebar-open-m-gray').click()
    },
 'renameBroadcast': function(bdcName)
    {
        var attributes = GS.getCurrentBroadcast().attributes;
        if (attributes == undefined)
            return;
        var maxDescriptionLength = 145;
    
        var defName = attributes.Description;
        defName = defName.substr(0, defName.indexOf(GUParams.prefixRename)) + GUParams.prefixRename;
        if (playingRandom)
        {
            //defName += 'Playing from collection';
			defName += "Random Mode Engaged!";
        }
        else
        {
			//defName += "Playing the music that will send chills down your spine.";
            defName += GU.songInQueue() + ' song' + (GU.songInQueue() != 1 ? 's' : '') +' left';
        }
        if (bdcName == null)
            bdcName = defName;
        GS.Services.SWF.changeBroadcastInfo(GS.getCurrentBroadcastID(), {'Description': bdcName.substr(0, maxDescriptionLength)});
    },
 'getPlaylistNextSongs': function()
    {
        var songs = GS.Services.SWF.getCurrentQueue().songs;
        var index = GS.Services.SWF.getCurrentQueue().activeSong.queueSongID;
        while (songs[0] != null && songs[0].queueSongID <= index)
        {
            songs.shift();
        }
        return songs;
    },
 'previewSongs': function(msg, parameter)
    {
        var nbr = parseInt(parameter);
        if (nbr <= 0 || isNaN(nbr))
            nbr = GUParams.defaultSongPreview;
        if (nbr > GUParams.maxSongPreview)
            nbr = GUParams.maxSongPreview;
        songs = GU.getPlaylistNextSongs();
        
        var i = -1;
        var string = '';
        while (++i <= nbr)
        {
            var curr = songs[i];
            if (curr == null)
                break;
            if (GUParams.displayAuthorNotAlbum.toString() === 'true')
                string = string + '#' +i + ': ' + curr.SongName + ' ~ From: ' + curr.ArtistName + GUParams.separator;
            else
                string = string + '#' +i + ': ' + curr.SongName + ' ~ From: ' + curr.AlbumName + GUParams.separator;
        }
        GU.sendMsg('Next songs are: ' + string.substring(0, string.length - GUParams.separator.length));
    },
 'showPlaylist': function(message, stringFilter)
    {
        GU.openSidePanel();
        var string = '';
        var regex = RegExp(stringFilter, 'i');
        $('#sidebar-playlists-grid').find('.sidebar-playlist').each(function() {
            var playlistName = $(this).find('.name').text();
            if (regex.test(playlistName))
                string = string + '#' + $(this).index() + ': ' + playlistName + GUParams.separator;
        });
        if (string == '')
            string = 'No match found for ' + stringFilter;
        else
            string = 'Playlist matched:' + string.substring(0, string.length - GUParams.separator.length);
        GU.sendMsg(string);
    },
 'playPlaylist': function(message, playlistId)
    {
        // i know this is bad, but i dont care and you can't stop me... for now.
		if (playlistId == 'WritheM')
			Grooveshark.addPlaylistByID(89907476);
			GU.sendMsg('Loaded the regular rotation into queue. Happy listening!');
		else {
			GU.openSidePanel();
			var playlistToPlay = $('#sidebar-playlists-grid').find("[data-playlist-id='"+playlistId+"']");
			if (playlistToPlay == null)
			{
				playlistToPlay = $('#sidebar-subbed-playlists').find("[data-playlist-id='"+playlistId+"']");
				if (playlistToPlay == null)
				{
					GU.sendMsg('Cannot find playlist: ' + playlistId);
				}
			}
			else
			{
				//var playlistId = $(playlistToPlay).children(0).attr('data-playlist-id');
				Grooveshark.addPlaylistByID(playlistId);
				if(!message || message.length == 0 || typeof message === 'object')
					GU.sendMsg('Playlist \'' + $(playlistToPlay).find('.name').text() + '\' added to the queue.');
				else {
					GU.sendMsg(message);
					console.log(message);
				}
			}
		}
    },
 'playRandomSong': function()
    {
        playingRandom = true;
        var nextSong = allSongsId[Math.floor(Math.random() * allSongsId.length)];
        if (nextSong != undefined)
        {
            var nextSongIndex = lastPlayedSongs.indexOf(nextSong);
            var maxTry = 5;
            while (nextSongIndex != -1 && maxTry-- > 0)
            {
                var tmpSong = allSongsId[Math.floor(Math.random() * allSongsId.length)];
                if (tmpSong != undefined)
                {
                    var tmpIndex = lastPlayedSongs.indexOf(tmpSong);
                    if (tmpIndex < nextSongIndex)
                        nextSong = tmpSong;
                }
            }
            Grooveshark.addSongsByID([nextSong]);
        }
    },
 'skip': function()
    {
        Grooveshark.removeCurrentSongFromQueue();
    },
 'addToCollection': function()
    {
        Grooveshark.addCurrentSongToLibrary();
        GU.sendMsg('Song added to the favorite.');
    },
 'removeFromCollection': function()
    {
        var currSong = Grooveshark.getCurrentSongStatus().song
        GS.Services.API.userRemoveSongsFromLibrary(GS.getLoggedInUserID(), currSong.songID, currSong.albumID, currSong.artistID).then(function(){
            GU.sendMsg('Song removed from the favorite.');
        });
    },
 'deletePlayedSong': function()
    {
        var previousSong;
		var songChanged = false;
		var songName;
		var artistName;
        while (true)
        {
            previousSong = GS.Services.SWF.getCurrentQueue().previousSong;
            if (previousSong != null) {
				songName = previousSong.SongName;
				artistName = previousSong.ArtistName;
                GS.Services.SWF.removeSongs([previousSong.queueSongID]);
				songChanged = true;
			}
            else
                break;
        }
		
		if(songChanged){
			var _HOUR_ = new Date().getHours();
			for(var timeSlot in timeSlots)
			{
				var _TIMESLOT_ = timeSlots[timeSlot];
				if(_TIMESLOT_ && _TIMESLOT_.StartHour == _HOUR_ && currentTimeslot != _TIMESLOT_)
				{
					GU.setTimeslot(_TIMESLOT_);
				}
			}

			if(records.SongRecords.UpvoteCount < upvoteCounter) {
				records.SongRecords.MostUpvoted = songName + " by " + artistName;
				records.SongRecords.UpvoteCount = currentUpvotes;
				localStorage.setItem("GS_BC_RECORDS", JSON.stringify(records));
			}

			if(records.SongRecords.DownvoteCount < downvoteCounter) {
				records.SongRecords.MostDownvoted = songName + " by " + artistName;
				records.SongRecords.DownvoteCount = currentDownvotes;
				localStorage.setItem("GS_BC_RECORDS", JSON.stringify(records));
			}
			//console.log(records);
		}
    },
 'removeNextSong': function()
    {
        var nextSong = GS.Services.SWF.getCurrentQueue().nextSong;
        if (nextSong != null)
        {
            GS.Services.SWF.removeSongs([nextSong.queueSongID]);
        }
    },
 'removeLastSong': function(message, numberStr)
    {
        var songs = GS.Services.SWF.getCurrentQueue().songs;
        var allID = [];
        var number = Math.floor(Number(numberStr));
        if (isNaN(number) || number < 1)
            number = 1;
        while (--number >= 0)
        {
            if (songs.length - 1 - number >= 0)
            {
                var id = songs[songs.length - 1 - number].queueSongID;
                if (id != GS.Services.SWF.getCurrentQueue().activeSong.queueSongID)
                    allID.push(id);
            }
        }
        if (allID.length > 0)
        {
            GS.Services.SWF.removeSongs(allID);
        }
    },
 'getMatchedSongsList': function(stringFilter)
    {
        var regex = RegExp(stringFilter, 'i');
        var songs = GU.getPlaylistNextSongs();
        var listToRemove = [];
        songs.forEach(function(element){
            if (regex.test(element.AlbumName) ||
                // regex.test(element.ArtistName) ||
                regex.test(element.SongName))
                listToRemove.push(element);
        });
        return listToRemove;
    },
 'previewRemoveByName': function(message, stringFilter)
    {
        var listToRemove = GU.getMatchedSongsList(stringFilter);
        if (listToRemove.length > 10 || listToRemove.length == 0)
            GU.sendMsg('' + listToRemove.length + 'Songs matched.');
        else
        {
            var string = 'Song matched: ';
            listToRemove.forEach(function(element) {
                string = string + element.SongName + ' ~ From: ' + element.AlbumName + GUParams.separator;
            });
            GU.sendMsg(string.substring(0, string.length - GUParams.separator.length));            
        }
    },
 'removeByName': function(message, stringFilter)
    {
        var listToRemove = GU.getMatchedSongsList(stringFilter);
        var idToRemove = [];
        listToRemove.forEach(function (element){
            idToRemove.push(element.queueSongID);
        });
        GS.Services.SWF.removeSongs(idToRemove);
        GU.sendMsg('Removed ' + idToRemove.length + ' songs.');
    },
 'fetchByName': function(message, stringFilter)
    {
        var songToPlay = GU.getMatchedSongsList(stringFilter);
        if (songToPlay.length > 0)
            GS.Services.SWF.moveSongsTo([songToPlay[0].queueSongID], 1, true);
    },
 'fetchLast': function(message, stringFilter)
    {
        var songList = GS.Services.SWF.getCurrentQueue().songs;
        if (songList.length > 2)
            GS.Services.SWF.moveSongsTo([songList[songList.length - 1].queueSongID], 1, true);
    },
 'shuffle': function()
    {
        $('.shuffle').click();
        GU.sendMsg('The queue has been shuffled!');
    },
 'isGuesting': function(userid)
    {
        return GS.getCurrentBroadcast().attributes.vipUsers.some(function(elem){return elem.userID == userid;});
    },
 'guestCheck': function(userid)
    {
        if (!GU.isGuesting(userid))
        {
            GU.sendMsg('Only Guests can use that feature, sorry!');
            return false;        
        }
        return true;    
    },
 'inListCheck': function(userid, list)
    {
        return list.split(',').indexOf("" + userid) != -1;
    },
 'followerCheck': function(userid)
    {
        return followingList.indexOf(userid) != -1;
    },
 'strictWhiteListCheck': function(userid)
    {
        if (GU.inListCheck(userid, GUParams.whitelist))
            return true;
        GU.sendMsg('Only user that are explicitly in the whitelist can use this feature, sorry!');
        return false;
    },
 'whiteListCheck': function(userid)
    {
        if (GU.inListCheck(userid, GUParams.whitelist)) // user in whitelist
        {
            return true;
        }
        else if (GUParams.whitelistIncludesFollowing.toString() === 'true' && !GU.inListCheck(userid, GUParams.blacklist) && GU.followerCheck(userid))
        {
            return true;
        }
        GU.sendMsg('Only ' + GUParams.whiteListName + ' can use that feature, sorry!');        
        return false;
    },
 'guestOrWhite': function(userid)
    {
        return (GU.isGuesting(userid) || GU.whiteListCheck(userid));
    },
 'ownerCheck': function(userid)
    {
        if (userid != GS.getCurrentBroadcast().attributes.UserID)
        {
            GU.sendMsg('Only the Master can use that feature, sorry!');
            return false;
        }
        return true;    
    },
 'doParseMessage': function(current)
    {
        var string = current.data;
        var regexp = RegExp('^/([a-zA-Z]*)([ ]+([a-zA-Z0-9 ]+))?$');
        var regResult = regexp.exec(string);
        if (regResult != null)
        {
            var currentAction = actionTable[regResult[1]];
            if (currentAction instanceof Array && currentAction[0].every(function(element){return element(current.userID);}))
                currentAction[1](current, regResult[3]);
        }
    },
 'forcePlay': function()
    {
        if (Grooveshark.getCurrentSongStatus().status != 'playing')
        {
            GU.queueChange(); // if we are not playing, we should check to add songs to the queue...
            if (new Date() - lastPlay > 4000 && !forcePlay)
            {
                forcePlay = true;
                Grooveshark.play();
            }
            if (new Date() - lastPlay > 8000)
            {
                Grooveshark.removeCurrentSongFromQueue();
                forcePlay = false;
                lastPlay = new Date();
            }
        }
        else
        {
            forcePlay = false;
            lastPlay = new Date();
        }
    },
 'addSongToHistory': function()
    {
        if (Grooveshark.getCurrentSongStatus().song == null)
            return;
        var currSongID = Grooveshark.getCurrentSongStatus().song.songID;
        if (lastPlayedSongs.length == 0 || lastPlayedSongs[lastPlayedSongs.length - 1] != currSongID)
        {
            var posToRemove = lastPlayedSongs.indexOf(currSongID);
            // Remove the song in the list
            if (posToRemove != -1)
                lastPlayedSongs.splice(posToRemove, 1);
            lastPlayedSongs.push(currSongID);
            // Remove the oldest song in the list if it goes over the limit.
            if (GUParams.historyLength < lastPlayedSongs.length)
                lastPlayedSongs.shift();
        }
    },
 'queueChange': function()
    {
		votelock = true;
        if (songleft != GU.songInQueue())
        {
            songleft = GU.songInQueue();
            if (songleft >= 2)
                playingRandom = false;
            GU.renameBroadcast();
        }
        GU.addSongToHistory();
        if (songleft < 1)
            GU.playRandomSong();
			
        GU.deletePlayedSong();
    },
 'callback': function()
    {
        GU.forcePlay();
    },
 'guest': function(current)
    {
        var userID = current.userID;
        
        if (GS.getCurrentBroadcast().getPermissionsForUserID(userID) != undefined) // is guest
            GS.Services.SWF.broadcastRemoveVIPUser(userID);
        else
            GS.Services.SWF.broadcastAddVIPUser(userID,0,GUParams.whitelistLevel); // 63 seems to be the permission mask
    },
 'makeGuest': function(current, guestID)
    {
        guestID = Number(guestID);
        if (!isNaN(guestID))
            GS.Services.SWF.broadcastAddVIPUser(guestID,0,GUParams.whitelistLevel); // 63 seems to be the permission mask
    },
 'unguestAll': function()
    {
        GS.getCurrentBroadcast().attributes.vipUsers.forEach(function(guest) {
            GS.Services.SWF.broadcastRemoveVIPUser(guest.userID);
        });
    },
 'ping': function(current)
    {
	   //console.log(current);
        var userName = $(".user-name[data-user-id='"+current.userID+"']")[0].innerText;

        GU.sendMsg('Pong! Oh, and '+userName+'\'s user ID is ' + current.userID + '!');
    },
 'about': function()
    {
        GU.sendMsg('This broadcast is currently running "WritheM\'s Broadcast Bot" v' + GUParams.version + ', which is open source! Got a feature or code fix? Submit it to our open repository via pull request at https://github.com/WritheM/GS-Broadcast-Bot');
    },
 'help': function(message, parameter)
    {
		var userid = message.userID;
        if (parameter != undefined)
        {
            var currentAction = actionTable[parameter];
            if (currentAction instanceof Array)
            {
                GU.sendMsg('Help: /' + parameter + ' ' + currentAction[2]);
                return;
            }
        }
        var helpMsg = 'Command available:';
		var isHost = (GU.inListCheck(userid, GUParams.whitelist));
        Object.keys(actionTable).forEach(function (actionName) {
			if(actionTable[actionName][0].length > 1 && isHost)
				helpMsg = helpMsg + ' ' + actionName;
			else if(actionTable[actionName][0].length < 2)
				helpMsg = helpMsg + ' ' + actionName;
        });
        helpMsg = helpMsg + '. Type /help [command name] for in depth help.';
        GU.sendMsg(helpMsg);
    },
 'startBroadcasting': function(bc)
    {
        var properties = { 'Description': bc.Description, 'Name': bc.Name, 'Tag': bc.Tag };
        if (GS.getCurrentBroadcast() === false) {
			console.log("Creating broadcast");
            GS.Services.SWF.startBroadcast(properties);
            setTimeout(GU.startBroadcasting, 3000, bc);
            return;
        }
		else if (GS.isBroadcaster() === false)
		{
			console.log("Taking over broadcast");
			GS.Services.takeOverBroadcast(bc.BroadcastID);
			GS.Services.SWF.startBroadcast(properties);
            setTimeout(GU.startBroadcasting, 3000, bc);
            return;
		}
        GU.renameBroadcast();
        setTimeout(function() {
            GU.sendMsg(GUParams.welcomeMessage);
        }, 1000);
        // Remove all the messages in chat
        //GU.removeMsg();
        GU.openSidePanel();
        GS.Services.API.userGetSongIDsInLibrary().then(function (result){
            allSongsId = result.SongIDs;
        });
        if ($('#lightbox-close').length == 1)
        {
            $('#lightbox-close').click();
        }
        lastPlay = new Date();
        // Check if there are msg in the chat, and process them.
        setInterval(GU.callback, 1000);

        // Overload handlechat
        var handleBroadcastSaved = GS.Services.SWF.handleBroadcastChat;
        GS.Services.SWF.handleBroadcastChat = function(e, t){handleBroadcastSaved(e,t);GU.doParseMessage(t);};
        var handleQueueChange = GS.Services.SWF.queueChange;
        GS.Services.SWF.queueChange = function(e){handleQueueChange(e);GU.queueChange();};
    },
 'updateFollowing': function()
    {
        GS.Services.API.userGetFollowersFollowing().then(
            function(alluser)
            {
                followingList = [];
                alluser.forEach(function(single)
                {
                    if (single.IsFavorite === '1')
                    {
                        followingList.push(parseInt(single.UserID));
                    }
                });
            });
    },
 'broadcast': function()
    {
        if (GS.getLoggedInUserID() <= 0)
            alert('Cannot login!');
        else
        {
            GU.updateFollowing();
            GS.Services.API.getUserLastBroadcast().then(function(bc) {
                GS.Services.SWF.ready.then(function()
                {
                    GS.Services.SWF.joinBroadcast(bc.BroadcastID);
                    setTimeout(GU.startBroadcasting, 4000, bc);
                });
            });
        }
    },
  'rollDice': function(current)
	{
		console.log(current);
		var numDice = 1;
		var typeDie = 100;
		var diceArray = current.data.substr(6).split('d');
		var capped = false;
		//console.log(diceArray);
		if(diceArray && diceArray.length > 1){
			if(!isNaN(diceArray[0])) numDice = diceArray[0];
			if(!isNaN(diceArray[1])) typeDie = diceArray[1];
			if(typeDie > 1000) {
				typeDie = 1000;
				capped = true;
			}
			if(numDice > 1000) {
				numDice = 1000;
				capped = true;
			}
			
		}
		
		if(capped) 
		{
			GU.sendMsg("Dice Rolls capped to 1000d1000");
		} else {
			var diceRoll = 0; 
			for(var i = 0; i < numDice; i++)
			{
				diceRoll += Math.floor((Math.random()*typeDie)+1);
			}
			
			var userName = $(".user-name[data-user-id='"+current.userID+"']")[0].innerText;
			GU.sendMsg(userName+" rolled a "+diceRoll+".");
		}
	},
  'wolframAlpha': function(current)
	{
		console.log(current);
		var msg = current.data.substr(3);
		$.post(GUParams.WolframPHPUrl+encodeURIComponent(msg),function( data ) {
			GU.sendMsg(data);
		});
	},
  'showRecords': function(current)
	{
		GU.sendMsg("Current Records are: ");
		GU.sendMsg("Peak Audience: "+records.ListenerCount);
		GU.sendMsg("Most Upvoted Song: "+records.SongRecords.MostUpvoted+" ("+records.SongRecords.UpvoteCount+")");
		GU.sendMsg("Most Downvoted Song: "+records.SongRecords.MostDownvoted+" ("+records.SongRecords.DownvoteCount+")");
    },
   'startContest': function(current)
	{
		var userID = current.userID;
        
        if (GS.getCurrentBroadcast().getPermissionsForUserID(userID) != undefined) // is guest
		{
			GU.sendMsg("Please Type /ballot to join the Contest!");
			contestStatus = true;
			contestUsers = [];
		} else {
			GU.sendMsg("You do not have permission to do this.");
		}

	},
   'endContest': function(current)
	{
		var userID = current.userID;
        
        if (GS.getCurrentBroadcast().getPermissionsForUserID(userID) != undefined) // is guest
		{			
			var contestWinner = contestUsers[Math.floor(Math.random()*contestUsers.length)];
			//console.log(contestWinner);
			contestWinner = $(".user-name[data-user-id='"+contestWinner+"']")[0].innerText;
			GU.sendMsg("Drumroll please...");
			setTimeout(function(){
				GU.sendMsg("...And the winner is "+contestWinner+"! Congratulations!");
			}, 4000);
			contestStatus = false;
		} else {
			GU.sendMsg("You do not have permission to do this.");
		}
	},
   'ballot': function(current)
   {
		if(contestStatus){
			var userID = current.userID;
        
			if (GS.getCurrentBroadcast().getPermissionsForUserID(userID) != undefined) // is guest
			{
				GU.sendMsg("There are currently "+contestUsers.length+" entries in the current contest. Type /ballot to enter too!");
			} else {
				if(contestUsers.indexOf(userID) == -1) contestUsers.push(userID);
				console.log(contestUsers);
			}
		} else {
			GU.sendMsg("There is no contest running currently.");
		}
   },
   'setShoutout': function(current)
   {
		var msg = current.data.substr(12);
		GUParams.ShoutOutMessage = msg;
		GU.sendMsg("Shoutout set to: '"+msg+"'");
   }
};

var clearIntv = setInterval(function(){
	var listenerCount = $("#listener-count");
	var downvoteCount = $(".downvotes");
	var upvoteCount = $(".upvotes");
	if(listenerCount.length && upvoteCount.length && downvoteCount.length){
		listenerCount.bind("DOMSubtreeModified", function() {
			var currentCount = parseInt(this.innerText);
			
			if(records.ListenerCount < currentCount){
				records.ListenerCount = currentCount;			
				localStorage.setItem("GS_BC_RECORDS", JSON.stringify(records));
			}
		});
		
		upvoteCount.bind("DOMSubtreeModified", function() {
			if(!votelock)
				upvoteCounter = parseInt(this.innerText);
		});
		
		downvoteCount.bind("DOMSubtreeModified", function() {
			if(!votelock)
				downvoteCounter = parseInt(this.innerText);
		});
		clearInterval(clearIntv);
	}
}, 1000);


actionTable = {
    'help':                 [[GU.inBroadcast],                          GU.help,                 '- Display this help.'],
    'ping':                 [[GU.inBroadcast],                          GU.ping,                 '- Ping the BOT, also prints your USERID.'],
    'addToCollection':      [[GU.inBroadcast, GU.strictWhiteListCheck], GU.addToCollection,      '- Add this song to the collection.'],
    'removeFromCollection': [[GU.inBroadcast, GU.strictWhiteListCheck], GU.removeFromCollection, '- Remove this song from the collection.'],
    'removeNext':           [[GU.inBroadcast, GU.guestCheck],           GU.removeNextSong,       '- Remove the next song in the queue.'],
    'removeLast':           [[GU.inBroadcast, GU.guestCheck],           GU.removeLastSong,       '[NUMBER] - Remove the last song of the queue.'],
    'fetchByName':          [[GU.inBroadcast, GU.guestCheck],           GU.fetchByName,          '[FILTER] - Place the first song of the queue that matches FILTER at the beginning of the queue.'],
    'fetchLast':            [[GU.inBroadcast, GU.guestCheck],           GU.fetchLast,            '- Bring the last song at the beginning of the queue.'],
    'previewRemoveByName':  [[GU.inBroadcast, GU.guestCheck],           GU.previewRemoveByName,  '[FILTER] - Get the list of songs that will be remove when calling \'removeByName\' with the same FILTER.'],
    'removeByName':         [[GU.inBroadcast, GU.guestCheck],           GU.removeByName,         '[FILTER] - Remove all songs that matches the filter. If the filter if empty, remove everything. Use the \'previewRemoveByName\' first.'],
    'showPlaylist':         [[GU.inBroadcast, GU.guestCheck],           GU.showPlaylist,         '[FILTER] - Get the ID of a particular playlist.'],
    'playPlaylist':         [[GU.inBroadcast, GU.guestCheck],           GU.playPlaylist,         'PLAYLISTID - Play the playlist from the ID given by \'showPlaylist\'.'],
    'skip':                 [[GU.inBroadcast, GU.guestCheck],           GU.skip,                 '- Skip the current song.'],
    'shuffle':              [[GU.inBroadcast, GU.guestCheck],           GU.shuffle,              '- Shuffle the current queue.'],
    'peek':                 [[GU.inBroadcast, GU.guestOrWhite],         GU.previewSongs,         '[NUMBER] - Preview the songs that are in the queue.'],
    'guest':                [[GU.inBroadcast, GU.guestOrWhite],         GU.guest,                '- Toogle your guest status.'],
    'makeGuest':            [[GU.inBroadcast, GU.strictWhiteListCheck], GU.makeGuest,            'USERID - Force-guest a user with its ID.'],
    'unguestAll':           [[GU.inBroadcast, GU.strictWhiteListCheck], GU.unguestAll,           '- Unguest everyone.'],
    'about':                [[GU.inBroadcast],                          GU.about,                '- About this software.'],
	'roll':                 [[GU.inBroadcast],                          GU.rollDice,             '- Roll a d100.'],
	'wa':                   [[GU.inBroadcast],                          GU.wolframAlpha,         '- Ask Wolfram|Alpha a question.'],
	'records':              [[GU.inBroadcast],                          GU.showRecords,          '- shows the Broadcasts Record Information'],
	'startContest':			[[GU.inBroadcast, GU.guestOrWhite],			GU.startContest,		 '- starts a Contest'], 
	'ballot':				[[GU.inBroadcast],							GU.ballot,		 		 '- enter yourself into a currently running contest'], 
	'endContest':			[[GU.inBroadcast, GU.guestOrWhite],			GU.endContest,		 	 '- ends a Contest'],
    'setShoutout':          [[GU.inBroadcast, GU.guestOrWhite],         GU.setShoutout,          '- sets the Shoutout for the Broadcast'] 	
};

(function()
{
    var callback_start = function()
    {
        onbeforeunload = null;
        if (GUParams.userReq != '' && GUParams.passReq != '')
        {
            GS.Services.API.logoutUser().then(function(){
                GS.Services.API.authenticateUser(GUParams.userReq, GUParams.passReq).then(function(user) { window.location = "http://broadcast-nologin/";});
            });
        }
        else
            GU.broadcast();
    }
    var init_check = function ()
    {
		var success = true;
        try {
            GS.ready.done(callback_start);
        } catch(e) {
            setTimeout(init_check, 100);
			success = false;
        }
		records = localStorage.getItem("GS_BC_RECORDS") != undefined ? JSON.parse(localStorage.getItem("GS_BC_RECORDS")) : records;
		timeSlots = JSON.parse(GUParams.Timeslot_Array) != undefined ? JSON.parse(GUParams.Timeslot_Array) : timeSlots;
		
		if(success){
			var shoutOutInterval = ((GUParams.ShoutOutInterval*1000)*60);		
			setInterval(function() {
				var shoutOutMessage = GUParams.ShoutOutMessage;
				if(shoutOutMessage && shoutOutMessage.trim().length)
					GU.sendMsg(shoutOutMessage);
			}, shoutOutInterval);
		}
    }
    init_check();
})()