var Discord = require("discord.js");
var config = require('./config.js');
var edsm = require('./edsm.js');
var edmaterializer = require("./edmaterializer.js");

const VERSION = "FGEBot Version 0.3.2-JTJ11.2";

var options = {
	autoReconnect: 1
};

var FGEBot = new Discord.Client(options);

var startTime = Date.now();

var enumerate = function(obj) {
	var key;

	for (key in obj) {
		if (typeof obj[key] !== 'function') {
			console.log(key + ": " + obj[key]);
		}
	}
}

edsm.setUseBetaServer(config.EDSM_USE_BETASERVER);
edmaterializer.setUseBetaServer(config.EDMATERIALIZER_USE_BETASERVER);

var messagebox;

try {
	messagebox = require("./messagebox.json");
} catch(e) {
	//no stored messages
	messagebox = {};
}

function updateMessagebox(){
	require("fs").writeFile("./messagebox.json",JSON.stringify(messagebox,null,2), null);
}

var edsmMappings;

try {
	edsmMappings = require("./edsmMappings.json");
} catch(e) {
	edsmMappings = {};
}

function updateEdsmMappings() {
	require("fs").writeFile("./edsmMappings.json", JSON.stringify(edsmMappings, null, 2));
}

function getEdsmUser(user) {
	if (!edsmMappings[user]) {
		return null;
	} else {
		return edsmMappings[user];
	}
}

function allowSubmission(user, message) {
	if (!config.EDSM_SUBMIT_ROLES || config.EDSM_SUBMIT_ROLES.length == 0) {
		return 1;
	}

	var userRoles = message.server.rolesOfUser(user);

	for (var index=0; index<userRoles.length; index++) {
		if (config.EDSM_SUBMIT_ROLES.indexOf(userRoles[index].name.toLowerCase()) > -1) {
			return 1;
		}
	}

	return 0;
}

var compileArgs = function(args) {
	args.splice(0,1);
	return args.join(" ");
}

