var botFunctions = require("../bot_functions.js");

const VERSION = "1.0";

var defaultModuleConfig = {
	"LOG_CHANNEL": "",
};

function newMemberHandler(bot, server, user) {
	var logChannel = botFunctions.getConfigValue(server, "LOG_CHANNEL");

	if (!logChannel) {
		return false;
	}

	var serverChannel = botFunctions.getChannel(server, logChannel);

	if (!serverChannel) {
		return false;
	}

	var now = new Date();
	botFunctions.sendMessage(bot, serverChannel, user.name + " has joined the server at " + now.toUTCString());
	return false;
}

function removedMemberHandler(bot, server, user) {
	var logChannel = botFunctions.getConfigValue(server, "LOG_CHANNEL");

	if (!logChannel) {
		return false;
	}

	var serverChannel = botFunctions.getChannel(server, logChannel);

	if (!serverChannel) {
		return false;
	}

	var now = new Date();
	botFunctions.sendMessage(bot, serverChannel, user.name + " has left the server at " + now.toUTCString());
	return false;
}

function presenceHandler(bot, server, oldUser, newUser) {
	var logChannel = botFunctions.getConfigValue(server, "LOG_CHANNEL");

	if (!logChannel) {
		return false;
	}

	var serverChannel = botFunctions.getChannel(server, logChannel);

	if (!serverChannel) {
		return false;
	}

	if (oldUser.status == newUser.status) {
		return false;
	}

	if (oldUser.status == "online" && (newUser.status == "idle" || newUser.status == "dnd")) {
		return false;
	}

	if (newUser.status == "online" && (oldUser.status == "idle" || oldUser.status == "dnd")) {
		return false;
	}

	var now = new Date();
	botFunctions.sendMessage(bot, serverChannel, newUser.name + "'s status has changed from " + oldUser.status + " to " + newUser.status + " at " + now.toUTCString());
	return false;
}

var commands = {
	"getLogChannel": {
		help: "Shows the currently set channel for user logs.",
		process: function(args, bot, msg) {
			var logChannel = botFunctions.getConfigValue(msg.server, "LOG_CHANNEL");

			if (!logChannel) {
				botFunctions.sendMessage(bot, msg.channel, "No log channel has been set.");
				return;
			}

			var serverChannel = botFunctions.getChannel(msg.server, logChannel);

			if (!serverChannel) {
				botFunctions.sendMessage(bot, msg.channel, "A channel is set, but it does not exist on this server.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The log channel is: " + serverChannel.name);
		},
		permissions: [
			"administrator"
		]
	},
	"setLogChannel": {
		usage: "[channel]",
		help: "Set a channel, or none, in which the bot will post user log messages.",
		process: function(args, bot, msg) {
			var channel = botFunctions.compileArgs(args);

			if (!channel) {
				if (!botFunctions.setConfigValue(msg.server, "LOG_CHANNEL", "")) {
					botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
					return;
				}
				botFunctions.sendMessage(bot, msg.channel, "The channel for user logs has been cleared.");
				return;
			}

			var serverChannel = botFunctions.getChannelByName(msg.server, channel);

			if (!serverChannel) {
				botFunctions.sendMessage(bot, msg.channel, "Cannot find the channel " + channel);
				return;
			}

			if (!botFunctions.setConfigValue(msg.server, "LOG_CHANNEL", serverChannel.id)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The channel for user logs has been to to: " + serverChannel.name);
		},
		permissions: [
			"administrator"
		]
	},
};

exports.VERSION = VERSION;
exports.defaultModuleConfig = defaultModuleConfig;
exports.onNewMember = newMemberHandler;
exports.onMemberRemoved = removedMemberHandler;
exports.onPresence = presenceHandler;
exports.commands = commands;
