var botFunctions = require("../bot_functions.js");

const VERSION = "0.6 Beta";

var defaultModuleConfig = {
	"SECURITY_CONTACT_ROLE": "",
	"SECURITY_EMERGENCY_CHANNEL": "",
	"SECURITY_EMERGENCY_PROCEDURE_LINK": "",
};

var commands = {
	"security": {
		help: "Send an emergency call to the Security Response Team",
		process: function(args, bot, msg) {
			function callback(error, message) {
				var edsm = botFunctions.getModule(msg.server, "edsm");

				if (edsm) {
					console.log("Security EDSM support enabled.");
					var edsmUser = edsm.getEdsmUser(msg.author);

					if (edsmUser) {
						//edsm.getCommanderCoordinates(edsmUser, bot, message);
					}
				}
			}

			var securityContactRole = botFunctions.getConfigValue(msg.server, "SECURITY_CONTACT_ROLE");

			if (!securityContactRole) {
				botFunctions.sendMessage(bot, msg.channel, "Sadly there is nobody here to help you.");
				return;
			}

			var role = botFunctions.getRole(msg.server, securityContactRole);

			if (!role) {
				botFunctions.sendMessage(bot, msg.channel, "Sadly there is nobody here to help you.");
				return;
			}

			var output = role.mention() + " ASSEMBLE! ;-)\n";
			output += msg.author + " has reported a security incident and is in need of assistance!";

			var channel = msg.channel;
			var securityEmergencyChannel = botFunctions.getConfigValue(msg.server, "SECURITY_EMERGENCY_CHANNEL");

			if (securityEmergencyChannel) {
				var serverChannel = botFunctions.getChannel(msg.server, securityEmergencyChannel);

				if (serverChannel) {
					channel = serverChannel;
				}
			}

			bot.sendMessage(channel, output, {}, callback);

			output = msg.author.mention() + ", an emergency signal has been sent.\n";

			var securityEmergencyProcedureLink = botFunctions.getConfigValue(msg.server, "SECURITY_EMERGENCY_PROCEDURE_LINK");

			if (securityEmergencyProcedureLink) {
				output += "Stay calm and refer to the Emergency Procedures detailled here: " + securityEmergencyProcedureLink + "\n";
			}

			/*if (msg.channel.id != channel.id) {
				output += "Move to " + channel.mention() + " and wait for your rescue.";
			}*/

			botFunctions.sendMessage(bot, msg.channel, output);
		}
	},
	"getSecurityContactRole": {
		help: "Get the current security contact role.",
		process: function(args, bot, msg) {
			var securityContactRole = botFunctions.getConfigValue(msg.server, "SECURITY_CONTACT_ROLE");

			if (!securityContactRole) {
				botFunctions.sendMessage(bot, msg.channel, "No security contact role has been set.");
				return;
			}

			var role = botFunctions.getRole(msg.server, securityContactRole);

			if (!role) {
				botFunctions.sendMessage(bot, msg.channel, "A role is set, but it does not exist on this server.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The security contact role is: " + role.name);
		},
		permissions: [
			"administrator"
		]
	},
	"setSecurityContactRole": {
		usage: "[role]",
		help: "Sets a role, or none, as the role that will be contacted in case of a security incident.",
		process: function(args, bot, msg) {
			var role = botFunctions.compileArgs(args);

			if (!role) {
				if (!botFunctions.setConfigValue(msg.server, "SECURITY_CONTACT_ROLE", "")) {
					botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
					return;
				}

				botFunctions.sendMessage(bot, msg.channel, "The security contact role has been cleared.");
				return;
			}

			var serverRole = botFunctions.getRoleByName(msg.server, role);

			if (!serverRole) {
				botFunctions.sendMessage(bot, msg.channel, "Cannot find the role " + role);
				return;
			}

			if (!botFunctions.setConfigValue(msg.server, "SECURITY_CONTACT_ROLE", serverRole.id)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The security contact role has been set to: " + serverRole.name);
		},
		permissions: [
			"administrator"
		]
	},
	"getSecurityEmergencyChannel": {
		help: "Get the current security signal emergency channel.",
		process: function(args, bot, msg) {
			var securityEmergencyChannel = botFunctions.getConfigValue(msg.server, "SECURITY_EMERGENCY_CHANNEL");

			if (!securityEmergencyChannel) {
				botFunctions.sendMessage(bot, msg.channel, "No security signal emergency channel has been set.");
				return;
			}

			var serverChannel = botFunctions.getChannel(msg.server, securityEmergencyChannel);

			if (!serverChannel) {
				botFunctions.sendMessage(bot, msg.channel, "A channel is set, but it does not exist on this server.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The security signal emergency channel is: " + serverChannel.name);
		},
		permissions: [
			"administrator"
		]
	},
	"setSecurityEmergencyChannel": {
		usage: "[channel]",
		help: "Sets a channel, or none, as the channel where the security signal will be raised.",
		process: function(args, bot, msg) {
			var channel = botFunctions.compileArgs(args);

			if (!channel) {
				if (!botFunctions.setConfigValue(msg.server, "SECURITY_EMERGENCY_CHANNEL", "")) {
					botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
					return;
				}

				botFunctions.sendMessage(bot, msg.channel, "The security signal emergency channel has been cleared.");
				return;
			}

			var serverChannel = botFunctions.getChannelByName(msg.server, channel);

			if (!serverChannel) {
				botFunctions.sendMessage(bot, msg.channel, "Cannot find the channel " + channel);
				return;
			}

			if (!botFunctions.setConfigValue(msg.server, "SECURITY_EMERGENCY_CHANNEL", serverChannel.id)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The security signal emergency channel has been set to " + serverChannel.name);
		},
		permissions: [
			"administrator"
		]
	},
	/*"getRatsignalFuelProcedureLink": {
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
	},*/
	/*"setRatsignalFuelProcedureLink": {
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
	},*/
};

exports.VERSION = VERSION;
exports.defaultModuleConfig = defaultModuleConfig;
exports.commands = commands;
