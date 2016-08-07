var Discord = require("discord.js");
var config = require('./config.js');
var edsm = require('./edsm.js');
var edmaterializer = require("./edmaterializer.js");

const VERSION = "FGEBot Version 0.3.2-JTJ17.1";

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

var dynamicConfig;

try {
	dynamicConfig = require("./dynamicConfig.json");
} catch(e) {
	dynamicConfig = {
		"servers": {
		}
	}
}

var dynamicDefaultConfig = {
	"COMMAND_PREFIX": "!",
	"NAME_SEPARATOR": ":",
	"RESPOND_TO_COMMANDS": 1,
	"RESPOND_TO_MENTIONS": 1,
	"IGNORE_USERS": [
	],
	"IGNORE_CHANNELS": [
	],
	"RATSIGNAL_CONTACT_ROLE": "",
	"RATSIGNAL_EMERGENCY_CHANNEL": "",
	"RATSIGNAL_FUEL_PROCEDURE_LINK": "",
	"TRILATERATION_CONTACT_ROLE": "",
	"EDSM_ENABLE_SUBMISSION": 0,
	"EDSM_SUBMIT_ROLE": "",
	"EDSM_SUBMIT_REQUIRE_USER": 1
};

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
	//require("fs").writeFile("./messagebox.json",JSON.stringify(messagebox,null,2), null);
	require("fs").writeFile("./messagebox.json",JSON.stringify(messagebox,null,2));
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

function allowSubmission(bot, server, user) {
	if (!server) {
		return 0;
	}

	var edsmEnableSubmission = getConfigValue(server, "EDSM_ENABLE_SUBMISSION");

	if (!edsmEnableSubmission) {
		return 0;
	}

	var edsmSubmitRole = getConfigValue(server, "EDSM_SUBMIT_ROLE");

	if (!edsmSubmitRole) {
		return 1;
	}

	var serverRole = getRole(server, edsmSubmitRole);

	if (!serverRole) {
		return 0;
	}

	if (!bot.memberHasRole(user, serverRole)) {
		return 0;
	}

	var edsmSubmitRequireUser = getConfigValue(server, "EDSM_SUBMIT_REQUIRE_USER");

	if (edsmSubmitRequireUser) {
		var edsmUser = getEdsmUser(user);

		if (!edsmUser) {
			return 0;
		}
	}

	return 1;
}

function updateDynamicConfig() {
	require("fs").writeFile("./dynamicConfig.json", JSON.stringify(dynamicConfig, null, 2));
}

function getConfigValue(server, option) {
	var activeConfig;

	if (server) {
		if (!dynamicConfig["servers"][server.id]) {
			console.log("Creating default config for server " + server.name);
			dynamicConfig["servers"][server.id] = dynamicDefaultConfig;
			updateDynamicConfig();
		}

		activeConfig = dynamicConfig["servers"][server.id];
	} else {
		activeConfig = dynamicDefaultConfig;
	}

	return activeConfig[option];
}

function setConfigValue(server, option, value) {
	if (!server) {
		return 0;
	}

	dynamicConfig["servers"][server.id][option] = value;
	updateDynamicConfig();
	return 1;
}

function _sendMessage(bot, channel, message) {
	function messageHandler(error, message) {
		if (parts.length == 0) {
			return;
		}

		var output = parts.shift();
		bot.sendMessage(channel, output, {}, messageHandler);
	}

	if (message.length < 1500) {
		bot.sendMessage(channel, message);
		return;
	}

	var lines = message.split("\n");
	var parts = [];
	var output = "";

	for (var index=0; index<lines.length; index++) {
		if (output.length + lines[index].length < 1400) {
			output += lines[index] + "\n";
		} else {
			parts.push(output);
			output = lines[index] + "\n";
		}
	}

	if (output != "") {
		parts.push(output);
	}

	if (parts.length > 0) {
		output = parts.shift();
		bot.sendMessage(channel, output, {}, messageHandler);
	}
}

function checkPermission(channel, user, permission) {
	if (channel.isPrivate) {
		return false;
	}

	var userPermissions = channel.permissionsOf(user);
	return userPermissions.hasPermission(permission);
}

function getServer(bot, serverId) {
	var serverList = bot.servers;

	for (var x=0; x<serverList.length; x++) {
		if (serverList[x].id == serverId) {
			return serverList[x];
		}
	}

	return null;
}

function getServerByName(bot, server) {
	var serverList = bot.servers;

	for (var x=0; x<serverList.length; x++) {
		if (serverList[x].name == server) {
			return serverList[x];
		}
	}

	return null;
}

function getChannel(server, channelId) {
	if (!server) {
		return null;
	}

	var serverChannels = server.channels;

	for (var x=0; x<serverChannels.length; x++) {
		if (serverChannels[x].id == channelId) {
			return serverChannels[x];
		}
	}

	return null;
}

function getChannelByName(server, channel) {
	if (!server) {
		return null;
	}

	var serverChannels = server.channels;

	for (var x=0; x<serverChannels.length; x++) {
		if (serverChannels[x].name == channel || serverChannels[x].mention() == channel) {
			return serverChannels[x];
		}
	}

	return null;
}

function getRole(server, roleId) {
	if (!server) {
		return null;
	}

	var serverRoles = server.roles;

	for (var x=0; x<serverRoles.length; x++) {
		if (serverRoles[x].id == roleId) {
			return serverRoles[x];
		}
	}

	return null;
}

function getRoleByName(server, role) {
	if (!server) {
		return null;
	}

	var serverRoles = server.roles;

	for (var x=0; x<serverRoles.length; x++) {
		if (serverRoles[x].name == role || serverRoles[x].mention() == role) {
			return serverRoles[x];
		}
	}

	return null;
}

function getUser(server, userId) {
	if (!server) {
		return null;
	}

	var serverUsers = server.members;

	for (var x=0; x<serverUsers.length; x++) {
		if (serverUsers[x].id == userId) {
			return serverUsers[x];
		}
	}

	return null;
}

function getUserByName(server, user) {
	if (!server) {
		return null;
	}

	var serverUsers = server.members;

	for (var x=0; x<serverUsers.length; x++) {
		var renamedMention = getUserMentionRenamed(serverUsers[x]);

		if (serverUsers[x].name == user || serverUsers[x].mention() == user || renamedMention == user) {
			return serverUsers[x];
		}
	}

	return null;
}

