var botFunctions = require("../bot_functions.js");

var defaultModuleConfig = {
	"STREAM_SHOUTOUT_CHANNEL": "",
	"STREAMER_ROLE": "",
	"SHOUTOUT_NEEDS_ROLE": 1,
};


function presenceHandler(bot, server, oldUser, newUser) {
	if (oldUser.game != newUser.game) {
		console.log(newUser.name);

		if (oldUser.game) {
			console.log("Old");

			for (var key in oldUser.game) {
				console.log(key + ": " + oldUser.game[key]);
			}
		}

		if (newUser.game) {
			console.log("New");

			for (var key in newUser.game) {
				console.log(key + ": " + newUser.game[key]);
			}
		}
	}

	return false;
}

var commands = {
	"getStreamShoutoutChannel": {
		help: "Get the current stream shoutout channel.",
		process: function(args, bot, msg) {
		},
		permissions: [
			"administrator"
		]
	},
	"setStreamShoutoutChannel": {
		usage: "[channel]",
		help: "Set a channel, or none, for stream shoutouts.",
		process: function(args, bot, msg) {
		},
		permissions: [
			"administrator"
		]
	},
	"getStreamerRole": {
		help: "Get the current streamer role.",
		process: function(args, bot, msg) {
		},
		permissions: [
			"administrator"
		]
	},
	"setStreamerRole": {
		usage: "[role]",
		help: "Set a role, or none, as streamer role.",
		process: function(args, bot, msg) {
		},
		permissions: [
			"administrator"
		]
	},
	"getShoutoutNeedsRole": {
		help: "Check if a role is required to get a shoutout when starting a stream.",
		process: function(args, bot, msg) {
		},
		permissions: [
			"administrator"
		]
	},
	"setShoutoutNeedsRole": {
		usage: "<1|0>",
		help: "Set whether or not a role will be needed to get a shoutout when starting a stream.",
		process: function(args, bot, msg) {
		},
		permissions: [
			"administrator"
		]
	},
};

exports.defaultModuleConfig = defaultModuleConfig;
exports.onPresence = presenceHandler;
//exports.commands = commands;
