var botFunctions = require("../bot_functions.js");

const VERSION = "1.1";

var defaultModuleConfig = {
	"RATSIGNAL_CONTACT_ROLE": "",
	"RATSIGNAL_EMERGENCY_CHANNEL": "",
	"RATSIGNAL_FUEL_PROCEDURE_LINK": "",
};

var commands = {
	"ratsignal": {
		help: "Send an emergency call to the Fuel Rats",
		process: function(args, bot, msg) {
			var ratsignalContactRole = botFunctions.getConfigValue(msg.server, "RATSIGNAL_CONTACT_ROLE");
			var serverRole;

			if (ratsignalContactRole) {
				serverRole = botFunctions.getRole(msg.server, ratsignalContactRole);
			}

			var ratsignalFuelProcedureLink = botFunctions.getConfigValue(msg.server, "RATSIGNAL_FUEL_PROCEDURE_LINK");

			if (!serverRole && !ratsignalFuelProcedureLink) {
				botFunctions.sendMessage(bot, msg.channel, "Sadly I cannot help you at this time.");
				return;
			}

			var output = "";

			if (serverRole) {
				var ratsignalEmergencyChannel = botFunctions.getConfigValue(msg.server, "RATSIGNAL_EMERGENCY_CHANNEL");
				var serverChannel;

				if (ratsignalEmergencyChannel) {
					serverChannel = botFunctions.getChannel(msg.server, ratsignalEmergencyChannel);
				}

				var signalChannel = msg.channel;

				if (serverChannel) {
					signalChannel = serverChannel;
				}

				output = serverRole.mention() + " RAT SIGNAL\n";
				output += msg.author.mention() + " has run out of fuel and is in need of assistance!";

				//
				/*var edsm = botFunctions.getModule(msg.server, "edsm");

				if (edsm) {
					var edsmApi = edsm.getApiObject();

					if (edsmApi) {
						console.log("Ratsignal EDSM support enabled.");
						var edsmUser = edsm.getEdsmUser(msg.author);

						if (edsmUser) {
							//edsm.getCommanderCoordinates(edsmUser, bot, message);
						}
					}
				}*/
				//

				botFunctions.sendMessage(bot, signalChannel, output);

				output = msg.author.mention() + ", a rat signal has been sent.\n";

				if (ratsignalFuelProcedureLink) {
					output += "Stay calm and refer to the Emergency Fuel Procedures detailled here: " + ratsignalFuelProcedureLink + "\n";
				}

				if (msg.channel.id != signalChannel.id) {
					output += "Move to " + signalChannel.mention() + " and wait for your rescue.";
				}
			} else {
				output = "Please refer to the Emergency Fuel Procedures detailled here: " + ratsignalFuelProcedureLink;
			}

			botFunctions.sendMessage(bot, msg.channel, output);
		}
	},
	"getRatsignalContactRole": {
		help: "Get the current ratsignal contact role.",
		process: function(args, bot, msg) {
			var ratsignalContactRole = botFunctions.getConfigValue(msg.server, "RATSIGNAL_CONTACT_ROLE");

			if (!ratsignalContactRole) {
				botFunctions.sendMessage(bot, msg.channel, "No ratsignal contact role has been set.");
				return;
			}

			var role = botFunctions.getRole(msg.server, ratsignalContactRole);

			if (!role) {
				botFunctions.sendMessage(bot, msg.channel, "A role is set, but it does not exist on this server.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The ratsignal contact role is: " + role.name);
		},
		permissions: [
			"administrator"
		]
	},
	"setRatsignalContactRole": {
		usage: "[role]",
		help: "Sets a role, or none, as the role that will be contacted in case of a ratsignal.",
		process: function(args, bot, msg) {
			var role = botFunctions.compileArgs(args);

			if (!role) {
				if (!botFunctions.setConfigValue(msg.server, "RATSIGNAL_CONTACT_ROLE", "")) {
					botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
					return;
				}

				botFunctions.sendMessage(bot, msg.channel, "The ratsignal contact role has been cleared.");
				return;
			}

			var serverRole = botFunctions.getRoleByName(msg.server, role);

			if (!serverRole) {
				botFunctions.sendMessage(bot, msg.channel, "Cannot find the role " + role);
				return;
			}

			if (!botFunctions.setConfigValue(msg.server, "RATSIGNAL_CONTACT_ROLE", serverRole.id)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The ratsignal contact role has been set to: " + serverRole.name);
		},
		permissions: [
			"administrator"
		]
	},
	"getRatsignalEmergencyChannel": {
		help: "Get the current ratsignal emergency channel.",
		process: function(args, bot, msg) {
			var ratsignalEmergencyChannel = botFunctions.getConfigValue(msg.server, "RATSIGNAL_EMERGENCY_CHANNEL");

			if (!ratsignalEmergencyChannel) {
				botFunctions.sendMessage(bot, msg.channel, "No ratsignal emergency channel has been set.");
				return;
			}

			var channel = botFunctions.getChannel(msg.server, ratsignalEmergencyChannel);

			if (!channel) {
				botFunctions.sendMessage(bot, msg.channel, "A channel is set, but it does not exist on this server.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The ratsignal emergency channel is: " + channel.name);
		},
		permissions: [
			"administrator"
		]
	},
	"setRatsignalEmergencyChannel": {
		usage: "[channel]",
		help: "Sets a channel, or none, as the channel commanders will be directed towards in case of a ratsignal.",
		process: function(args, bot, msg) {
			var channel = botFunctions.compileArgs(args);

			if (!channel) {
				if (!botFunctions.setConfigValue(msg.server, "RATSIGNAL_EMERGENCY_CHANNEL", "")) {
					botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
					return;
				}

				botFunctions.sendMessage(bot, msg.channel, "The ratsignal emergency channel has been cleared.");
				return;
			}

			var serverChannel = botFunctions.getChannelByName(msg.server, channel);

			if (!serverChannel) {
				botFunctions.sendMessage(bot, msg.channel, "Cannot find the channel " + channel);
				return;
			}

			if (!botFunctions.setConfigValue(msg.server, "RATSIGNAL_EMERGENCY_CHANNEL", serverChannel.id)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The ratsignal emergency channel has been set to " + serverChannel.name);
		},
		permissions: [
			"administrator"
		]
	},
	"getRatsignalFuelProcedureLink": {
		help: "Get the current ratsignal fuel procedure link.",
		process: function(args, bot, msg) {
			var ratsignalFuelProcedureLink = botFunctions.getConfigValue(msg.server, "RATSIGNAL_FUEL_PROCEDURE_LINK");

			if (!ratsignalFuelProcedureLink) {
				botFunctions.sendMessage(bot, msg.channel, "No ratsignal fuel procedure link has been set.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The ratsignal fuel procedure link is: " + ratsignalFuelProcedureLink);
		},
		permissions: [
			"administrator"
		]
	},
	"setRatsignalFuelProcedureLink": {
		usage: "[link]",
		help: "Sets a link, or none, as the link commanders will be sent for emergency fuel procedures in case of a ratsignal.",
		process: function(args, bot, msg) {
			var link = botFunctions.compileArgs(args);

			if (!link) {
				if (!botFunctions.setConfigValue(msg.server, "RATSIGNAL_FUEL_PROCEDURE_LINK", "")) {
					botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
					return;
				}

				botFunctions.sendMessage(bot, msg.channel, "The ratsignal fuel procedure link has been cleared.");
				return;
			}

			if (!botFunctions.setConfigValue(msg.server, "RATSIGNAL_FUEL_PROCEDURE_LINK", link)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The ratsignal fuel procedure link has been set to " + link);
		},
		permissions: [
			"administrator"
		]
	},
};

exports.VERSION = VERSION;
exports.defaultModuleConfig = defaultModuleConfig;
exports.commands = commands;
