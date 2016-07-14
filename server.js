var Discord = require("discord.js");
var config = require('./config.js');
var edsm = require('./edsm.js');

const VERSION = "FGEBot Version 0.3.2-JTJ6";

var FGEBot = new Discord.Client();

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

var messagebox;

try{
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
	if (config.EDSM_SUBMIT_ROLES == 0) {
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
	"servers": {
        help: "lists servers bot is connected to",
        process: function(args, bot, msg) { bot.sendMessage(msg.channel,bot.servers); }
    },
    "channels": {
        help: "lists channels bot is connected to",
        process: function(args, bot, msg) { bot.sendMessage(msg.channel,bot.channels); }
    },
    "myid": {
        help: "returns the user id of the sender",
        process: function(args, bot, msg) { bot.sendMessage(msg.channel,msg.author.id); }
    },
    "say": {
        usage: "<message>",
        help: "bot says message",
        process: function(args, bot,msg) { bot.sendMessage(msg.channel,compileArgs(args));}
    },
	"announce": {
        usage: "<message>",
        help: "bot says message with text to speech",
        process: function(args, bot,msg) { bot.sendMessage(msg.channel,compileArgs(args),{tts:true});}
    },
    "userid": {
		usage: "<user to get id of>",
		help: "Returns the unique id of a user. This is useful for permissions.",
		process: function(args,bot,msg) {
			var suffix = compileArgs(args);
			console.log("userid [" + suffix + "]");
			if(suffix){
				var server = msg.channel.server;
				if (server) {
					var users = server.members.getAll("username",suffix);
					if(users.length == 1){
						bot.sendMessage(msg.channel, "The id of " + users[0] + " is " + users[0].id)
					} else if(users.length > 1){
						var response = "multiple users found:";
						for(var i=0;i<users.length;i++){
							var user = users[i];
							response += "\nThe id of " + user + " is " + user.id;
						}
						bot.sendMessage(msg.channel,response);
					} else {
						bot.sendMessage(msg.channel,"No user " + suffix + " found!");
					}
				} else {
					bot.sendMessage(msg.channel, "userid can only be run from a server channel, not a private message.");
				}
			} else {
				bot.sendMessage(msg.channel, "The id of " + msg.author + " is " + msg.author.id);
			}
		}
	},
	"topic": {
		usage: "[topic]",
		help: 'Sets the topic for the channel. No topic removes the topic.',
		process: function(args,bot,msg) {
			bot.setChannelTopic(msg.channel,compileArgs(args), function(error) {
				console.log("Channel topic result: " + error);
			});
		}
	},
	"msg": {
		usage: "<user> <message to leave user>",
		help: "leaves a message for a user the next time they come online",
		process: function(args,bot,msg) {
			var user = args.shift();
			var message = args.join(' ');
			if(user.startsWith('<@')){
				user = user.substr(2,user.length-3);
			}
			var target = msg.channel.server.members.get("id",user);
			if(!target){
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
	"locate": {
		usage: "<name>",
		help: 'Gets the location of a commander',
		process: function(args,bot,msg) {
			edsm.getPosition(compileArgs(args), bot, msg);
		}
	},
	"syscoords": {
		usage: "<system>",
		help: 'Gets the galactic coordinates of a system',
		process: function(args,bot,msg) {
			var system = compileArgs(args);
			edsm.getSystemCoords(system, bot, msg);
		}
	},
	"cmdrcoords": {
		usage: "<name>",
		help: "Gets the location of a commander, including system coordinates, if they are available",
		process: function(args,bot,msg) {
			edsm.getCmdrCoords(compileArgs(args), bot, msg);
		}
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
	"aliases": {
		help: "Returns the list of supported alias systems",
		process: function(args,bot,msg) {
			var key;
			var output = "Supported stellar aliases:";
			for (key in edsm.aliases) {
				if (typeof edsm.aliases[key] != 'function') {
					output += "\n    *" + key + " -> " + edsm.aliases[key];
				}
			}
			bot.sendMessage(msg.channel, output);
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
		help: "Ask the registered EDSM Users for help to trilaterate a system.",
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
			bot.sendMessage(msg.channel, output);
		}
	},
};


FGEBot.on("message", function(message){
	if (message.author !== FGEBot.user) {
		var processed = 0;
		console.log("[" + FGEBot.user + "] Got message from " + message.author + ": " + message);

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

				var args = messageContent.split(" ");
				var cmd = commands[args[0]];

				if (cmd) {
					try {
						cmd.process(args, FGEBot, message);
					} catch(e) {
						if (config.debug) {
							FGEBot.sendMessage(message.channel, "command " + message.content + " failed :(\n" + e.stack);
						}
					}
				} else {
					FGEBot.sendMessage(message.channel, message.author + ", what's up?");
				}
			}
		}

		if (!processed && config.RESPOND_TO_COMMANDS && config.COMMAND_PREFIX && message.content.startsWith(config.COMMAND_PREFIX)) {
			messageContent = message.content.substr(config.COMMAND_PREFIX.length);
			// First word is a command
			var args = messageContent.split(" ");
			var cmd = commands[args[0]];
			if(cmd) {
				try{
					cmd.process(args, FGEBot, message);
				} catch(e){
					if(config.debug){
						FGEBot.sendMessage(message.channel, "command " + message.content + " failed :(\n" + e.stack);
					}
				}
			} else {
				if(config.respondToInvalid){
					FGEBot.sendMessage(message.channel, "Invalid command " + message.content);
				}
			}
		} else if (!processed && message.author != FGEBot.user && message.isMentioned(FGEBot.user)) {
			FGEBot.sendMessage(message.channel,message.author + ", you called?");
        	}
	} 
});

//Log user status changes
FGEBot.on("presence", function(user,status,gameId) {
	//if(status === "online"){
	//console.log("presence update");
	// console.log(user+" went "+status);
	//}
	try{
	if(status != 'offline'){
		if(messagebox.hasOwnProperty(user.id)){
			console.log("found message for " + user.id);
			var message = messagebox[user.id];
			var channel = FGEBot.channels.get("id",message.channel);
			delete messagebox[user.id];
			updateMessagebox();
			FGEBot.sendMessage(channel,message.content);
		}
	}
	}catch(e){}
});

FGEBot.login(config.LOGIN, config.PASSWORD, function(error, token) {
	if (error) {
		console.log("Error logging in: " + error);
	}
	if (token) {
		console.log(VERSION + " logged in with token " + token);
	}
});

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