function getManageableRoles(bot, channel) {
	var manageableRoles = [];

	if (!checkPermission(channel, bot.user, "manageRoles")) {
		return manageableRoles;
	}

	var botRoles = channel.server.rolesOfUser(bot.user);
	var rolePosition;

	for (var x=0; x<botRoles.length; x++) {
		if (botRoles[x].hasPermission("manageRoles") && (!rolePosition || botRoles[x].position<rolePosition)) {
			rolePosition = botRoles[x].position;
		}
	}

	var serverRoles = channel.server.roles;

	for (var x=0; x<serverRoles.length; x++) {
		if (serverRoles[x].name == "@everyone") {
			continue;
		}

		if (serverRoles[x].position<rolePosition) {
			manageableRoles.push(serverRoles[x]);
		}
	}

	return manageableRoles;
}

function roleIsManageable(bot, channel, roleId) {
	var manageableRoles = getManageableRoles(bot, channel);

	for (var x=0; x<manageableRoles.length; x++) {
		if (manageableRoles[x].id == roleId) {
			return 1;
		}
	}

	return 0;
}

function getUserMentionRenamed(user) {
	var output = "<@!" + user.id + ">";
	return output;
}

var compileArgs = function(args) {
	args.splice(0,1);
	return args.join(" ");
}

