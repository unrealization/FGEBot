var edsm = require("../api/edsm.js");
var botFunctions = require("../bot_functions.js");

var defaultModuleConfig = {
	"EDSM_USE_BETASERVER": 1,
	"TRILATERATION_CONTACT_ROLE": "",
	"EDSM_ENABLE_SUBMISSION": 0,
	"EDSM_SUBMIT_ROLE": "",
	"EDSM_SUBMIT_REQUIRE_USER": 1,
};

var edsmMappings = botFunctions.readJSON("./edsmMappings.json");

if (!edsmMappings) {
	edsmMappings = {};
}

function updateEdsmMappings() {
	botFunctions.writeJSON(edsmMappings, "./edsmMappings.json");
}

function allowSubmission(bot, server, user) {
	if (!server) {
		return 0;
	}

	var edsmEnableSubmission = botFunctions.getConfigValue(server, "EDSM_ENABLE_SUBMISSION");

	if (edsmEnableSubmission == 0) {
		return 0;
	}

	var edsmSubmitRole = botFunctions.getConfigValue(server, "EDSM_SUBMIT_ROLE");

	if (edsmSubmitRole) {
		var serverRole = botFunctions.getRole(server, edsmSubmitRole);

		if (!serverRole) {
			return 0;
		}

		if (!bot.memberHasRole(user, serverRole)) {
			return 0;
		}
	}

	var edsmSubmitRequireUser = botFunctions.getConfigValue(server, "EDSM_SUBMIT_REQUIRE_USER");

	if (edsmSubmitRequireUser == 1) {
		var edsmUser = getEdsmUser(user);

		if (!edsmUser) {
			return 0;
		}
	}

	return 1;
}

function getEdsmUser(user) {
	if (edsmMappings[user.mention()]) {
		console.log("Updating EDSM mapping.");
		edsmMappings[user.id] = edsmMappings[user.mention()]
		delete edsmMappings[user.mention()];
		updateEdsmMappings();
	}

	if (!edsmMappings[user.id]) {
		return null;
	} else {
		return edsmMappings[user.id];
	}
}

function setUseBetaServer(args, bot, msg) {
	var edsmUseBetaServer = botFunctions.getConfigValue(msg.server, "EDSM_USE_BETASERVER");
	edsm.setUseBetaServer(edsmUseBetaServer);
}