var commands = {
	"ping": {
		help: "Returns pong. Useful for determining if the bot is alive.",
		process: function(args, bot, message) { bot.sendMessage(message.channel, "Pong!"); }
	},
	"version": {
		help: "Display version information for this bot.",
		process: function(args, bot, message) { bot.sendMessage(message.channel, VERSION); }
	},
	"uptime": {
    	usage: "",
		help: "returns the amount of time since the bot started",
		process: function(args,bot,msg){
			var now = Date.now();
			var msec = now - startTime;
			console.log("Uptime is " + msec + " milliseconds");
			var days = Math.floor(msec / 1000 / 60 / 60 / 24);
			msec -= days * 1000 * 60 * 60 * 24;
			var hours = Math.floor(msec / 1000 / 60 / 60);
			msec -= hours * 1000 * 60 * 60;
			var mins = Math.floor(msec / 1000 / 60);
			msec -= mins * 1000 * 60;
			var secs = Math.floor(msec / 1000);
			var timestr = "";

			if(days > 0) {
				timestr += days + " days ";
			}

			if(hours > 0) {
				timestr += hours + " hours ";
			}

			if(mins > 0) {
				timestr += mins + " minutes ";
			}

			if(secs > 0) {
				timestr += secs + " seconds ";
			}

			bot.sendMessage(msg.channel,"Uptime: " + timestr);
		}
	},
	"msg": {
		usage: "<user> <message to leave user>",
		help: "leaves a message for a user the next time they come online",
		process: function(args,bot,msg) {
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
			bot.sendMessage(msg.channel,"message saved.")
		}
	},
	"roles": {
		help: "Show the public roles managed by the bot.",
		process: function(args, bot, msg) {
			if (!config.MANAGEABLE_ROLES || config.MANAGEABLE_ROLES.length == 0) {
				bot.sendMessage(msg.channel, "I am not allowed to manage any roles.");
				return;
			}

			var serverRoles = msg.server.roles;
			var publicRoles = [];

			for (var index=0; index<serverRoles.length; index++) {
				if (config.MANAGEABLE_ROLES.indexOf(serverRoles[index].name.toLowerCase()) > -1) {
					publicRoles.push(serverRoles[index].name);
				}
			}

			if (publicRoles.length == 0) {
				bot.sendMessage(msg.channel, "I am not allowed to manage any roles.");
				return;
			}

			var output = "The following roles can be managed by the bot using the " + config.COMMAND_PREFIX + "join and " + config.COMMAND_PREFIX + "leave commands:\n";
			output += "\t" + publicRoles.join("\n\t");

			bot.sendMessage(msg.channel, output);
		}
	},
	"join": {
		usage: "<role>",
		help: "Join a user role",
		process: function(args, bot, msg) {
			function roleHandler(error) {
				if (error) {
					bot.sendMessage(msg.channel, "I may have not permission to assign this role.");
				} else {
					bot.sendMessage(msg.channel, "Done.");
				}
			}

			if (!config.MANAGEABLE_ROLES || config.MANAGEABLE_ROLES.length == 0) {
				bot.sendMessage(msg.channel, "I am not allowed to manage any roles.");
				return;
			}

			var roleName = compileArgs(args);

			if (config.MANAGEABLE_ROLES.indexOf(roleName.toLowerCase()) == -1) {
				bot.sendMessage(msg.channel, "I am not allowed to manage this role.");
				return;
			}

			var serverRoles = msg.server.roles;
			var role = null;

			for (var index=0; index<serverRoles.length; index++) {
				if (serverRoles[index].name.toLowerCase() == roleName.toLowerCase()) {
					role = serverRoles[index];
					break;
				}
			}

			if (!role) {
				bot.sendMessage(msg.channel, "The role " + roleName + " is unknown on this server.");
				return;
			}

			if (bot.memberHasRole(msg.author, role)) {
				bot.sendMessage(msg.channel, "You already have the role " + roleName + ".");
				return;
			}

			try {
				bot.addMemberToRole(msg.author, role, roleHandler);
			} catch(e) {
				console.log(e);
			}
		}
	},
	"leave": {
		usage: "<role>",
		help: "Leave a user role",
		process: function(args, bot, msg) {
			function roleHandler(error) {
				if (error) {
					bot.sendMessage(msg.channel, "I may have not permission to assign this role.");
				} else {
					bot.sendMessage(msg.channel, "Done.");
				}
			}

			if (config.MANAGEABLE_ROLES.length == 0) {
				bot.sendMessage(msg.channel, "I am not allowed to manage any roles.");
				return;
			}

			var roleName = compileArgs(args);

			if (config.MANAGEABLE_ROLES.indexOf(roleName.toLowerCase()) == -1) {
				bot.sendMessage(msg.channel, "I am not allowed to manage this role.");
				return;
			}

			var serverRoles = msg.server.roles;
			var role = null;

			for (var index=0; index<serverRoles.length; index++) {
				if (serverRoles[index].name.toLowerCase() == roleName.toLowerCase()) {
					role = serverRoles[index];
					break;
				}
			}

			if (!role) {
				bot.sendMessage(msg.channel, "The role " + roleName + " is unknown on this server.");
				return;
			}

			if (!bot.memberHasRole(msg.author, role)) {
				bot.sendMessage(msg.channel, "You do not have the role " + roleName + ".");
				return;
			}

			try {
				bot.removeMemberFromRole(msg.author, role, roleHandler);
			} catch(e) {
				console.log(e);
			}
		}
	},
	"ratsignal": {
		help: "Send an emergency call to the Fuel Rats",
		process: function(args, bot, msg) {
			function callback(error, message) {
				var edsmUser = getEdsmUser(msg.author);

				if (edsmUser) {
					edsm.getCommanderCoordinates(edsmUser, bot, message);
				}
			}

			if (!config.RATSIGNAL_CONTACT_ROLES || config.RATSIGNAL_CONTACT_ROLES.length == 0) {
				bot.sendMessage(msg.channel, "Sadly there is nobody here to help you.");
				return;
			}

			var serverRoles = msg.server.roles;
			var role = null;
			var contactRoles = [];

			for (var index=0; index<serverRoles.length; index++) {
				if (config.RATSIGNAL_CONTACT_ROLES.indexOf(serverRoles[index].name.toLowerCase()) == -1) {
					continue;
				}

				contactRoles.push(serverRoles[index]);
			}

			if (contactRoles.length == 0) {
				bot.sendMessage(msg.channel, "Sadly there is nobody here to help you.");
				return;
			}

			var output = contactRoles.join(", ") + " RAT SIGNAL\n";
			output += msg.author + " has run out of fuel and is in need of assistance!";

			var channel = msg.channel;

			if (config.RATSIGNAL_EMERGENCY_CHANNEL) {
				var serverChannels = msg.server.channels;

				for (var index=0; index<serverChannels.length; index++) {
					if (serverChannels[index].name == config.RATSIGNAL_EMERGENCY_CHANNEL) {
						channel = serverChannels[index];
					}
				}
			}

			bot.sendMessage(channel, output, {}, callback);

			output = msg.author + ", a rat signal has been sent.\n";
			output += "Stay calm and refer to the Emergency Fuel Procedures detailled here: http://imgur.com/gallery/Vl2EQ/\n";

			if (msg.channel.name != channel.name) {
				output += "Move to " + channel + " and wait for your rescue.";
			}

			bot.sendMessage(msg.channel, output);
		}
	},
	"aliases": {
		help: "Returns the list of supported alias systems",
		process: function(args,bot,msg) { edsm.listAliases(bot, msg); }
	},
	"locate": {
		usage: "<name>",
		help: 'Gets the location of a commander',
		process: function(args,bot,msg) { edsm.locateCommander(compileArgs(args), bot, msg); }
	},
	"syscoords": {
		usage: "<system>",
		help: 'Gets the galactic coordinates of a system',
		process: function(args,bot,msg) { edsm.getSystemCoordinates(compileArgs(args), bot, msg); }
	},
	"cmdrcoords": {
		usage: "<name>",
		help: "Gets the location of a commander, including system coordinates, if they are available",
		process: function(args,bot,msg) { edsm.getCommanderCoordinates(compileArgs(args), bot, msg); }
	},
	"distance": {
		usage: "<first> " + config.NAME_SEPARATOR + " <second>",
		help: "Gets the distance from one system or commander to another. If <second> is not given, gets the distance from first to Sol",
		process: function(args,bot,msg) {
			var query = compileArgs(args).split(config.NAME_SEPARATOR);
			var first = query[0].trim();
			var second = null;

			if (query.length == 1) {
				second = "Sol";
			} else {
				second = query[1].trim();
			}

			edsm.getDistance(first, second, bot, msg);
		}		
	},
	"route": {
		usage: "<first> " + config.NAME_SEPARATOR + " <second> [r:<range>]",
		help: "Find a route from one system or commander to another",
		process : function(args, bot, msg) {
			var lastArgIndex = args.length-1;
			var lastArg = args[lastArgIndex];
			var rangeRegEx = new RegExp('^r:\\d+(\\.\\d{1,2})?$');
			var range = null;

			if (rangeRegEx.test(lastArg)) {
				range = lastArg.substr(2);
				args.pop();
			}

			var query = compileArgs(args).split(config.NAME_SEPARATOR);
			var first = query[0].trim();
			var second = null;

			if (query.length == 1) {
				second = "Sol";
			} else {
				second = query[1].trim();
			}

			edsm.getRoute(first, second, range, bot, msg);
		}
	},
	"nearby": {
		usage: "<name> [r:<range>]",
		help: "Find systems close to a system or commander",
		process: function(args, bot, msg) {
			var lastArgIndex = args.length-1;
			var lastArg = args[lastArgIndex];
			var rangeRegEx = new RegExp('^r:\\d+(\\.\\d{1,2})?$');
			var range = null;

			if (rangeRegEx.test(lastArg)) {
				range = lastArg.substr(2);
				args.pop();
			}

			var name = compileArgs(args);
			edsm.getNearbySystems(name, range, bot, msg);
		}
	},
	"waypoints": {
		usage: "<origin> : <destination>",
		help: "Get a list of waypoints between the origin and destination to help in-game plotting.",
		process: function(args, bot, msg) {
			var systems = compileArgs(args).split(':');
			var origin = systems[0].trim();
			var destination = systems[1].trim();
			edsm.getWaypoints(origin, destination, 1000, bot, msg);
		}
	},
	"register": {
		usage: "<name>",
		help: "Register a mapping from your Discord user to your EDSM user.",
		process: function(args, bot, msg) {
			args.shift();
			var edsmUser = args.join(" ");
			edsmMappings[msg.author] = edsmUser;
			updateEdsmMappings();
			bot.sendMessage(msg.channel, "Mapping stored.");
		}
	},
	"unregister": {
		help: "Delete the mapping from your Discord user to your EDSM user.",
		process: function(args, bot, msg) {
			if (!edsmMappings[msg.author]) {
				bot.sendMessage(msg.channel, "No EDSM Username found.");
			} else {
				delete edsmMappings[msg.author];
				updateEdsmMappings();
				bot.sendMessage(msg.channel, "Mapping removed.");
			}
		}
	},
	"getEdsmUser": {
		usage: "[name]",
		help: "Get your or the given user's EDSM Username.",
		process: function(args, bot, msg) {
			args.shift();
			var user = args.join(" ");

			if (!user) {
				user = msg.author;
			}

			edsmUser = getEdsmUser(user);

			if (!edsmUser) {
				bot.sendMessage(msg.channel, "No EDSM Username found for " + user);
			} else {
				bot.sendMessage(msg.channel, edsmUser);
			}
		}
	},
	"trilaterate": {
		usage: "<system>",
		help: "Ask for help to trilaterate a system.",
		process: function(args, bot, msg) {
			var system = compileArgs(args);
			var usernames = [];

			if (config.TRILATERATION_CONTACT_EDSMUSERS == 1) {
				var registeredNames = Object.keys(edsmMappings);

				for (var index=0; index<registeredNames.length; index++) {
					if (allowSubmission(registeredNames[index])) {
						usernames.push(registeredNames[index]);
					}
				}
			}

			if (usernames.length == 0 && config.TRILATERATION_CONTACT_ROLES.length == 0) {
				bot.sendMessage(msg.channel, "It appears as if there is nobody available to help you with this.");
			} else {
				var message = "";

				if (config.TRILATERATION_CONTACT_ROLES > 0) {
					message += config.TRILATERATION_CONTACT_ROLES.join(", ") + "\n";
				}

				if (usernames.length > 0) {
					message += usernames.join(", ") + "\n";
				}

				message += msg.author + " is asking for your help to trilaterate the system " + system + ".\n";

				if (config.EDSM_ENABLE_SUBMISSION == 1) {
					message += "Please submit your distances using the " + config.COMMAND_PREFIX + "submit command.";
				}

				bot.sendMessage(msg.channel, message);
			}
		}
	},
	"submit": {
		usage: "<targetSystem> " + config.NAME_SEPARATOR + " <yourSystem> <distance>",
		help: "Submit the distance to the given system.",
		process: function(args, bot, msg) {
			if (config.EDSM_ENABLE_SUBMISSION != 1) {
				bot.sendMessage(msg.channel, "Distance submission is currently disabled.");
				return;
			}

			if (!allowSubmission(msg.author, msg)) {
				bot.sendMessage(msg.channel, "You are not allowed to submit distances.");
				return;
			}

			var distance = args.pop();
			var distanceRegEx = new RegExp('^\\d+(\\.\\d{1,2})?$');

			if (!distanceRegEx.test(distance)) {
				bot.sendMessage(msg.channel, "Invalid distance.");
				return;
			}

			var systems = compileArgs(args).split(config.NAME_SEPARATOR);

			if (systems.length != 2) {
				bot.sendMessage(msg.channel, "You have not provided enough system names.");
				return;
			}

			var targetSystem = systems[0].trim();
			var referenceSystem = systems[1].trim();
			var edsmUser = getEdsmUser(msg.author);
			edsm.submitDistance(targetSystem, referenceSystem, distance, edsmUser, bot, msg);
		}
	},
	"getStars": {
		usage: "<system>",
		help: "List the stars of a given system",
		process: function(args, bot, msg) {
			var system = compileArgs(args);
			edmaterializer.getStars(system, bot, msg);
		}
	},
	"getWorlds": {
		usage: "<system>",
		help: "List the worlds of a given system",
		process: function(args, bot, msg) {
			var system = compileArgs(args);
			edmaterializer.getWorlds(system, bot, msg);
		}
	},
	"showStar": {
		usage: "<starId>",
		help: "Show information on the given star",
		process: function(args, bot, msg) {
			var starId = compileArgs(args);
			edmaterializer.showStarInfo(starId, bot, msg);
		}
	},
	"showWorld": {
		usage: "<worldId>",
		help: "Show the information available on the given world",
		process: function(args, bot, msg) {
			var worldId = compileArgs(args);
			edmaterializer.showWorldInfo(worldId, bot, msg);
		}
	},
	"showSurvey": {
		usage: "<surveyId>",
		help: "Show information on the specified survey",
		process: function(args, bot, msg) {
			var surveyId = compileArgs(args);
			edmaterializer.showSurveyInfo(surveyId, bot, msg);
		}
	},
	"help": {
		help: "Display help for this bot.",
		process: function(args, bot, msg) {
			var output = VERSION + " commands:";
			var key;

			for (key in commands) {
				output += "\n\t";

				if (config.COMMAND_PREFIX) {
					output += config.COMMAND_PREFIX;
				}

				output += key;
				var usage = commands[key].usage;
				if(usage){
					output += " " + usage;
				}
				output += "\n\t\t\t";
				output += commands[key].help;
			}

			// console.log(output);
			//bot.sendMessage(msg.channel, output);
			bot.sendMessage(msg.channel, "Help sent as private message.");
			bot.sendMessage(msg.author, output);
		}
	},
};

