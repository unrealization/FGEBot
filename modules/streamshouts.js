var botFunctions = require("../bot_functions.js");

var defaultModuleConfig = {
	"STREAM_SHOUTOUT_CHANNEL": "",
	"STREAMER_ROLE": "",
	"SHOUTOUT_NEEDS_ROLE": 1,
	"LIVE_ROLE": "",
};


function presenceHandler(bot, server, oldUser, newUser) {
	function roleHandler(error) {
		if (error) {
			console.log("Cannot auto-assign role to " + newUser.name + ": " + error);
		}
	}

	/*if (oldUser.game && oldUser.game.type != 0) {
		console.log("Old");
		console.log(oldUser.game);
	}

	if (newUser.game && newUser.game.type != 0) {
		console.log("New");
		console.log(newUser.game);
	}*/

	var streamShoutoutChannel = botFunctions.getConfigValue(server, "STREAM_SHOUTOUT_CHANNEL");

	if (!streamShoutoutChannel) {
		return false;
	}

	var serverChannel = botFunctions.getChannel(server, streamShoutoutChannel);

	if (!serverChannel) {
		return false;
	}

	var shoutoutNeedsRole = botFunctions.getConfigValue(server, "SHOUTOUT_NEEDS_ROLE");

	if (shoutoutNeedsRole == 1) {
		var streamerRole = botFunctions.getConfigValue(server, "STREAMER_ROLE");

		if (!streamerRole) {
			return false;
		}

		var serverRole = botFunctions.getRole(server, streamerRole);

		if (!serverRole) {
			return false;
		}

		if (!bot.memberHasRole(newUser, serverRole)) {
			return false;
		}
	}

	var oldStreaming = 0;
	var newStreaming = 0;

	if (oldUser.game && oldUser.game.type > 0) {
		oldStreaming = 1;
	}

	if (newUser.game && newUser.game.type > 0) {
		newStreaming = 1;
	}

	if (oldStreaming != newStreaming) {
		var liveRole = botFunctions.getConfigValue(server, "LIVE_ROLE");
		var serverLiveRole;

		if (liveRole) {
			serverLiveRole = botFunctions.getRole(server, liveRole);
		}

		//var output = newUser.mention() + " has ";
		var output = newUser.name + " has ";

		if (oldStreaming == 1) {
			output += "stopped streaming " + oldUser.game.name + ".";

			if (serverLiveRole && bot.memberHasRole(newUser, serverLiveRole)) {
				bot.removeMemberFromRole(newUser, serverLiveRole, roleHandler);
			}
		}

		if (newStreaming == 1) {
			output += "started streaming " + newUser.game.name;

			if (newUser.game.url) {
				output += " at <" + newUser.game.url + ">";
			}

			output += ".";

			if (serverLiveRole && !bot.memberHasRole(newUser, serverLiveRole)) {
				bot.addMemberToRole(newUser, serverLiveRole, roleHandler);
			}
		}

		botFunctions.sendMessage(bot, serverChannel, output);
	}

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
	/*"getStreams": {
	},
	"addStream": {
	},
	"removeStream": {
	},
	"startStream": {
	},
	"stopStream": {
	},*/
};

exports.defaultModuleConfig = defaultModuleConfig;
exports.onPresence = presenceHandler;
exports.commands = commands;
