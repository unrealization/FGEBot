var botFunctions = require("../bot_functions.js");

var defaultModuleConfig = {
	"WELCOME_CHANNEL": "",
};

function newMemberHandler(bot, server, user) {
	var welcomeChannel = botFunctions.getConfigValue(server, "WELCOME_CHANNEL");

	if (!welcomeChannel) {
		return false;
	}

	var serverChannel = botFunctions.getChannel(server, welcomeChannel);

	if (!serverChannel) {
		return false;
	}

	console.log(user.name + " joined " + server.name);
	botFunctions.sendMessage(bot, serverChannel, "Welcome to " + server.name + ", " + user.mention() + "!");
	return false;
}

var commands = {
	"setWelcomeChannel": {
		usage: "[channel]",
		help: "Set a channel, or none, in which the bot will post a welcome message for new users on this Discord.",
		process: function(args, bot, msg) {
			var channel = botFunctions.compileArgs(args);

			if (!channel) {
				if (!botFunctions.setConfigValue(msg.server, "WELCOME_CHANNEL", "")) {
					botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
					return;
				}

				botFunctions.sendMessage(bot, msg.channel, "The channel for welcome messages has been cleared.");
				return;
			}

			var serverChannel = botFunctions.getChannelByName(msg.server, channel);

			if (!serverChannel) {
				botFunctions.sendMessage(bot, msg.channel, "Cannot find the channel " + channel);
				return;
			}

			if (!botFunctions.setConfigValue(msg.server, "WELCOME_CHANNEL", serverChannel.id)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The channel for welcome messages has been set to: " + serverChannel.name);
		},
		permissions: [
			"administrator"
		]
	},
};

exports.defaultModuleConfig = defaultModuleConfig;
exports.onNewMember = newMemberHandler;
exports.commands = commands;
