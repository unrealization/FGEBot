var ccn_edsm = require("../api/ccn.js");
var botFunctions = require("../bot_functions.js");

//
const VERSION = "0.6.1";
//const DISCORDID = 212228086849077248;
const DISCORDID = 209372315673165825;

var defaultModuleConfig = {
	"CCN_PROXIMITY_ROLE": "",
	"CCN_EDSM_USE_BETASERVER": 0,
	"CCN_EDSM_ID": "",
	"CCN_EDSM_APIKEY": "",
};

//
function getApiObject(server) {
	var edsmUseBetaServer = botFunctions.getConfigValue(server, "CCN_EDSM_USE_BETASERVER");
	ccn_edsm.setUseBetaServer(edsmUseBetaServer);
	return ccn_edsm;
}

function setUseBetaServer(args, bot, msg) {
	var edsmUseBetaServer = botFunctions.getConfigValue(msg.server, "CCN_EDSM_USE_BETASERVER");
	ccn_edsm.setUseBetaServer(edsmUseBetaServer);
}

//
function proximityCheck(args, bot, msg) {
	function roleHandler(error) {
		if (error) {
			console.log("Error: " + error);
		}
	}

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

		for (var index=0; index<serverMembers.length; index++) {
			var hasProximityRole = bot.memberHasRole(serverMembers[index], proximityRole);

			var edsm = botFunctions.getModule(msg.server, "edsm");
			var edsmUser;

			if (edsm) {
				edsmUser = edsm.getEdsmUser(serverMembers[index]);
			}

			var dataIndex;

			if (edsmUser) {
				dataIndex = data.commanders.indexOf(edsmUser.toLowerCase());
			} else {
				dataIndex = data.commanders.indexOf(serverMembers[index].name.toLowerCase());
			}

			if (dataIndex > -1 && hasProximityRole == null) {
				//	bot.addMemberToRole(user, serverRole, roleHandler);
				botFunctions.sendMessage(bot, msg.channel, serverMembers[index].name + " has arrived in Colonia.");
			}

			if (dataIndex == -1 && hasProximityRole == proximityRole) {
				//	bot.removeMemberFromRole(user, serverRole, roleHandler);
				botFunctions.sendMessage(bot, msg.channel, serverMembers[index].name + " is no longer in Colonia.");
			}
		}
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

	ccn_edsm.getColoniaCommanders(edsmId, edsmApiKey, 200, callback);
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
};

//
exports.VERSION = VERSION;
exports.DISCORDID = DISCORDID;
exports.defaultModuleConfig = defaultModuleConfig;
exports.getApiObject = getApiObject;
exports.preprocess = setUseBetaServer;
exports.commands = commands;
