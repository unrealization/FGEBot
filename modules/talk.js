var botFunctions = require("../bot_functions.js");

var talkList = [];

function isTalking(server, user) {
	if (!server) {
		return 0;
	}

	if (talkList[server.id] == null) {
		talkList[server.id] = [];
	}

	if (talkList[server.id].indexOf(user.id) > -1) {
		return 1;
	}

	return 0;
}

function startTalk(server, user) {
	if (isTalking(server, user)) {
		return;
	}

	if (talkList[server.id] == null) {
		talkList[server.id] = [];
	}

	talkList[server.id].push(user.id);
}

function stopTalk(server, user) {
	if (!isTalking(server, user)) {
		return;
	}

	if (talkList[server.id] == null) {
		talkList[server.id] = [];
	}

	var talkIndex = talkList[server.id].indexOf(user.id);

	if (talkIndex == -1) {
		return;
	}

	talkList[server.id].splice(talkIndex,1);
}

function messageHandler(message) {
	if (isTalking(message.server, message.author)) {
		return 1;
	}

	return 0;
}

var commands = {
	"talk": {
		help: "Talk to the bot. Tell the bot to shut up if you want to stop talking to him.",
		process: function(args, bot, msg) {
			function responseHandler(error, message) {
				if (error) {
					stopTalk(msg.server, msg.author);
					console.log("Error: " + error);
					botFunctions.sendMessage(bot, msg.channel, "There was an error.");
					return;
				}

				if (message.content.toLowerCase().includes("shut up")) {
					stopTalk(msg.server, msg.author);
					botFunctions.sendMessage(bot, message.channel, "There was absolutely no need to get rude. A good day, sir.");
					return;
				}

				startTalk(msg.server, msg.author);
				bot.awaitResponse(message, "That's interesting. Tell me more.", {}, responseHandler);
			}

			bot.awaitResponse(msg, "Okay, talk to me, " + msg.author.mention() + ".", {}, responseHandler);
		}
	},
};

exports.messageHandler = messageHandler;
exports.commands = commands;