function handleMessage(message) {
	if (message.author == FGEBot.user) {
		return;
	}

	if (!config.RESPOND_TO_PRIVATEMESSAGES && message.channel.isPrivate) {
		return;
	}

	if (message.channel.name && config.IGNORE_CHANNELS.length > 0) {
		var index = config.IGNORE_CHANNELS.indexOf(message.channel.name.toLowerCase());

		if (index > -1) {
			return;
		}
	}

	var processed = 0;
	var messageContent = "";

	if (config.RESPOND_TO_MENTIONS) {
		var mentionString = "<@" + FGEBot.user.id + ">";
		var mentionStringRenamed = "<@!" + FGEBot.user.id + ">";

		if (message.content.startsWith(mentionString) || message.content.startsWith(mentionStringRenamed)) {
			processed = 1;

			if (message.content.startsWith(mentionString)) {
				messageContent = message.content.substr(mentionString.length).trim();
			} else if (message.content.startsWith(mentionStringRenamed)) {
				messageContent = message.content.substr(mentionStringRenamed.length).trim();
			} else {
				messageContent = message.content;
			}
		}
	}

	if (!processed && config.RESPOND_TO_COMMANDS && config.COMMAND_PREFIX && message.content.startsWith(config.COMMAND_PREFIX)) {
		processed = 1;
		messageContent = message.content.substr(config.COMMAND_PREFIX.length);
	}

	if (processed == 1) {
		var args = messageContent.split(" ");
		var cmd = commands[args[0]];

		if (cmd) {
			var channelInfo = "";
			if (message.channel.isPrivate) {
				channelInfo = "(Private Message)";
			} else {
				channelInfo = "(Server: " + message.server.name + ", Channel: " + message.channel.name + ")";
			}
			console.log("Processing " + args[0] + "() for " + message.author.name + " " + channelInfo);

			try {
				cmd.process(args, FGEBot, message);
			} catch(e) {
				if (config.debug) {
					FGEBot.sendMessage(message.channel, "Command " + message.content + " failed.\n" + e.stack);
				}
			}
		}
	}
}