var commands = {
	"ping": {
		help: "Returns pong. Useful for determining if the bot is alive.",
		process: function(args, bot, message) { _sendMessage(bot, message.channel, "Pong!"); }
	},
	"version": {
		help: "Display version information for this bot.",
		process: function(args, bot, message) { _sendMessage(bot, message.channel, VERSION); }
	},
	"uptime": {
		help: "Returns the amount of time since the bot started",
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

			_sendMessage(bot, msg.channel,"Uptime: " + timestr);
		}
	},
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
			_sendMessage(bot, msg.channel, "Message saved.")
		}
	},
	"roles": {
		help: "Show the public roles managed by the bot.",
		process: function(args, bot, msg) {
			var publicRoles = getManageableRoles(bot, msg.channel);

			if (publicRoles.length == 0) {
				_sendMessage(bot, msg.channel, "I am not allowed to manage any roles.");
				return;
			}

			var roleNames = [];

			for (var x=0; x<publicRoles.length; x++) {
				roleNames.push(publicRoles[x].name);
			}

			var commandPrefix = getConfigValue(msg.server, "COMMAND_PREFIX");
			var output = "The following roles can be managed by the bot using the " + commandPrefix + "join and " + commandPrefix + "leave commands:\n";
			output += "\t" + roleNames.join("\n\t");

			_sendMessage(bot, msg.channel, output);
		}
	},
	"join": {
		usage: "<role>",
		help: "Join a user role",
		process: function(args, bot, msg) {
			function roleHandler(error) {
				if (error) {
					console.log("Error: " + error);
					_sendMessage(bot, msg.channel, "I may have not permission to assign this role.");
				} else {
					_sendMessage(bot, msg.channel, "Done.");
				}
			}

			var roleName = compileArgs(args);
			var role = getRoleByName(msg.server, roleName);

			if (!role) {
				_sendMessage(bot, msg.channel, "The role " + roleName + " is unknown on this server.");
				return;
			}

			if (!roleIsManageable(bot, msg.channel, role.id)) {
				_sendMessage(bot, msg.channel, "I am not allowed to manage this role.");
				return;
			}

			if (bot.memberHasRole(msg.author, role)) {
				_sendMessage(bot, msg.channel, "You already have the role " + roleName + ".");
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
					console.log("Error: " + error);
					_sendMessage(bot, msg.channel, "I may have not permission to assign this role.");
				} else {
					_sendMessage(bot, msg.channel, "Done.");
				}
			}

			var roleName = compileArgs(args);
			var role = getRoleByName(msg.server, roleName);

			if (!role) {
				_sendMessage(bot, msg.channel, "The role " + roleName + " is unknown on this server.");
				return;
			}

			if (!roleIsManageable(bot, msg.channel, role.id)) {
				_sendMessage(bot, msg.channel, "I am not allowed to manage this role.");
				return;
			}

			if (!bot.memberHasRole(msg.author, role)) {
				_sendMessage(bot, msg.channel, "You do not have the role " + roleName + ".");
				return;
			}

			try {
				bot.removeMemberFromRole(msg.author, role, roleHandler);
			} catch(e) {
				console.log(e);
			}
		}
	},
	"members": {
		usage: "<role>",
		help: "Get the list of users that have the given role.",
		process: function(args, bot, msg) {
			var roleName = compileArgs(args);
			var publicRoles = getManageableRoles(bot, msg.channel);
			var role = getRoleByName(msg.server, roleName);

			if (!role) {
				_sendMessage(bot, msg.channel, "The role " + roleName + " is unknown on this server.");
				return;
			}

			if (!roleIsManageable(bot, msg.channel, role.id)) {
				_sendMessage(bot, msg.channel, "I am not allowed to manage this role.");
				return;
			}

			var members = msg.server.usersWithRole(role);

			if (members.length == 0) {
				_sendMessage(bot, msg.channel, "The role " + role.name + " has no members.");
			}

			var output = "The role " + role.name + " has " + members.length + " members:\n";

			for (var index=0; index<members.length; index++) {
				output += "\t" + members[index].name + "\n";
			}

			_sendMessage(bot, msg.channel, "List sent as private message.");
			_sendMessage(bot, msg.author, output);
		}
	},
	"ratsignal": {
		help: "Send an emergency call to the Fuel Rats",
		process: function(args, bot, msg) {
			function callback(error, message) {
				var edsmUser = getEdsmUser(msg.author);

				if (edsmUser) {
//					edsm.getCommanderCoordinates(edsmUser, bot, message);
				}
			}

			var ratsignalContactRole = getConfigValue(msg.server, "RATSIGNAL_CONTACT_ROLE");

			if (!ratsignalContactRole) {
				_sendMessage(bot, msg.channel, "Sadly there is nobody here to help you.");
				return;
			}

			var role = getRole(msg.server, ratsignalContactRole);

			if (!role) {
				_sendMessage(bot, msg.channel, "Sadly there is nobody here to help you.");
				return;
			}

			var output = role.mention() + " RAT SIGNAL\n";
			output += msg.author + " has run out of fuel and is in need of assistance!";

			var channel = msg.channel;
			var ratsignalEmergencyChannel = getConfigValue(msg.server, "RATSIGNAL_EMERGENCY_CHANNEL");

			if (ratsignalEmergencyChannel) {
				var serverChannels = msg.server.channels;

				for (var index=0; index<serverChannels.length; index++) {
					if (serverChannels[index].id == ratsignalEmergencyChannel) {
						channel = serverChannels[index];
						break;
					}
				}
			}

			bot.sendMessage(channel, output, {}, callback);

			output = msg.author.mention() + ", a rat signal has been sent.\n";

			var ratsignalFuelProcedureLink = getConfigValue(msg.server, "RATSIGNAL_FUEL_PROCEDURE_LINK");

			if (ratsignalFuelProcedureLink) {
				output += "Stay calm and refer to the Emergency Fuel Procedures detailled here: " + ratsignalFuelProcedureLink + "\n";
			}

			if (msg.channel.id != channel.id) {
				output += "Move to " + channel.mention() + " and wait for your rescue.";
			}

			_sendMessage(bot, msg.channel, output);
		}
	},
	"edstatus": {
		help: "Elite: Dangerous Server Status Info",
		process: function(args, bot, msg) { edsm.getEDStatus(bot, msg); }
	},
	"aliases": {
		help: "Returns the list of supported system aliases",
		process: function(args,bot,msg) { edsm.listAliases(bot, msg); }
	},
	"locate": {
		usage: "[name]",
		help: 'Gets the last reported location of a commander',
		process: function(args, bot, msg) {
			var commanderName = compileArgs(args);

			if (!commanderName) {
				var edsmUser = getEdsmUser(msg.author);

				if (!edsmUser) {
					_sendMessage(bot, msg.channel, "I don't know whom I should locate.");
					return;
				}

				commanderName = edsmUser;
			}

			edsm.locateCommander(commanderName, bot, msg);
		}
	},
	"syscoords": {
		usage: "<system>",
		help: 'Gets the galactic coordinates of a system',
		process: function(args,bot,msg) { edsm.getSystemCoordinates(compileArgs(args), bot, msg); }
	},
	"cmdrcoords": {
		usage: "[name]",
		help: "Gets the last reported location of a commander, including system coordinates, if they are available",
		process: function(args, bot, msg) {
			var commanderName = compileArgs(args);

			if (!commanderName) {
				var edsmUser = getEdsmUser(msg.author);

				if (!edsmUser) {
					_sendMessage(bot, msg.channel, "I don't know whom I should locate.");
					return;
				}

				commanderName = edsmUser;
			}

			edsm.getCommanderCoordinates(commanderName, bot, msg);
		}
	},
	"distance": {
		usage: "<first> #NAME_SEPARATOR# <second>",
		help: "Gets the distance from one system or commander to another.",
		process: function(args, bot, msg) {
			var nameSeparator = getConfigValue(msg.server, "NAME_SEPARATOR");
			var query = compileArgs(args).split(nameSeparator);
			var first = query[0].trim();

			if (first == "") {
				var edsmUser = getEdsmUser(msg.author);

				if (edsmUser) {
					first = edsmUser;
				} else {
					first = "Sol";
				}
			}

			var second = null;

			if (query.length == 1) {
				var edsmUser = getEdsmUser(msg.author);

				if (edsmUser) {
					second = edsmUser;
				} else {
					second = "Sol";
				}
			} else {
				second = query[1].trim();
			}

			if (first == second) {
				_sendMessage(bot, msg.channel, first + " = " + second + ", which doesn't really make all that much sense.");
				return;
			}

			edsm.getDistance(first, second, bot, msg);
		}		
	},
	"route": {
		usage: "<origin> #NAME_SEPARATOR# <destination> [r:<range>]",
		help: "Find a route from one system or commander to another",
		process : function(args, bot, msg) {
			var lastArgIndex = args.length-1;
			var lastArg = args[lastArgIndex];
			var rangeRegEx = new RegExp('^r:\\d+(\\.\\d{1,2})?$');
			var range = null;
			var nameSeparator = getConfigValue(msg.server, "NAME_SEPARATOR");

			if (rangeRegEx.test(lastArg)) {
				range = lastArg.substr(2);
				args.pop();
			}

			var query = compileArgs(args).split(nameSeparator);
			var first = query[0].trim();

			if (first == "") {
				var edsmUser = getEdsmUser(msg.author);

				if (edsmUser) {
					first = edsmUser;
				} else {
					first = "Sol";
				}
			}

			var second = null;

			if (query.length == 1) {
				var edsmUser = getEdsmUser(msg.author);

				if (edsmUser) {
					second = edsmUser;
				} else {
					second = "Sol";
				}
			} else {
				second = query[1].trim();
			}

			if (first == second) {
				_sendMessage(bot, msg.channel, first + " = " + second + ", which doesn't really make all that much sense.");
				return;
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

			if (name == "") {
				var edsmUser = getEdsmUser(msg.author);

				if (edsmUser) {
					name = edsmUser;
				} else {
					name = "Sol";
				}
			}

			edsm.getNearbySystems(name, range, bot, msg);
		}
	},
	"nearcoords": {
		usage: "<x> <y> <z> [r:<range>]",
		help: "Find systems near the provided coordinates.",
		process: function(args, bot, msg) {
			var lastArgIndex = args.length-1;
			var lastArg = args[lastArgIndex];
			var rangeRegEx = new RegExp('^r:\\d+(\\.\\d{1,2})?$');
			var range = null;

			if (rangeRegEx.test(lastArg)) {
				range = lastArg.substr(2);
				args.pop();
			}

			var coords = compileArgs(args).split(" ");

			if (coords.length < 3) {
				_sendMessage(bot, msg.channel, "Not enough values");
				return;
			}

			var x = coords[0].trim();
			var y = coords[1].trim();
			var z = coords[2].trim();

			var numRegEx = new RegExp('^(-)?\\d+(\\.\\d{1,2})?$');

			if (!numRegEx.test(x)) {
				_sendMessage(bot, msg.channel, x + " is not a valid value.");
				return;
			}

			if (!numRegEx.test(y)) {
				_sendMessage(bot, msg.channel, y + " is not a valid value.");
				return;
			}

			if (!numRegEx.test(z)) {
				_sendMessage(bot, msg.channel, z + " is not a valid value.");
				return;
			}

			edsm.getNearbySystemsByCoordinates(x, y, z, range, bot, msg);
		}
	},
	"waypoints": {
		usage: "<origin> #NAME_SEPARATOR# <destination>",
		help: "Get a list of waypoints between the origin and destination to help in-game plotting.",
		process: function(args, bot, msg) {
			var nameSeparator = getConfigValue(msg.server, "NAME_SEPARATOR");
			var systems = compileArgs(args).split(nameSeparator);
			var origin = systems[0].trim();

			if (origin == "") {
				var edsmUser = getEdsmUser(msg.author);

				if (edsmUser) {
					origin = edsmUser;
				} else {
					origin = "Sol";
				}
			}

			var destination = "";

			if (systems.length == 1) {
				var edsmUser = getEdsmUser(msg.author);

				if (edsmUser) {
					destination = edsmUser;
				} else {
					destination = "Sol";
				}
			} else {
				destination = systems[1].trim();
			}

			if (origin == destination) {
				_sendMessage(bot, msg.channel, origin + " = " + destination + ", which doesn't really make all that much sense.");
				return;
			}

			edsm.getWaypoints(origin, destination, 1000, bot, msg);
		}
	},
	"register": {
		usage: "<name>",
		help: "Register a mapping from your Discord user to your EDSM user.",
		process: function(args, bot, msg) {
			var edsmUser = compileArgs(args);

			if (!edsmUser) {
				_sendMessage(bot, msg.channel, "Providing an EDSM username may have been helpful.");
				return;
			}

			edsmMappings[msg.author] = edsmUser;
			updateEdsmMappings();
			_sendMessage(bot, msg.channel, "Mapping stored.");
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
				_sendMessage(bot, msg.channel, "Mapping removed.");
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
				_sendMessage(bot, msg.channel, "No EDSM Username found for " + user);
			} else {
				_sendMessage(bot, msg.channel, edsmUser);
			}
		}
	},
	"trilaterate": {
		usage: "<system>",
		help: "Ask for help to trilaterate a system.",
		process: function(args, bot, msg) {
			var system = compileArgs(args);
			var role = getConfigValue(msg.server, "TRILATERATION_CONTACT_ROLE");

			if (!role) {
				_sendMessage(bot, msg.channel, "It appears as if there is nobody available to help you with this.");
				return;
			}

			var serverRole = getRole(msg.server, role);

			if (!serverRole) {
				_sendMessage(bot, msg.channel, "It appears as if there is nobody available to help you with this.");
				return;
			}

			var message = serverRole.mention() + "\n";
			message += msg.author + " is asking for your help to trilaterate the system " + system + ".\n";

			var edsmEnableSubmission = getConfigValue(msg.server, "EDSM_ENABLE_SUBMISSION");

			if (edsmEnableSubmission == 1) {
				var commandPrefix = getConfigValue(msg.server, "COMMAND_PREFIX");
				message += "Please submit your distances using the " + commandPrefix + "submit command if you are permitted to do so.";
			}

			_sendMessage(bot, msg.channel, message);
		}
	},
	"submit": {
		usage: "<targetSystem> #NAME_SEPARATOR# <yourSystem> <distance>",
		help: "Submit the distance to the given system.",
		process: function(args, bot, msg) {
			if (!allowSubmission(bot, msg.server, msg.author)) {
				_sendMessage(bot, msg.channel, "You are not allowed to submit distances.");
				return;
			}

			var distance = args.pop();
			var distanceRegEx = new RegExp('^\\d+(\\.\\d{1,2})?$');

			if (!distanceRegEx.test(distance)) {
				_sendMessage(bot, msg.channel, "Invalid distance.");
				return;
			}

			var nameSeparator = getConfigValue(msg.server, "NAME_SEPARATOR");
			var systems = compileArgs(args).split(nameSeparator);

			if (systems.length != 2) {
				_sendMessage(bot, msg.channel, "You have not provided enough system names.");
				return;
			}

			var targetSystem = systems[0].trim();
			var referenceSystem = systems[1].trim();
			var edsmUser = getEdsmUser(msg.author);
			//edsm.submitDistance(targetSystem, referenceSystem, distance, edsmUser, bot, msg);
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
	"servers": {
		help: "Show the servers the bot is connected to.",
		process: function(args, bot, msg) {
			var serverList = bot.servers;

			if (serverList.length == 0) {
				_sendMessage(bot, msg.channel, "The bot is not connected to any server.");
				return;
			}

			var output = "The bot is connected to the following servers:";

			for (var x=0; x<serverList.length; x++) {
				output += "\n\t" + serverList[x].name + " (Id: " + serverList[x].id + ")";
			}

			_sendMessage(bot, msg.channel, output);
		},
		permissions: [
			"administrator"
		]
	},
	"joinServer": {
		usage: "<invite>",
		help: "Join the server through the given invite.",
		process: function(args, bot, msg) {
			function callback(error, server) {
				if (error) {
					console.log("Error: " + error);
					_sendMessage(bot, msg.channel, "I cannot join the server.");
					return;
				}

				_sendMessage(bot, msg.channel, "Successfully joined the server " + server.name);
			}

			var invite = compileArgs(args);

			if (!invite) {
				_sendMessage(bot, msg.channel, "You have to provide an invite.");
				return;
			}

			bot.joinServer(invite, callback);
		},
		permissions: [
			"administrator"
		]
	},
	"leaveServer": {
		usage: "[server]",
		help: "Leave the given, or current, server.",
		process: function(args, bot, msg) {
			function callback(error) {
				if (error) {
					console.log("Error: " + error);
					_sendMessage(bot, msg.channel, "I was unable to leave the server " + server);
					return;
				}

				_sendMessage(bot, msg.channel, "Successfully left the server " + serverObject.name);
			}

			var server = compileArgs(args);
			var serverObject;

			if (!server) {
				serverObject = msg.server;
			} else {
				serverObject = getServer(bot, server);

				if (!serverObject) {
					serverObject = getServerByName(bot, server);
				}
			}

			if (!serverObject) {
				_sendMessage(bot, msg.channel, "Cannot find the server " + server);
				return;
			}

			bot.leaveServer(serverObject, callback);
		},
		permissions: [
			"administrator"
		]
	},
	"getUntaggedUsers": {
		help: "Get a list of untagged users.",
		process: function(args, bot, msg) {
			var serverUsers = msg.server.members;
			var untaggedUsers = [];

			for (var x=0; x<serverUsers.length; x++) {
				var userRoles = msg.server.rolesOfUser(serverUsers[x]);

				if (userRoles.length == 0) {
					untaggedUsers.push(serverUsers[x]);
				}
			}

			if (untaggedUsers.length == 0) {
				_sendMessage(bot, msg.channel, "There are no untagged users.");
				return;
			}

			var output = "The following " + untaggedUsers.length + " users have no role assigned:\n";

			for (var x=0; x<untaggedUsers.length; x++) {
				output += "\t" + untaggedUsers[x].name + "\n";
			}

			_sendMessage(bot, msg.channel, "List sent as private message.");
			_sendMessage(bot, msg.author, output);
		},
		permissions: [
			"administrator"
		]
	},
	"getRespondToCommands": {
		help: "See if the bot is set to respond to commands.",
		process: function(args, bot, msg) {
			var respondToCommands = getConfigValue(msg.server, "RESPOND_TO_COMMANDS");

			if (!respondToCommands) {
				_sendMessage(bot, msg.channel, "The bot does not respond to commands.");
				return;
			}

			_sendMessage(bot, msg.channel, "The bot responds to commands.");
		},
		permissions: [
			"administrator"
		]
	},
	"setRespondToCommands": {
		usage: "<1|0>",
		help: "Set whether or not the bot should respond to commands.",
		process: function(args, bot, msg) {
			var respondToCommands = compileArgs(args);

			if (respondToCommands != 0 && respondToCommands != 1) {
				_sendMessage(bot, msg.channel, "Invalid value.");
				return;
			}

			if (!setConfigValue(msg.server, "RESPOND_TO_COMMANDS", respondToCommands)) {
				_sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			if (respondToCommands == 0) {
				_sendMessage(bot, msg.channel, "The bot will now no longer respond to commands.");
				return;
			}

			_sendMessage(bot, msg.channel, "The bot will from now on respond to commands.");
		},
		permissions: [
			"administrator"
		]
	},
	"getRespondToMentions": {
		help: "See if the bot is set to respond to mentions.",
		process: function(args, bot, msg) {
			var respondToMentions = getConfigValue(msg.server, "RESPOND_TO_MENTIONS");

			if (!respondToMentions) {
				_sendMessage(bot, msg.channel, "The bot does not respond to mentions.");
				return;
			}

			_sendMessage(bot, msg.channel, "The bot responds to mentions.");
		},
		permissions: [
			"administrator"
		]
	},
	"setRespondToMentions": {
		usage: "<1|0>",
		help: "Set whether or not the bot should respond to mentions.",
		process: function(args, bot, msg) {
			var respondToMentions = Number(compileArgs(args));

			if (respondToMentions != 0 && respondToMentions != 1) {
				_sendMessage(bot, msg.channel, "Invalid value.");
				return;
			}

			if (!setConfigValue(msg.server, "RESPOND_TO_MENTIONS", respondToMentions)) {
				_sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			if (respondToMentions == 0) {
				_sendMessage(bot, msg.channel, "The bot will now no longer respond to mentions.");
				return;
			}

			_sendMessage(bot, msg.channel, "The bot will from now on respond to mentions.");
		},
		permissions: [
			"administrator"
		]
	},
	"getCommandPrefix": {
		help: "Get the current command prefix.",
		process: function(args, bot, msg) {
			var commandPrefix = getConfigValue(msg.server, "COMMAND_PREFIX");
			_sendMessage(bot, msg.channel, "The current command prefix is: " + commandPrefix);
		},
		permissions: [
			"administrator"
		]
	},
	"setCommandPrefix": {
		usage: "<value>",
		help: "Set the command prefix.",
		process: function(args, bot, msg) {
			var commandPrefix = compileArgs(args);

			if (!commandPrefix) {
				_sendMessage(bot, msg.channel, "The command prefix cannot be empty.");
				return;
			}

			if (!setConfigValue(msg.server, "COMMAND_PREFIX", commandPrefix)) {
				_sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			_sendMessage(bot, msg.channel, "Command prefix set to: " + commandPrefix);
		},
		permissions: [
			"administrator"
		]
	},
	"getNameSeparator": {
		help: "Get the current name separator.",
		process: function(args, bot, msg) {
			var nameSeparator = getConfigValue(msg.server, "NAME_SEPARATOR");
			_sendMessage(bot, msg.channel, "The current name separator is: " + nameSeparator);
		},
		permissions: [
			"administrator"
		]
	},
	"setNameSeparator": {
		usage: "<value>",
		help: "Set the name separator.",
		process: function(args, bot, msg) {
			var nameSeparator = compileArgs(args);

			if (!nameSeparator) {
				_sendMessage(bot, msg.channel, "The name separator cannot be empty.");
				return;
			}

			if (!setConfigValue(msg.server, "NAME_SEPARATOR", nameSeparator)) {
				_sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			_sendMessage(bot, msg.channel, "Name separator set to: " + nameSeparator);
		},
		permissions: [
			"administrator"
		]
	},
	"getIgnoredUsers": {
		help: "Get the list of ignored users on this server.",
		process: function(args, bot, msg) {
			var ignoredUsers = getConfigValue(msg.server, "IGNORE_USERS");

			if (ignoredUsers.length == 0) {
				_sendMessage(bot, msg.channel, "No users are being ignored.");
				return;
			}

			var userNames = [];

			for (var ignoredUserIndex=0; ignoredUserIndex<ignoredUsers.length; ignoredUserIndex++) {
				var added = 0;

				for (var serverUserIndex=0; serverUserIndex<msg.server.members.length; serverUserIndex++) {
					if (ignoredUsers[ignoredUserIndex] == msg.server.members[serverUserIndex].id) {
						userNames.push(msg.server.members[serverUserIndex].name);
						added = 1;
						break;
					}
				}

				if (!added) {
					userNames.push("Unknown user id: " + ignoredUsers[ignoredUserIndex]);
				}
			}

			var output = "The following users are being ignored by this bot:\n\t";
			output += userNames.join("\n\t");

			_sendMessage(bot, msg.channel, output);
		},
		permissions: [
			"administrator",
		]
	},
	"addIgnoredUser": {
		usage: "<user>",
		help: "Add a user the bot should ignore.",
		process: function(args, bot, msg) {
			var user = compileArgs(args);

			if (!user) {
				_sendMessage(bot, msg.channel, "You must specify the user the bot should ignore.");
				return;
			}

			var serverUser = getUserByName(msg.server, user);

			if (!serverUser) {
				_sendMessage(bot, msg.channel, "Cannot find the user " + user);
				return;
			}

			var ignoredUsers = getConfigValue(msg.server, "IGNORE_USERS");

			if (ignoredUsers.indexOf(serverUser.id) > -1) {
				_sendMessage(bot, msg.channel, "I already ignore the user " + serverUser.name);
				return;
			}

			ignoredUsers.push(serverUser.id);

			if (!setConfigValue(msg.server, "IGNORE_USERS", ignoredUsers)) {
				_sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			_sendMessage(bot, msg.channel, "User " + serverUser.name + " will now be ignored.");
		},
		permissions: [
			"administrator",
		]
	},
	"removeIgnoredUser": {
		usage: "<user>",
		help: "Remove a user from the ignore list.",
		process: function(args, bot, msg) {
			var user = compileArgs(args);

			if (!user) {
				_sendMessage(bot, msg.channel, "You need to specify the user you want me to stop ignoring.");
				return;
			}

			var serverUser = getUserByName(msg.server, user);

			if (!serverUser) {
				_sendMessage(bot, msg.channel, "Cannot find the user " + user);
				return;
			}

			var ignoredUsers = getConfigValue(msg.server, "IGNORE_USERS");
			var userIndex = ignoredUsers.indexOf(serverUser.id);

			if (userIndex == -1) {
				_sendMessage(bot, msg.channel, "I do not ignore the user " + serverUser.name);
				return;
			}

			ignoredUsers.splice(userIndex,1);

			if (!setConfigValue(msg.server, "IGNORE_USERS", ignoredUsers)) {
				_sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			_sendMessage(bot, msg.channel, "User " + serverUser.name + " will no longer be ignored.");
		},
		permissions: [
			"administrator",
		]
	},
	"getIgnoredChannels": {
		help: "Get the list of ignored channels on this server.",
		process: function(args, bot, msg) {
			var ignoredChannels = getConfigValue(msg.server, "IGNORE_CHANNELS");

			if (ignoredChannels.length == 0) {
				_sendMessage(bot, msg.channel, "No channels are being ignored.");
				return;
			}

			var channelNames = [];

			for (var ignoredChannelIndex=0; ignoredChannelIndex<ignoredChannels.length; ignoredChannelIndex++) {
				var added = 0;

				for (var serverChannelIndex=0; serverChannelIndex<msg.server.channels.length; serverChannelIndex++) {
					if (ignoredChannels[ignoredChannelIndex] == msg.server.channels[serverChannelIndex].id) {
						channelNames.push(msg.server.channels[serverChannelIndex].name);
						added = 1;
						break;
					}
				}

				if (!added) {
					channelNames.push("Unknown channel id: " + ignoredChannels[x]);
				}
			}

			var output = "The following channels are being ignored by this bot:\n\t";
			output += channelNames.join("\n\t");

			_sendMessage(bot, msg.channel, output);
		},
		permissions: [
			"administrator"
		]
	},
	"addIgnoredChannel": {
		usage: "[channel]",
		help: "Add a channel the bot should ignore.",
		process: function(args, bot, msg) {
			var channel = compileArgs(args);

			if (!channel) {
				channel = msg.channel;
			}

			var serverChannel = getChannelByName(msg.server, channel);

			if (!serverChannel) {
				_sendMessage(bot, msg.channel, "Cannot find the channel " + channel);
				return;
			}

			var ignoredChannels = getConfigValue(msg.server, "IGNORE_CHANNELS");

			if (ignoredChannels.indexOf(serverChannel.id) > -1) {
				_sendMessage(bot, msg.channel, "I already ignore the channel " + serverChannel.name);
				return;
			}

			ignoredChannels.push(serverChannel.id);

			if (!setConfigValue(msg.server, "IGNORE_CHANNELS", ignoredChannels)) {
				_sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			_sendMessage(bot, msg.channel, "Channel " + serverChannel.name + " will now be ignored.");
		},
		permissions: [
			"administrator"
		]
	},
	"removeIgnoredChannel": {
		usage: "<channel>",
		help: "Remove a channel from the ignore list.",
		process: function(args, bot, msg) {
			var channel = compileArgs(args);

			if (!channel) {
				_sendMessage(bot, msg.channel, "You need to specify the channel you want me to stop ignoring.");
				return;
			}

			var serverChannel = getChannelByName(msg.server, channel);

			if (!serverChannel) {
				_sendMessage(bot, msg.channel, "Cannot find the channel " + channel);
				return;
			}

			var ignoredChannels = getConfigValue(msg.server, "IGNORE_CHANNELS");
			var channelIndex = ignoredChannels.indexOf(serverChannel.id);

			if (channelIndex == -1) {
				_sendMessage(bot, msg.channel, "I do not ignore the channel " + serverChannel.name);
				return;
			}

			ignoredChannels.splice(channelIndex,1);

			if (!setConfigValue(msg.server, "IGNORE_CHANNELS", ignoredChannels)) {
				_sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			_sendMessage(bot, msg.channel, "Channel " + serverChannel.name + " will no longer be ignored.");
		},
		permissions: [
			"administrator"
		]
	},
	"getRatsignalContactRole": {
		help: "Get the current ratsignal contact role.",
		process: function(args, bot, msg) {
			var ratsignalContactRole = getConfigValue(msg.server, "RATSIGNAL_CONTACT_ROLE");

			if (!ratsignalContactRole) {
				_sendMessage(bot, msg.channel, "No ratsignal contact role has been set.");
				return;
			}

			var role = getRole(msg.server, ratsignalContactRole);

			if (!role) {
				_sendMessage(bot, msg.channel, "A role is set, but it does not exist on this server.");
				return;
			}

			_sendMessage(bot, msg.channel, "The ratsignal contact role is: " + role.name);
		},
		permissions: [
			"administrator"
		]
	},
	"setRatsignalContactRole": {
		usage: "[role]",
		help: "Sets a role, or none, as the role that will be contacted in case of a ratsignal.",
		process: function(args, bot, msg) {
			var role = compileArgs(args);

			if (!role) {
				if (!setConfigValue(msg.server, "RATSIGNAL_CONTACT_ROLE", "")) {
					_sendMessage(bot, msg.channel, "There was a problem storing the setting.");
					return;
				}

				_sendMessage(bot, msg.channel, "The ratsignal contact role has been cleared.");
				return;
			}

			var serverRole = getRoleByName(msg.server, role);

			if (!serverRole) {
				_sendMessage(bot, msg.channel, "Cannot find the role " + role);
				return;
			}

			if (!setConfigValue(msg.server, "RATSIGNAL_CONTACT_ROLE", serverRole.id)) {
				_sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			_sendMessage(bot, msg.channel, "The ratsignal contact role has been set to: " + serverRole.name);
		},
		permissions: [
			"administrator"
		]
	},
	"getRatsignalEmergencyChannel": {
		help: "Get the current ratsignal emergency channel.",
		process: function(args, bot, msg) {
			var ratsignalEmergencyChannel = getConfigValue(msg.server, "RATSIGNAL_EMERGENCY_CHANNEL");

			if (!ratsignalEmergencyChannel) {
				_sendMessage(bot, msg.channel, "No ratsignal emergency channel has been set.");
				return;
			}

			var channel = getChannel(msg.server, ratsignalEmergencyChannel);

			if (!channel) {
				_sendMessage(bot, msg.channel, "A channel is set, but it does not exist on this server.");
				return;
			}

			_sendMessage(bot, msg.channel, "The ratsignal emergency channel is: " + channel.name);
		},
		permissions: [
			"administrator"
		]
	},
	"setRatsignalEmergencyChannel": {
		usage: "[channel]",
		help: "Sets a channel, or none, as the channel commanders will be directed towards in case of a ratsignal.",
		process: function(args, bot, msg) {
			var channel = compileArgs(args);

			if (!channel) {
				if (!setConfigValue(msg.server, "RATSIGNAL_EMERGENCY_CHANNEL", "")) {
					_sendMessage(bot, msg.channel, "There was a problem storing the setting.");
					return;
				}

				_sendMessage(bot, msg.channel, "The ratsignal emergency channel has been cleared.");
				return;
			}

			var serverChannel = getChannelByName(msg.server, channel);

			if (!serverChannel) {
				_sendMessage(bot, msg.channel, "Cannot find the channel " + channel);
				return;
			}

			if (!setConfigValue(msg.server, "RATSIGNAL_EMERGENCY_CHANNEL", serverChannel.id)) {
				_sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			_sendMessage(bot, msg.channel, "The ratsignal emergency channel has been set to " + serverChannel.name);
		},
		permissions: [
			"administrator"
		]
	},
	"getRatsignalFuelProcedureLink": {
		help: "Get the current ratsignal fuel procedure link.",
		process: function(args, bot, msg) {
			var ratsignalFuelProcedureLink = getConfigValue(msg.server, "RATSIGNAL_FUEL_PROCEDURE_LINK");

			if (!ratsignalFuelProcedureLink) {
				_sendMessage(bot, msg.channel, "No ratsignal fuel procedure link has been set.");
				return;
			}

			_sendMessage(bot, msg.channel, "The ratsignal fuel procedure link is: " + ratsignalFuelProcedureLink);
		},
		permissions: [
			"administrator"
		]
	},
	"setRatsignalFuelProcedureLink": {
		usage: "[link]",
		help: "Sets a link, or none, as the link commanders will be sent for emergency fuel procedures in case of a ratsignal.",
		process: function(args, bot, msg) {
			var link = compileArgs(args);

			if (!link) {
				if (!setConfigValue(msg.server, "RATSIGNAL_FUEL_PROCEDURE_LINK", "")) {
					_sendMessage(bot, msg.channel, "There was a problem storing the setting.");
					return;
				}

				_sendMessage(bot, msg.channel, "The ratsignal fuel procedure link has been cleared.");
				return;
			}

			if (!setConfigValue(msg.server, "RATSIGNAL_FUEL_PROCEDURE_LINK", link)) {
				_sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			_sendMessage(bot, msg.channel, "The ratsignal fuel procedure link has been set to " + link);
		},
		permissions: [
			"administrator"
		]
	},
	"getTrilaterationContactRole": {
		help: "Get the role that will be contacted in case of trilateration requests.",
		process: function(args, bot, msg) {
			var trilaterationContactRole= getConfigValue(msg.server, "TRILATERATION_CONTACT_ROLE");

			if (!trilaterationContactRole) {
				_sendMessage(bot, msg.channel, "No trilateration contact role has been set.");
				return;
			}

			var role = getRole(msg.server, trilaterationContactRole);

			if (!role) {
				_sendMessage(bot, msg.channel, "A role is set, but it does not exist on this server.");
				return;
			}

			_sendMessage(bot, msg.channel, "The trilateration contact role is: " + role.name);
		},
		permissions: [
			"administrator"
		]
	},
	"setTrilaterationContactRole": {
		usage: "[role]",
		help: "Set a role, or none, that will be contacted in case of trilateration requests.",
		process: function(args, bot, msg) {
			var role = compileArgs(args);

			if (!role) {
				if (!setConfigValue(msg.server, "TRILATERATION_CONTACT_ROLE", "")) {
					_sendMessage(bot, msg.channel, "There was a problem storing the setting.");
					return;
				}

				_sendMessage(bot, msg.channel, "The trilateration contact role has been cleared.");
				return;
			}

			var serverRole = getRoleByName(msg.server, role);

			if (!serverRole) {
				_sendMessage(bot, msg.channel, "Cannot find the role " + role);
				return;
			}

			if (!setConfigValue(msg.server, "TRILATERATION_CONTACT_ROLE", serverRole.id)) {
				_sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			_sendMessage(bot, msg.channel, "The trilateration contact role has been set to " + serverRole.name);
		},
		permissions: [
			"administrator"
		]
	},
	"getEdsmEnableSubmission": {
		help: "See if EDSM distance submissions are enabled.",
		process: function(args, bot, msg) {
			var edsmEnableSubmission = getConfigValue(msg.server, "EDSM_ENABLE_SUBMISSION");

			if (!edsmEnableSubmission) {
				_sendMessage(bot, msg.channel, "The bot does not allow distance submissions to EDSM.");
				return;
			}

			_sendMessage(bot, msg.channel, "The bot allows distance submissions to EDSM.");
		},
		permissions: [
			"administrator"
		]
	},
	"setEdsmEnableSubmission": {
		usage: "<1|0>",
		help: "Set whether or not the bot should allow distance submissions to EDSM.",
		process: function(args, bot, msg) {
			var edsmEnableSubmission = Number(compileArgs(args));

			if (edsmEnableSubmission != 0 && edsmEnableSubmission != 1) {
				_sendMessage(bot, msg.channel, "Invalid value.");
				return;
			}

			if (!setConfigValue(msg.server, "EDSM_ENABLE_SUBMISSION", edsmEnableSubmission)) {
				_sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			if (edsmEnableSubmission == 0) {
				_sendMessage(bot, msg.channel, "The bot will now no longer allow distance submissions to EDSM.");
				return;
			}

			_sendMessage(bot, msg.channel, "The bot will from now on allow distance submissions to EDSM.");
		},
		permissions: [
			"administrator"
		]
	},
	"getEdsmSubmitRole": {
		help: "Get the role that is allowed to submit distances to EDSM.",
		process: function(args, bot, msg) {
			var edsmSubmitRole = getConfigValue(msg.server, "EDSM_SUBMIT_ROLE");

			if (!edsmSubmitRole) {
				_sendMessage(bot, msg.channel, "No EDSM distance submission role has been set.");
				return;
			}

			var role = getRole(msg.server, edsmSubmitRole);

			if (!role) {
				_sendMessage(bot, msg.channel, "A role is set, but it does not exist on this server.");
				return;
			}

			_sendMessage(bot, msg.channel, "The EDSM distance submission role is: " + role.name);
		},
		permissions: [
			"administrator"
		]
	},
	"setEdsmSubmitRole": {
		usage: "[role]",
		help: "Set a role, or none, that is allowed to submit distances to EDSM.",
		process: function(args, bot, msg) {
			var role = compileArgs(args);

			if (!role) {
				if (!setConfigValue(msg.server, "EDSM_SUBMIT_ROLE")) {
					_sendMessage(bot, msg.channel, "There was a problem storing the setting.");
					return;
				}

				_sendMessage(bot, msg.channel, "The EDSM distance submission role has been cleared.");
				return;
			}

			var serverRole = getRoleByName(msg.server, role);

			if (!serverRole) {
				_sendMessage(bot, msg.channel, "Cannot find the role " + role);
				return;
			}

			if (!setConfigValue(msg.server, "EDSM_SUBMIT_ROLE", serverRole.id)) {
				_sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			_sendMessage(bot, msg.channel, "The EDSM distance submission role has been set to: " + serverRole.name);
		},
		permissions: [
			"administrator"
		]
	},
	"getEdsmSubmitRequireUser": {
		help: "See if EDSM user registration is required to submit distances.",
		process: function(args, bot, msg) {
			var edsmSubmitRequireUser = getConfigValue(msg.server, "EDSM_SUBMIT_REQUIRE_USER");

			if (!edsmSubmitRequireUser) {
				_sendMessage(bot, msg.channel, "The bot does not require EDSM user registration to allow distance submission to EDSM.");
				return;
			}

			_sendMessage(bot, msg.channel, "The bot does require EDSM user registration to allow distance submissions to EDSM.");
		},
		permissions: [
			"administrator"
		]
	},
	"setEdsmSubmitRequireUser": {
		usage: "<1|0>",
		help: "Set whether or not EDSM user registration is required to submit distances.",
		process: function(args, bot, msg) {
			var edsmSubmitRequireUser = Number(compileArgs(args));

			if (edsmSubmitRequireUser != 0 && edsmSubmitRequireUser != 1) {
				_sendMessage(bot, msg.channel, "Invalid value.");
				return;
			}

			if (!setConfigValue(msg.server, "EDSM_SUBMIT_REQUIRE_USER", edsmSubmitRequireUser)) {
				_sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			if (edsmSubmitRequireUser == 0) {
				_sendMessage(bot, msg.channel, "The bot will no longer require EDSM user registration to allow distance submissions to EDSM.");
				return;
			}

			_sendMessage(bot, msg.channel, "The bot will from now on require EDSM user registration to allow distance submissions to EDSM.");
		},
		permissions: [
			"administrator"
		]
	},
	"help": {
		help: "Display help for this bot.",
		process: function(args, bot, msg) {
			var output = VERSION + " commands:";
			var key;
			var commandPrefix = getConfigValue(msg.server, "COMMAND_PREFIX");
			var nameSeparator = getConfigValue(msg.server, "NAME_SEPARATOR");

			for (key in commands) {
				output += "\n\t" + commandPrefix + key;
				var usage = commands[key].usage;

				if (usage) {
					output += " " + usage;
				}

				output += "\n\t\t\t";
				output += commands[key].help;
			}

			output = output.replace(/#NAME_SEPARATOR#/g, nameSeparator);

			// console.log(output);
			_sendMessage(bot, msg.channel, "Help sent as private message.");
			_sendMessage(bot, msg.author, output);
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

	var ignoredUsers = getConfigValue(message.server, "IGNORE_USERS");

	if (ignoredUsers.length > 0) {
		var index = ignoredUsers.indexOf(message.author.id);

		if (index > -1) {
			return;
		}
	}

	var ignoredChannels = getConfigValue(message.server, "IGNORE_CHANNELS");

	if (ignoredChannels.length > 0) {
		var index = ignoredChannels.indexOf(message.channel.id);

		if (index > -1) {
			return;
		}
	}

	var processed = 0;
	var messageContent = "";
	var respondToCommands = getConfigValue(message.server, "RESPOND_TO_COMMANDS");
	var respondToMentions = getConfigValue(message.server, "RESPOND_TO_MENTIONS");

	if (respondToMentions) {
		var mentionString = FGEBot.user.mention();
		var mentionStringRenamed = getUserMentionRenamed(FGEBot.user);

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

	var commandPrefix = getConfigValue(message.server, "COMMAND_PREFIX");

	if (!processed && respondToCommands && message.content.startsWith(commandPrefix)) {
		processed = 1;
		messageContent = message.content.substr(commandPrefix.length);
	}

	if (processed == 1) {
		var args = messageContent.split(" ");
		var cmd = commands[args[0]];

		if (cmd) {
			if (cmd.permissions && cmd.permissions.length>0) {
				if (message.channel.isPrivate) {
					_sendMessage(FGEBot, message.channel, "Cannot execute " + args[0] + " through private messages.");
					return;
				}

				var userPermissions = message.channel.permissionsOf(message.author);

				for (var x=0; x<cmd.permissions.length; x++) {
					if (!userPermissions.hasPermission(cmd.permissions[x])) {
						_sendMessage(FGEBot, message.channel, "Insufficient permissions to execute " + args[0]);
						return;
					}
				}
			}

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
					//_sendMessage(FGEBot, message.channel, "Command " + message.content + " failed.\n" + e.stack);
				}
			}
		}
	}
}

function handleUserStatusChange(oldUser, newUser) {
	/*if (oldUser && oldUser.game) {
		console.log("Old: " + oldUser.game.name);
	}

	if (newUser && newUser.game) {
		console.log("New: " + newUser.game.name);
	}

	if (!oldUser.game && newUser.game) {
		console.log(newUser.name + " has started playing " + newUser.game.name);
	}

	if (oldUser.game && !newUser.game) {
		console.log(newUser.name + " has stopped playing " + oldUser.game.name);
	}*/

	if (newUser.status != "offline") {
		if (messagebox.hasOwnProperty(newUser.id)) {
			console.log("Found a message for " + newUser.id);
			var message = messagebox[user.id];
			var channel = FGEBot.channels.get("id", message.channel);
			delete messagebox[user.id];
			updateMessagebox();
			_sendMessage(FGEBot, channel, message.content);
		}
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

function handleNewMember(server, user) {
	console.log("New user " + user.name + " on server " + server.name);
}

function handleMemberRemoved(server, user) {
	console.log(user.name + " has left the server " + server.name + " or has been removed.");
}

FGEBot.on("message", handleMessage);
FGEBot.on("presence", handleUserStatusChange);
FGEBot.on("disconnected", handleDisconnect);
FGEBot.on("serverNewMember", handleNewMember);
FGEBot.on("serverMemberRemoved", handleMemberRemoved);

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
