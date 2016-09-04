var botFunctions = require("../bot_functions.js");

const VERSION = "1.0";

var defaultModuleConfig = {
	"STREAM_SHOUTOUT_CHANNEL": "",
	"STREAMER_ROLE": "",
	"SHOUTOUT_NEEDS_ROLE": 1,
	"LIVE_ROLE": "",
};

var streamLists = botFunctions.readJSON("./streamLists.json");

if (!streamLists) {
	streamLists = {};
}

function updateStreamLists() {
	botFunctions.writeJSON(streamLists, "./streamLists.json");
}

function findStreamIndex(user, url) {
	if (!streamLists[user.id]) {
		return -1;
	}

	var userStreams = streamLists[user.id];

	for (var x=0; x<userStreams.length; x++) {
		console.log(userStreams[x].url + " =?= " + url);

		if (userStreams[x].url == url) {
			return x;
		}
	}

	return -1;
}

function streamSetLive(user, index, live) {
	if (!streamLists[user.id]) {
		return;
	}

	if (!streamLists[user.id][index]) {
		return;
	}

	streamLists[user.id][index].live = live;
	updateStreamLists();
}

function setLiveRole(bot, server, user) {
	function roleHandler(error) {
		if (error) {
			console.log("Cannot set live role for " + newUser.name + ": " + error);
		}
	}

	var liveRole = botFunctions.getConfigValue(server, "LIVE_ROLE");

	if (!liveRole) {
		return;
	}

	var serverRole = botFunctions.getRole(server, liveRole);

	if (!serverRole) {
		return;
	}

	if (bot.memberHasRole(user, serverRole)) {
		return;
	}

	bot.addMemberToRole(user, serverRole, roleHandler);
}

function unsetLiveRole(bot, server, user) {
	function roleHandler(error) {
		if (error) {
			console.log("Cannot unset live role for " + newUser.name + ": " + error);
		}
	}

	var liveRole = botFunctions.getConfigValue(server, "LIVE_ROLE");

	if (!liveRole) {
		return;
	}

	var serverRole = botFunctions.getRole(server, liveRole);

	if (!serverRole) {
		return;
	}

	if (!bot.memberHasRole(user, serverRole)) {
		return;
	}

	bot.removeMemberFromRole(user, serverRole, roleHandler);
}

function getShoutoutChannel(bot, server, user) {
	var streamShoutoutChannel = botFunctions.getConfigValue(server, "STREAM_SHOUTOUT_CHANNEL");

	if (!streamShoutoutChannel) {
		return null;
	}

	var serverChannel = botFunctions.getChannel(server, streamShoutoutChannel);

	if (!serverChannel) {
		return null;
	}

	var shoutoutNeedsRole = botFunctions.getConfigValue(server, "SHOUTOUT_NEEDS_ROLE");

	if (shoutoutNeedsRole == 1) {
		var streamerRole = botFunctions.getConfigValue(server, "STREAMER_ROLE");

		if (!streamerRole) {
			return null;
		}

		var serverRole = botFunctions.getRole(server, streamerRole);

		if (!serverRole) {
			return null;
		}

		if (!bot.memberHasRole(user, serverRole)) {
			return null;
		}
	}

	return serverChannel;
}

function presenceHandler(bot, server, oldUser, newUser) {
	/*if (oldUser.game && oldUser.game.type != 0) {
		console.log("Old");
		console.log(oldUser.game);
	}

	if (newUser.game && newUser.game.type != 0) {
		console.log("New");
		console.log(newUser.game);
	}*/

	var oldStreaming = 0;
	var newStreaming = 0;
	var live;
	var user;

	if (oldUser.game && oldUser.game.type > 0) {
		oldStreaming = 1;
		live = 0;
		user = oldUser;
	}

	if (newUser.game && newUser.game.type > 0) {
		newStreaming = 1;
		live = 1;
		user = newUser;
	}

	if (oldStreaming == newStreaming) {
		return false;
	}

	if (live == 1) {
		setLiveRole(bot, server, user);
	} else {
		unsetLiveRole(bot, server, user);
	}

	if (user.game.url) {
		var streamIndex = findStreamIndex(user, user.game.url);

		if (streamIndex > -1) {
			streamSetLive(user, streamIndex, live);
		}
	}

	var streamShoutoutChannel = getShoutoutChannel(bot, server, user);

	if (!streamShoutoutChannel) {
		return false;
	}

	//var output = user.mention() + " has ";
	var output = user.name + " has ";

	if (live == 1) {
		output += "started streaming";
	} else {
		output += "stopped streaming";
	}

	if (user.game.name) {
		output += " " + user.game.name;
	}

	if (live == 1 && user.game.url) {
		output += " at <" + user.game.url + ">";
	}
	
	output += ".";

	botFunctions.sendMessage(bot, streamShoutoutChannel, output);
	return false;
}