function handleUserStatusChange(user, status, gameId) {
	try {
		if (status != "offline") {
			if (messagebox.hasOwnProperty(user.id)) {
				console.log("Found a message for " + user.id);
				var message = messagebox[user.id];
				var channel = FGEBot.channels.get("id", message.channel);
				delete messagebox[user.id];
				updateMessagebox();
				FGEBot.sendMessage(channel, message.content);
			}
		}
	} catch(e) {
	}
}

function handleLogin(error, token) {
	if (error) {
		console.log("Error logging in: " + error);
	}

	if (token) {
		console.log(VERSION + " logged in with token " + token);
	}
}

function handleDisconnect() {
	console.log("Disconnected.");
}

FGEBot.on("message", handleMessage);
FGEBot.on("presense", handleUserStatusChange);
FGEBot.on("disconnected", handleDisconnect);
FGEBot.login(config.LOGIN, config.PASSWORD, handleLogin);

if (config.USE_TRELLO) {
	console.log("Activating trello integration");
	var TrelloBot = require('./trello.js')
	    ,bot = new TrelloBot({
	        pollFrequency: 1000*60*1 //every minute
	        ,start: true
	        ,trello: {
	            boards: config.TRELLO_BOARDS
	            ,key: config.TRELLO_KEY
	            ,token: config.TRELLO_TOKEN
	            ,events: ['createCard','commentCard','addAttachmentToCard','updateCard','updateCheckItemStateOnCard']
	        }
	        ,discord: FGEBot
	    });
};
