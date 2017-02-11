var botFunctions = require("../bot_functions.js");

const VERSION = "1.3";

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

function getWelcomeChannel(args, bot, msg)
{
	var welcomeChannel = botFunctions.getConfigValue(msg.server, "WELCOME_CHANNEL");

	if (!welcomeChannel)
	{
		botFunctions.sendMessage(bot, msg.channel, "No welcome channel has been set.");
		return;
	}

	var serverChannel = botFunctions.getChannel(msg.server, welcomeChannel);

	if (!serverChannel)
	{
		botFunctions.sendMessage(bot, msg.channel, "A channel is set, but it does not exist on this server.");
		return;
	}

	botFunctions.sendMessage(bot, msg.channel, "The welcome channel is: " + serverChannel.name);
}

function setWelcomeChannel(args, bot, msg)
{
	var channel = botFunctions.compileArgs(args);

	if (!channel)
	{
		if (!botFunctions.setConfigValue(msg.server, "WELCOME_CHANNEL", ""))
		{
			botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
			return;
		}

		botFunctions.sendMessage(bot, msg.channel, "The channel for welcome messages has been cleared.");
		return;
	}

	var serverChannel = botFunctions.getChannelByName(msg.server, channel);

	if (!serverChannel)
	{
		botFunctions.sendMessage(bot, msg.channel, "Cannot find the channel " + channel);
		return;
	}

	if (!botFunctions.setConfigValue(msg.server, "WELCOME_CHANNEL", serverChannel.id))
	{
		botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
		return;
	}

	botFunctions.sendMessage(bot, msg.channel, "The channel for welcome messages has been set to: " + serverChannel.name);
}

var commands = {
	"getWelcomeChannel": {
		help: "Shows the currently set channel for welcome messages for new users.",
		process: getWelcomeChannel,
		permissions: [
			"administrator"
		]
	},
	"setWelcomeChannel": {
		usage: "[channel]",
		help: "Set a channel, or none, in which the bot will post a welcome message for new users on this Discord.",
		process: setWelcomeChannel,
		permissions: [
			"administrator"
		]
	},
};

exports.VERSION = VERSION;
exports.defaultModuleConfig = defaultModuleConfig;
exports.onNewMember = newMemberHandler;
exports.commands = commands;
