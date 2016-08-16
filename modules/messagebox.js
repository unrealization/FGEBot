var botFunctions = require("../bot_functions.js");

var messagebox;

try {
	messagebox = require("../messagebox.json");
} catch(e) {
	//no stored messages
	messagebox = {};
}

function updateMessagebox(){
	//require("fs").writeFile("../messagebox.json",JSON.stringify(messagebox,null,2), null);
	//require("fs").writeFile("../messagebox.json",JSON.stringify(messagebox,null,2));
	require("fs").writeFileSync("../messagebox.json",JSON.stringify(messagebox,null,2));
}

function presenceHandler(bot, server, oldUser, newUser) {
	if (newUser.status != "offline") {
		if (messagebox.hasOwnProperty(newUser.id)) {
			console.log("Found a message for " + newUser.id);
			var message = messagebox[newUser.id];
			var channel = FGEBot.channels.get("id", message.channel);
			delete messagebox[newUser.id];
			updateMessagebox();
			botFunctions.sendMessage(bot, channel, message.content);
		}
	}

	return false;
}

var commands = {
	"msg": {
		usage: "<user> <message>",
		help: "Leaves a message for a user the next time they come online",
		process: function(args, bot, msg) {
			var user = args.shift();
			var message = args.join(' ');

			if(user.startsWith('<@')) {
				user = user.substr(2,user.length-3);
			}

			var target = msg.channel.server.members.get("id",user);

			if(!target) {
				target = msg.channel.server.members.get("username",user);
			}

			messagebox[target.id] = {
				channel: msg.channel.id,
				content: target + ", " + msg.author + " said: " + message
			};

			updateMessagebox();
			botFunctions.sendMessage(bot, msg.channel, "Message saved.")
		}
	},
};

exports.onPresence = presenceHandler;
exports.commands = commands;