var commands = {
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
			var commanderName = botFunctions.compileArgs(args);

			if (!commanderName) {
				var edsmUser = getEdsmUser(msg.author);

				if (!edsmUser) {
					botFunctions.sendMessage(bot, msg.channel, "I don't know whom I should locate.");
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
		process: function(args,bot,msg) { edsm.getSystemCoordinates(botFunctions.compileArgs(args), bot, msg); }
	},
	"cmdrcoords": {
		usage: "[name]",
		help: "Gets the last reported location of a commander, including system coordinates, if they are available",
		process: function(args, bot, msg) {
			var commanderName = botFunctions.compileArgs(args);

			if (!commanderName) {
				var edsmUser = getEdsmUser(msg.author);

				if (!edsmUser) {
					botFunctions.sendMessage(bot, msg.channel, "I don't know whom I should locate.");
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
			var nameSeparator = botFunctions.getConfigValue(msg.server, "NAME_SEPARATOR");
			var query = botFunctions.compileArgs(args).split(nameSeparator);
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
				botFunctions.sendMessage(bot, msg.channel, first + " = " + second + ", which doesn't really make all that much sense.");
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
			var nameSeparator = botFunctions.getConfigValue(msg.server, "NAME_SEPARATOR");

			if (rangeRegEx.test(lastArg)) {
				range = lastArg.substr(2);
				args.pop();
			}

			var query = botFunctions.compileArgs(args).split(nameSeparator);
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
				botFunctions.sendMessage(bot, msg.channel, first + " = " + second + ", which doesn't really make all that much sense.");
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

			var name = botFunctions.compileArgs(args);

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

			var coords = botFunctions.compileArgs(args).split(" ");

			if (coords.length < 3) {
				botFunctions.sendMessage(bot, msg.channel, "Not enough values");
				return;
			}

			var x = coords[0].trim();
			var y = coords[1].trim();
			var z = coords[2].trim();

			var numRegEx = new RegExp('^(-)?\\d+(\\.\\d{1,2})?$');

			if (!numRegEx.test(x)) {
				botFunctions.sendMessage(bot, msg.channel, x + " is not a valid value.");
				return;
			}

			if (!numRegEx.test(y)) {
				botFunctions.sendMessage(bot, msg.channel, y + " is not a valid value.");
				return;
			}

			if (!numRegEx.test(z)) {
				botFunctions.sendMessage(bot, msg.channel, z + " is not a valid value.");
				return;
			}

			edsm.getNearbySystemsByCoordinates(x, y, z, range, bot, msg);
		}
	},
	"waypoints": {
		usage: "<origin> #NAME_SEPARATOR# <destination>",
		help: "Get a list of waypoints between the origin and destination to help in-game plotting.",
		process: function(args, bot, msg) {
			var nameSeparator = botFunctions.getConfigValue(msg.server, "NAME_SEPARATOR");
			var systems = botFunctions.compileArgs(args).split(nameSeparator);
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
				botFunctions.sendMessage(bot, msg.channel, origin + " = " + destination + ", which doesn't really make all that much sense.");
				return;
			}

			edsm.getWaypoints(origin, destination, 1000, bot, msg);
		}
	},
	"register": {
		usage: "<name>",
		help: "Register a mapping from your Discord user to your EDSM user.",
		process: function(args, bot, msg) {
			var edsmUser = botFunctions.compileArgs(args);

			if (!edsmUser) {
				botFunctions.sendMessage(bot, msg.channel, "Providing an EDSM username may have been helpful.");
				return;
			}

			edsmMappings[msg.author.id] = edsmUser;
			updateEdsmMappings();
			botFunctions.sendMessage(bot, msg.channel, "Mapping stored.");
		}
	},
	"unregister": {
		help: "Delete the mapping from your Discord user to your EDSM user.",
		process: function(args, bot, msg) {
			if (!edsmMappings[msg.author.id]) {
				bot.sendMessage(msg.channel, "No EDSM Username found.");
			} else {
				delete edsmMappings[msg.author.id];
				updateEdsmMappings();
				botFunctions.sendMessage(bot, msg.channel, "Mapping removed.");
			}
		}
	},
	"getEdsmUser": {
		usage: "[name]",
		help: "Get your or the given user's EDSM Username.",
		process: function(args, bot, msg) {
			var user = botFunctions.compileArgs(args);
			var serverUser = msg.author;

			if (user) {
				var serverUser = botFunctions.getUserByName(msg.server, user);

				if (!serverUser) {
					botFunctions.sendMessage(bot, msg.channel, "I cannot find the user " + user);
					return;
				}
			}

			var edsmUser = getEdsmUser(serverUser);

			if (!edsmUser) {
				botFunctions.sendMessage(bot, msg.channel, "No EDSM Username found for " + serverUser.name);
			} else {
				botFunctions.sendMessage(bot, msg.channel, edsmUser);
			}
		}
	},
	"trilaterate": {
		usage: "<system>",
		help: "Ask for help to trilaterate a system.",
		process: function(args, bot, msg) {
			var system = botFunctions.compileArgs(args);
			var role = botFunctions.getConfigValue(msg.server, "TRILATERATION_CONTACT_ROLE");

			if (!role) {
				botFunctions.sendMessage(bot, msg.channel, "It appears as if there is nobody available to help you with this.");
				return;
			}

			var serverRole = botFunctions.getRole(msg.server, role);

			if (!serverRole) {
				botFunctions.sendMessage(bot, msg.channel, "It appears as if there is nobody available to help you with this.");
				return;
			}

			var message = serverRole.mention() + "\n";
			message += msg.author + " is asking for your help to trilaterate the system " + system + ".\n";

			var edsmEnableSubmission = botFunctions.getConfigValue(msg.server, "EDSM_ENABLE_SUBMISSION");

			if (edsmEnableSubmission == 1) {
				var commandPrefix = botFunctions.getConfigValue(msg.server, "COMMAND_PREFIX");
				message += "Please submit your distances using the " + commandPrefix + "submit command if you are permitted to do so.";
			}

			botFunctions.sendMessage(bot, msg.channel, message);
		}
	},
	"submit": {
		usage: "<targetSystem> #NAME_SEPARATOR# <yourSystem> <distance>",
		help: "Submit the distance to the given system.",
		process: function(args, bot, msg) {
			if (!allowSubmission(bot, msg.server, msg.author)) {
				botFunctions.sendMessage(bot, msg.channel, "You are not allowed to submit distances.");
				return;
			}

			var distance = args.pop();
			var distanceRegEx = new RegExp('^\\d+(\\.\\d{1,2})?$');

			if (!distanceRegEx.test(distance)) {
				botFunctions.sendMessage(bot, msg.channel, "Invalid distance.");
				return;
			}

			var nameSeparator = botFunctions.getConfigValue(msg.server, "NAME_SEPARATOR");
			var systems = botFunctions.compileArgs(args).split(nameSeparator);

			if (systems.length != 2) {
				botFunctions.sendMessage(bot, msg.channel, "You have not provided enough system names.");
				return;
			}

			var targetSystem = systems[0].trim();
			var referenceSystem = systems[1].trim();
			var edsmUser = getEdsmUser(msg.author);
			edsm.submitDistance(targetSystem, referenceSystem, distance, edsmUser, bot, msg);
		}
	},
	"getEdsmUseBetaServer": {
		help: "Check if the bot uses the Live or Beta Server for EDSM",
		process: function(args, bot, msg) {
			var edsmUseBetaServer = botFunctions.getConfigValue(msg.server, "EDSM_USE_BETASERVER");

			if (edsmUseBetaServer == 0) {
				botFunctions.sendMessage(bot, msg.channel, "The bot uses the EDSM Live Server.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The bot uses the EDSM Beta Server.");
		},
		permissions: [
			"administrator"
		]
	},
	"setEdsmUseBetaServer": {
		usage: "<1|0>",
		help: "Set if the bot should use the Live or Beta Server for EDSM.",
		process: function(args, bot, msg) {
			var edsmUseBetaServer = Number(botFunctions.compileArgs(args));

			if (edsmUseBetaServer != 0 && edsmUseBetaServer != 1) {
				botFunctions.sendMessage(bot, msg.channel, "Invalid value.");
				return;
			}

			if (!botFunctions.setConfigValue(msg.server, "EDSM_USE_BETASERVER", edsmUseBetaServer)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			if (edsmUseBetaServer == 0) {
				botFunctions.sendMessage(bot, msg.channel, "The bot will now use the EDSM Live Server.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The bot will now use the EDSM Beta Server.");
		},
		permissions: [
			"administrator"
		]
	},
	"getTrilaterationContactRole": {
		help: "Get the role that will be contacted in case of trilateration requests.",
		process: function(args, bot, msg) {
			var trilaterationContactRole= botFunctions.getConfigValue(msg.server, "TRILATERATION_CONTACT_ROLE");

			if (!trilaterationContactRole) {
				botFunctions.sendMessage(bot, msg.channel, "No trilateration contact role has been set.");
				return;
			}

			var role = botFunctions.getRole(msg.server, trilaterationContactRole);

			if (!role) {
				botFunctions.sendMessage(bot, msg.channel, "A role is set, but it does not exist on this server.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The trilateration contact role is: " + role.name);
		},
		permissions: [
			"administrator"
		]
	},
	"setTrilaterationContactRole": {
		usage: "[role]",
		help: "Set a role, or none, that will be contacted in case of trilateration requests.",
		process: function(args, bot, msg) {
			var role = botFunctions.compileArgs(args);

			if (!role) {
				if (!botFunctions.setConfigValue(msg.server, "TRILATERATION_CONTACT_ROLE", "")) {
					botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
					return;
				}

				botFunctions.sendMessage(bot, msg.channel, "The trilateration contact role has been cleared.");
				return;
			}

			var serverRole = botFunctions.getRoleByName(msg.server, role);

			if (!serverRole) {
				botFunctions.sendMessage(bot, msg.channel, "Cannot find the role " + role);
				return;
			}

			if (!botFunctions.setConfigValue(msg.server, "TRILATERATION_CONTACT_ROLE", serverRole.id)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The trilateration contact role has been set to " + serverRole.name);
		},
		permissions: [
			"administrator"
		]
	},
	"getEdsmEnableSubmission": {
		help: "See if EDSM distance submissions are enabled.",
		process: function(args, bot, msg) {
			var edsmEnableSubmission = botFunctions.getConfigValue(msg.server, "EDSM_ENABLE_SUBMISSION");

			if (edsmEnableSubmission == 0) {
				botFunctions.sendMessage(bot, msg.channel, "The bot does not allow distance submissions to EDSM.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The bot allows distance submissions to EDSM.");
		},
		permissions: [
			"administrator"
		]
	},
	"setEdsmEnableSubmission": {
		usage: "<1|0>",
		help: "Set whether or not the bot should allow distance submissions to EDSM.",
		process: function(args, bot, msg) {
			var edsmEnableSubmission = Number(botFunctions.compileArgs(args));

			if (edsmEnableSubmission != 0 && edsmEnableSubmission != 1) {
				botFunctions.sendMessage(bot, msg.channel, "Invalid value.");
				return;
			}

			if (!botFunctions.setConfigValue(msg.server, "EDSM_ENABLE_SUBMISSION", edsmEnableSubmission)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			if (edsmEnableSubmission == 0) {
				botFunctions.sendMessage(bot, msg.channel, "The bot will now no longer allow distance submissions to EDSM.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The bot will from now on allow distance submissions to EDSM.");
		},
		permissions: [
			"administrator"
		]
	},
	"getEdsmSubmitRole": {
		help: "Get the role that is allowed to submit distances to EDSM.",
		process: function(args, bot, msg) {
			var edsmSubmitRole = botFunctions.getConfigValue(msg.server, "EDSM_SUBMIT_ROLE");

			if (!edsmSubmitRole) {
				botFunctions.sendMessage(bot, msg.channel, "No EDSM distance submission role has been set.");
				return;
			}

			var role = botFunctions.getRole(msg.server, edsmSubmitRole);

			if (!role) {
				botFunctions.sendMessage(bot, msg.channel, "A role is set, but it does not exist on this server.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The EDSM distance submission role is: " + role.name);
		},
		permissions: [
			"administrator"
		]
	},
	"setEdsmSubmitRole": {
		usage: "[role]",
		help: "Set a role, or none, that is allowed to submit distances to EDSM.",
		process: function(args, bot, msg) {
			var role = botFunctions.compileArgs(args);

			if (!role) {
				if (!botFunctions.setConfigValue(msg.server, "EDSM_SUBMIT_ROLE")) {
					botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
					return;
				}

				botFunctions.sendMessage(bot, msg.channel, "The EDSM distance submission role has been cleared.");
				return;
			}

			var serverRole = botFunctions.getRoleByName(msg.server, role);

			if (!serverRole) {
				botFunctions.sendMessage(bot, msg.channel, "Cannot find the role " + role);
				return;
			}

			if (!botFunctions.setConfigValue(msg.server, "EDSM_SUBMIT_ROLE", serverRole.id)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The EDSM distance submission role has been set to: " + serverRole.name);
		},
		permissions: [
			"administrator"
		]
	},
	"getEdsmSubmitRequireUser": {
		help: "See if EDSM user registration is required to submit distances.",
		process: function(args, bot, msg) {
			var edsmSubmitRequireUser = botFunctions.getConfigValue(msg.server, "EDSM_SUBMIT_REQUIRE_USER");

			if (edsmSubmitRequireUser == 0) {
				botFunctions.sendMessage(bot, msg.channel, "The bot does not require EDSM user registration to allow distance submission to EDSM.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The bot does require EDSM user registration to allow distance submissions to EDSM.");
		},
		permissions: [
			"administrator"
		]
	},
	"setEdsmSubmitRequireUser": {
		usage: "<1|0>",
		help: "Set whether or not EDSM user registration is required to submit distances.",
		process: function(args, bot, msg) {
			var edsmSubmitRequireUser = Number(botFunctions.compileArgs(args));

			if (edsmSubmitRequireUser != 0 && edsmSubmitRequireUser != 1) {
				botFunctions.sendMessage(bot, msg.channel, "Invalid value.");
				return;
			}

			if (!botFunctions.setConfigValue(msg.server, "EDSM_SUBMIT_REQUIRE_USER", edsmSubmitRequireUser)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			if (edsmSubmitRequireUser == 0) {
				botFunctions.sendMessage(bot, msg.channel, "The bot will no longer require EDSM user registration to allow distance submissions to EDSM.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The bot will from now on require EDSM user registration to allow distance submissions to EDSM.");
		},
		permissions: [
			"administrator"
		]
	},
};

exports.getEdsmUser = getEdsmUser;

exports.defaultModuleConfig = defaultModuleConfig;
exports.commands = commands;
exports.preprocess = setUseBetaServer;
