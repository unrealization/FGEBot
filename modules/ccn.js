var ccn_edsm = require("../api/ccn.js");
var botFunctions = require("../bot_functions.js");

//
const VERSION = "0.9.7.101";
const DISCORDID = 209372315673165825;

var defaultModuleConfig = {
	"CCN_PROXIMITY_ROLE": "",
	"CCN_EDSM_USE_BETASERVER": 0,
	"CCN_EDSM_ID": "",
	"CCN_EDSM_APIKEY": "",
};

//
function newMemberHandler(bot, server, user) {
	var output = "Welcome to the Colonia Citizens Network, " + user.name + "\n\n";
	output += "In order to make the most out of your experience here we have set up a number of roles which you can assign to yourself, using our bot Jeeves in our **#bots** channel. These roles allow access to special channels dedicated to different topics, where you can meet players who share your interests.\n";
	output += "The bot commands **roles**, **join** and **leave** will help you to find out which roles are currently available for you to use, and allow you to give yourself a role, or take it away again.\n";
	output += "Please note that all bot commands have to be prefixed by pinging the bot using **@Jeeves**\n"
	output += "To query what roles are available, type:\n\t**@Jeeves roles**\n\n";
	output += "To assign the role 'Exploration Wing Member':\n\t**@Jeeves join Exploration Wing Member**\n\n";
	output += "To remove the role 'Exploration Wing Member':\n\t**@Jeeves leave Exploration Wing Member**\n\n";
	output += "Our bot can also do quite a few other things to help you. Feel free to ask him for help using **@Jeeves help**\n"
	output += "\n";
	output += "Have a pleasant stay on the Colonia Citizens Network Discord.\n";
	output += "The CCN Team";

	console.log(user.name + " joined " + server.name);
	botFunctions.sendMessage(bot, user, output);
	return false;
}

function processRoleQueue(bot, roleQueue) {
	function roleHandler(error) {
		if (error) {
			console.log("Waiting");
			roleQueue.unshift(roleAction);
			setTimeout(processRoleQueue(bot, roleQueue), 10000);
		} else {
			processRoleQueue(bot, roleQueue);
		}
	}

	if (roleQueue.length == 0) {
		return;
	}

	var roleAction = roleQueue.shift();

	if (roleAction.action == "add") {
		bot.addMemberToRole(roleAction.user, roleAction.role, roleHandler);
	}

	if (roleAction.action == "remove") {
		bot.removeMemberFromRole(roleAction.user, roleAction.role, roleHandler);
	}
}

function setUseBetaServer(args, bot, msg) {
	var edsmUseBetaServer = botFunctions.getConfigValue(msg.server, "CCN_EDSM_USE_BETASERVER");
	ccn_edsm.setUseBetaServer(edsmUseBetaServer);
}

//
function proximityCheck(args, bot, msg) {
	function callback(data) {
		if (!data) {
			botFunctions.sendMessage(bot, msg.channel, "Error");
			return;
		}

		if (!data.commanders) {
			botFunctions.sendMessage(bot, msg.channel, "Error");
			return;
		}

		var serverMembers = msg.server.members;
		var proximityRoleMembers = msg.server.usersWithRole(proximityRole);
		var output = "";
		var roleQueue = [];
		var edsm = botFunctions.getModule(msg.server, "edsm");

		if (!edsm) {
			botFunctions.sendMessage(bot, msg.channel, "The EDSM module is not available on this Discord.");
			return;
		}

		for (var index=0; index<serverMembers.length; index++) {
			var edsmUser;

			if (edsm) {
				edsmUser = edsm.getEdsmUser(serverMembers[index]);
			}

			if (!edsmUser) {
				continue;
			}

			var dataIndex = data.commanders.indexOf(edsmUser);
			var roleIndex = proximityRoleMembers.indexOf(serverMembers[index]);

			if (dataIndex > -1 && roleIndex == -1) {
				output += serverMembers[index].name + " has arrived in Colonia." + "\n";
				var roleAction = {
					"action": "add",
					"user": serverMembers[index],
					"role": proximityRole
				};
				roleQueue.push(roleAction);
			}

			if (dataIndex == -1 && roleIndex > -1) {
				output += serverMembers[index].name + " is no longer in Colonia." + "\n";
				var roleAction = {
					"action": "remove",
					"user": serverMembers[index],
					"role": proximityRole
				};
				roleQueue.push(roleAction);
			}
		}

		if (roleQueue.length == 0) {
			botFunctions.sendMessage(bot, msg.channel, "No changes to process.");
			return;
		}

		processRoleQueue(bot, roleQueue);
		botFunctions.sendMessage(bot, msg.channel, output);
	}

	var proximityRoleId = botFunctions.getConfigValue(msg.server, "CCN_PROXIMITY_ROLE");

	if (!proximityRoleId) {
		botFunctions.sendMessage(bot, msg.channel, "No proximity role has been set.");
		return;
	}

	var proximityRole = botFunctions.getRole(msg.server, proximityRoleId);

	if (!proximityRole) {
		botFunctions.sendMessage(bot, msg.channel, "A proximity role has been set, but it does not exist on this server.");
		return;
	}

	var edsmId = botFunctions.getConfigValue(msg.server, "CCN_EDSM_ID");

	if (!edsmId) {
		botFunctions.sendMessage(bot, msg.channel, "No EDSM ID has been set for the bot.");
		return;
	}

	var edsmApiKey = botFunctions.getConfigValue(msg.server, "CCN_EDSM_APIKEY");

	if (!edsmApiKey) {
		botFunctions.sendMessage(bot, msg.channel, "No API key has been set for the bot.");
		return;
	}

	botFunctions.sendMessage(bot, msg.channel, "This might take a while.");
	ccn_edsm.getColoniaCommanders(edsmId, edsmApiKey, 1000, callback);
}

//
var commands = {
	"proximityCheck": {
		help: "Automatically assign roles based on Commander location",
		process: proximityCheck,
		permissions: [
			"administrator"
		]
	},
	"test": {
		help: "Test",
		process: function(args, bot, msg) {
			newMemberHandler(bot, msg.server, msg.author);
		},
		permissions: [
			"administrator"
		]
	},
	"getProximityRole": {
		help: "Shows the currently set proximity role.",
		process: null,
		permissions: [
			"administrator"
		]
	},
	"setProximityRole": {
		usage: "[role]",
		help: "Set a role, or none, to assign to users who are in Colonia.",
		process: null,
		permissions: [
			"administrator"
		]
	},
	"getEdsmId": {
	},
	"setEdsmId": {
	},
	"getEdsmApiKey": {
	},
	"setEdsmApiKey": {
	},
};

//
exports.VERSION = VERSION;
exports.DISCORDID = DISCORDID;
exports.defaultModuleConfig = defaultModuleConfig;
exports.preprocess = setUseBetaServer;
//exports.onNewMember = newMemberHandler;
exports.commands = commands;
