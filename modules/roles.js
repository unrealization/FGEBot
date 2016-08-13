var botFunctions = require("../bot_functions.js");

function getManageableRoles(bot, channel) {
	var manageableRoles = [];

	if (!botFunctions.checkPermission(channel, bot.user, "manageRoles")) {
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

var commands = {
	"roles": {
		help: "Show the public roles managed by the bot.",
		process: function(args, bot, msg) {
			var publicRoles = getManageableRoles(bot, msg.channel);

			if (publicRoles.length == 0) {
				botFunctions.sendMessage(bot, msg.channel, "I am not allowed to manage any roles.");
				return;
			}

			var roleNames = [];

			for (var x=0; x<publicRoles.length; x++) {
				roleNames.push(publicRoles[x].name);
			}

			var commandPrefix = botFunctions.getConfigValue(msg.server, "COMMAND_PREFIX");
			var output = "The following roles can be managed by the bot using the " + commandPrefix + "join and " + commandPrefix + "leave commands:\n";
			output += "\t" + roleNames.join("\n\t");

			botFunctions.sendMessage(bot, msg.channel, output);
		}
	},
	"join": {
		usage: "<role>",
		help: "Join a user role",
		process: function(args, bot, msg) {
			function roleHandler(error) {
				if (error) {
					console.log("Error: " + error);
					botFunctions.sendMessage(bot, msg.channel, "I may have not permission to assign this role.");
				} else {
					botFunctions.sendMessage(bot, msg.channel, "Done.");
				}
			}

			var roleName = botFunctions.compileArgs(args);
			var role = botFunctions.getRoleByName(msg.server, roleName);

			if (!role) {
				botFunctions.sendMessage(bot, msg.channel, "The role " + roleName + " is unknown on this server.");
				return;
			}

			if (!roleIsManageable(bot, msg.channel, role.id)) {
				botFunctions.sendMessage(bot, msg.channel, "I am not allowed to manage this role.");
				return;
			}

			if (bot.memberHasRole(msg.author, role)) {
				botFunctions.sendMessage(bot, msg.channel, "You already have the role " + roleName + ".");
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
					botFunctions.sendMessage(bot, msg.channel, "I may have not permission to assign this role.");
				} else {
					botFunctions.sendMessage(bot, msg.channel, "Done.");
				}
			}

			var roleName = botFunctions.compileArgs(args);
			var role = botFunctions.getRoleByName(msg.server, roleName);

			if (!role) {
				botFunctions.sendMessage(bot, msg.channel, "The role " + roleName + " is unknown on this server.");
				return;
			}

			if (!roleIsManageable(bot, msg.channel, role.id)) {
				botFunctions.sendMessage(bot, msg.channel, "I am not allowed to manage this role.");
				return;
			}

			if (!bot.memberHasRole(msg.author, role)) {
				botFunctions.sendMessage(bot, msg.channel, "You do not have the role " + roleName + ".");
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
			var roleName = botFunctions.compileArgs(args);
			var publicRoles = getManageableRoles(bot, msg.channel);
			var role = botFunctions.getRoleByName(msg.server, roleName);

			if (!role) {
				botFunctions.sendMessage(bot, msg.channel, "The role " + roleName + " is unknown on this server.");
				return;
			}

			if (!roleIsManageable(bot, msg.channel, role.id)) {
				botFunctions.sendMessage(bot, msg.channel, "I am not allowed to manage this role.");
				return;
			}

			var members = msg.server.usersWithRole(role);

			if (members.length == 0) {
				botFunctions.sendMessage(bot, msg.channel, "The role " + role.name + " has no members.");
				return;
			}

			var output = "The role " + role.name + " has " + members.length + " members:\n";

			for (var index=0; index<members.length; index++) {
				output += "\t" + members[index].name + "\n";
			}

			botFunctions.sendMessage(bot, msg.channel, "List sent as private message.");
			botFunctions.sendMessage(bot, msg.author, output);
		}
	},
};

exports.commands = commands;