var commands = {
	"getStreamShoutoutChannel": {
		help: "Get the current stream shoutout channel.",
		process: function(args, bot, msg) {
			var streamShoutoutChannel = botFunctions.getConfigValue(msg.server, "STREAM_SHOUTOUT_CHANNEL");

			if (!streamShoutoutChannel) {
				botFunctions.sendMessage(bot, msg.channel, "No stream shoutout channel has been set.");
				return;
			}

			var channel = botFunctions.getChannel(msg.server, streamShoutoutChannel);

			if (!channel) {
				botFunctions.sendMessage(bot, msg.channel, "A channel is set, but it does not exist on this server.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The stream shoutout channel is: " + channel.name);
		},
		permissions: [
			"administrator"
		]
	},
	"setStreamShoutoutChannel": {
		usage: "[channel]",
		help: "Set a channel, or none, for stream shoutouts.",
		process: function(args, bot, msg) {
			var channel = botFunctions.compileArgs(args);

			if (!channel) {
				if (!botFunctions.setConfigValue(msg.server, "STREAM_SHOUTOUT_CHANNEL", "")) {
					botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
					return;
				}

				botFunctions.sendMessage(bot, msg.channel, "The stream shoutout channel has been cleared.");
				return;
			}

			var serverChannel = botFunctions.getChannelByName(msg.server, channel);

			if (!serverChannel) {
				botFunctions.sendMessage(bot, msg.channel, "Cannot find the channel " + channel);
				return;
			}

			if (!botFunctions.setConfigValue(msg.server, "STREAM_SHOUTOUT_CHANNEL", serverChannel.id)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The stream shoutout channel has been set to " + serverChannel.name);
		},
		permissions: [
			"administrator"
		]
	},
	"getStreamerRole": {
		help: "Get the current streamer role.",
		process: function(args, bot, msg) {
			var streamerRole = botFunctions.getConfigValue(msg.server, "STREAMER_ROLE");

			if (!streamerRole) {
				botFunctions.sendMessage(bot, msg.channel, "No streamer role has been set.");
				return;
			}

			var role = botFunctions.getRole(msg.server, streamerRole);

			if (!role) {
				botFunctions.sendMessage(bot, msg.channel, "A role is set, but it does not exist on this server.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The streamer role is: " + role.name);
		},
		permissions: [
			"administrator"
		]
	},
	"setStreamerRole": {
		usage: "[role]",
		help: "Set a role, or none, as streamer role.",
		process: function(args, bot, msg) {
			var role = botFunctions.compileArgs(args);

			if (!role) {
				if (!botFunctions.setConfigValue(msg.server, "STREAMER_ROLE", "")) {
					botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
					return;
				}

				botFunctions.sendMessage(bot, msg.channel, "The streamer role has been cleared.");
				return;
			}

			var serverRole = botFunctions.getRoleByName(msg.server, role);

			if (!serverRole) {
				botFunctions.sendMessage(bot, msg.channel, "Cannot find the role " + role);
				return;
			}

			if (!botFunctions.setConfigValue(msg.server, "STREAMER_ROLE", serverRole.id)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The streamer role has been set to: " + serverRole.name);
		},
		permissions: [
			"administrator"
		]
	},
	"getShoutoutNeedsRole": {
		help: "Check if a role is required to get a shoutout when starting a stream.",
		process: function(args, bot, msg) {
			var shoutoutNeedsRole = botFunctions.getConfigValue(msg.server, "SHOUTOUT_NEEDS_ROLE");

			if (shoutoutNeedsRole == 0) {
				botFunctions.sendMessage(bot, msg.channel, "Shoutouts do not require a role.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "Shoutouts do require a role to be set.");
		},
		permissions: [
			"administrator"
		]
	},
	"setShoutoutNeedsRole": {
		usage: "<1|0>",
		help: "Set whether or not a role will be needed to get a shoutout when starting a stream.",
		process: function(args, bot, msg) {
			var shoutoutNeedsRole = Number(botFunctions.compileArgs(args));

			if (shoutoutNeedsRole != 0 && shoutoutNeedsRole != 1) {
				botFunctions.sendMessage(bot, msg.channel, "Invalid value.");
				return;
			}

			if (!botFunctions.setConfigValue(msg.server, "SHOUTOUT_NEEDS_ROLE", shoutoutNeedsRole)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			if (shoutoutNeedsRole == 0) {
				botFunctions.sendMessage(bot, msg.channel, "Shoutouts no longer require a role.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "Shoutouts will now require a role to be set.");
		},
		permissions: [
			"administrator"
		]
	},
	"getLiveRole": {
		help: "Get the role given to people who are live on stream.",
		process: function(args, bot, msg) {
			var liveRole = botFunctions.getConfigValue(msg.server, "LIVE_ROLE");

			if (!liveRole) {
				botFunctions.sendMessage(bot, msg.channel, "No live role has been set.");
				return;
			}

			var role = botFunctions.getRole(msg.server, liveRole);

			if (!role) {
				botFunctions.sendMessage(bot, msg.channel, "A role is set, but it does not exist on this server.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The live role is: " + role.name);
		},
		permissions: [
			"administrator"
		]
	},
	"setLiveRole": {
		usage: "[role]",
		help: "Set a role, or none, as the role given to people who are live on stream.",
		process: function(args, bot, msg) {
			var role = botFunctions.compileArgs(args);

			if (!role) {
				if (!botFunctions.setConfigValue(msg.server, "LIVE_ROLE", "")) {
					botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
					return;
				}

				botFunctions.sendMessage(bot, msg.channel, "The live role has been cleared.");
				return;
			}

			var serverRole = botFunctions.getRoleByName(msg.server, role);

			if (!serverRole) {
				botFunctions.sendMessage(bot, msg.channel, "Cannot find the role " + role);
				return;
			}

			if (!botFunctions.setConfigValue(msg.server, "LIVE_ROLE", serverRole.id)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The live role has been set to: " + serverRole.name);
		},
		permissions: [
			"administrator"
		]
	},
	"getStreams": {
		usage: "[user]",
		help: "List your, or the given user's registered stream URLs.",
		process: function(args, bot, msg) {
			var user = botFunctions.compileArgs(args);
			var serverUser = msg.author;

			if (user) {
				serverUser = botFunctions.getUserByName(msg.server, user);

				if (!serverUser) {
					botFunctions.sendMessage(bot, msg.channel, "Cannot find the user " + user);
					return;
				}
			}

			if (!streamLists[serverUser.id]) {
				botFunctions.sendMessage(bot, msg.channel, serverUser.name + " has not registered any stream URLs.");
				return;
			}

			var userStreams = streamLists[serverUser.id];

			if (userStreams.length == 0) {
				botFunctions.sendMessage(bot, msg.channel, serverUser.name + " has not registered any stream URLs.");
				return;
			}

			var output = serverUser.name + " has registered the following stream URLs:\n";

			for (var x=0; x<userStreams.length; x++) {
				if (serverUser.id == msg.author.id) {
					output += "\t" + (x+1);
				}

				output += "\t<" + userStreams[x].url + ">";

				if (userStreams[x].live == 1) {
					output += "\tLive Now!";
				}

				output += "\n";
			}

			botFunctions.sendMessage(bot, msg.channel, output);
		}
	},
	"addStream": {
		usage: "<url>",
		help: "Add a stream URL to your stream list.",
		process: function(args, bot, msg) {
			var streamUrl = botFunctions.compileArgs(args);

			if (!streamUrl) {
				botFunctions.sendMessage(bot, msg.channel, "You need to specify a URL in order to register it.");
				return;
			}

			if (streamUrl.startsWith("<")) {
				streamUrl = streamUrl.substr(1);
			}

			if (streamUrl.endsWith(">")) {
				streamUrl = streamUrl.substr(0, streamUrl.length-1);
			}

			if (!streamUrl) {
				botFunctions.sendMessage(bot, msg.channel, "You need to specify a URL in order to register it.");
				return;
			}

			if (!streamLists[msg.author.id]) {
				streamLists[msg.author.id] = [];
			}

			var stream = {
				url: streamUrl,
				live: 0,
			};

			streamLists[msg.author.id].push(stream);
			updateStreamLists();
			botFunctions.sendMessage(bot, msg.channel, "Stream URL added to your stream list.");
		}
	},
	"removeStream": {
		usage: "<streamId>",
		help: "Remove the given stream URL from your stream list.",
		process: function(args, bot, msg) {
			var streamId = Number(botFunctions.compileArgs(args));

			if (!streamId) {
				botFunctions.sendMessage(bot, msg.channel, "You need to supply a valid stream id.");
				return;
			}

			if (!streamLists[msg.author.id]) {
				botFunctions.sendMessage(bot, msg.channel, "You have not registered any streams.");
				return;
			}

			if (!streamLists[msg.author.id][(streamId-1)]) {
				botFunctions.sendMessage(bot, msg.channel, "Cannot find stream id " + streamId);
				return;
			}

			streamLists[msg.author.id].splice(streamId-1, 1);
			updateStreamLists();
			botFunctions.sendMessage(bot, msg.channel, "The stream has been removed.");
		}
	},
	"startStream": {
		usage: "<streamId>",
		help: "Start the given stream.",
		process: function(args, bot, msg) {
			var streamId = Number(botFunctions.compileArgs(args));

			if (!streamId) {
				botFunctions.sendMessage(bot, msg.channel, "You need to supply a valid stream id.");
				return;
			}

			if (!streamLists[msg.author.id]) {
				botFunctions.sendMessage(bot, msg.channel, "You have not registered any streams.");
				return;
			}

			if (!streamLists[msg.author.id][(streamId-1)]) {
				botFunctions.sendMessage(bot, msg.channel, "Cannot find stream id " + streamId);
				return;
			}

			if (streamLists[msg.author.id][(streamId-1)].live == 1) {
				botFunctions.sendMessage(bot, msg.channel, "Your stream is running already.");
				return;
			}

			streamSetLive(msg.author, streamId-1, 1);
			botFunctions.sendMessage(bot, msg.channel, "Your stream has been started.");
			setLiveRole(bot, msg.server, msg.author);

			var streamShoutoutChannel = getShoutoutChannel(bot, msg.server, msg.author);

			if (!streamShoutoutChannel) {
				return;
			}

			var output = msg.author.name + " has started streaming at <" + streamLists[msg.author.id][(streamId-1)].url + ">.";
			botFunctions.sendMessage(bot, streamShoutoutChannel, output);
		}
	},
	"stopStream": {
		usage: "<streamId>",
		help: "Stop the given stream.",
		process: function(args, bot, msg) {
			function roleHandler(error) {
				if (error) {
					console.log("Cannot auto-assign role to " + msg.author.name + ": " + error);
				}
			}

			var streamId = Number(botFunctions.compileArgs(args));

			if (!streamId) {
				botFunctions.sendMessage(bot, msg.channel, "You need to supply a valid stream id.");
				return;
			}

			if (!streamLists[msg.author.id]) {
				botFunctions.sendMessage(bot, msg.channel, "You have not registered any streams.");
				return;
			}

			if (!streamLists[msg.author.id][(streamId-1)]) {
				botFunctions.sendMessage(bot, msg.channel, "Cannot find stream id " + streamId);
				return;
			}

			if (streamLists[msg.author.id][(streamId-1)].live == 0) {
				botFunctions.sendMessage(bot, msg.channel, "Your stream is currently not running.");
				return;
			}

			streamSetLive(msg.author, streamId-1, 0);
			botFunctions.sendMessage(bot, msg.channel, "Your stream has been stopped.");
			unsetLiveRole(bot, msg.server, msg.author);

			var streamShoutoutChannel = getShoutoutChannel(bot, msg.server, msg.author);

			if (!streamShoutoutChannel) {
				return;
			}

			var output = msg.author.name + " has stopped streaming.";
			botFunctions.sendMessage(bot, streamShoutoutChannel, output);
		}
	},
};

exports.VERSION = VERSION;
exports.defaultModuleConfig = defaultModuleConfig;
exports.onPresence = presenceHandler;
exports.commands = commands;
