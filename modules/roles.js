var botFunctions = require("../bot_functions.js");

const VERSION = "1.1.0";

var defaultModuleConfig = {
	"AUTO_ROLE": "",
	"LOCKED_ROLES": [],
};

function getManageableRoles(bot, channel) {
	var manageableRoles = [];

	var botRoles = channel.server.rolesOfUser(bot.user);
	var rolePosition = -1;

	for (var x=0; x<botRoles.length; x++) {
		if (botRoles[x].hasPermission("manageRoles") && (rolePosition == -1 || botRoles[x].position<rolePosition)) {
			rolePosition = botRoles[x].position;
		}
	}

	if (rolePosition == -1) {
		return manageableRoles;
	}

	var serverRoles = channel.server.roles;

	for (var x=0; x<serverRoles.length; x++) {
		if (serverRoles[x].position == -1) {
			continue;
		}

		if (serverRoles[x].position<rolePosition) {
			manageableRoles.push(serverRoles[x]);
		}
	}

	return manageableRoles;
}

function isLocked(server, roleId) {
	var lockedRoles = botFunctions.getConfigValue(server, "LOCKED_ROLES");

	if (lockedRoles.length == 0) {
		return false;
	}

	if (lockedRoles.indexOf(roleId) > -1) {
		return true;
	}

	return false;
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

function newMemberHandler(bot, server, user) {
	function roleHandler(error) {
		if (error) {
			console.log("Error: " + error);
		}
	}

	var autoRole = botFunctions.getConfigValue(server, "AUTO_ROLE");

	if (!autoRole) {
		return false;
	}

	var serverRole = botFunctions.getRole(server, autoRole);

	if (!serverRole) {
		return false;
	}

	console.log(user.name + " joined " + server.name);

	if (!bot.memberHasRole(user, serverRole)) {
		bot.addMemberToRole(user, serverRole, roleHandler);
	}

	return false;
}

function roles(args, bot, msg)
{
	var publicRoles = getManageableRoles(bot, msg.channel);

	if (publicRoles.length == 0)
	{
		botFunctions.sendMessage(bot, msg.channel, "I am not allowed to manage any roles.");
		return;
	}

	var roleNames = [];

	for (var x=0; x<publicRoles.length; x++)
	{
		if (isLocked(msg.server, publicRoles[x].id))
		{
			continue;
		}

		roleNames.push(publicRoles[x].name);
	}

	if (roleNames.length == 0)
	{
		botFunctions.sendMessage(bot, msg.channel, "I am not allowed to manage any roles.");
		return;
	}

	var output = "The following roles can be managed by the bot using the join and leave commands:\n";
	output += "\t" + roleNames.join("\n\t");

	botFunctions.sendMessage(bot, msg.channel, output);
}

function join(args, bot, msg)
{
	function roleHandler(error)
	{
		if (error)
		{
			console.log("Error: " + error);
			botFunctions.sendMessage(bot, msg.channel, "I may not have permission to assign this role.");
		}
		else
		{
			botFunctions.sendMessage(bot, msg.channel, "Done.");
		}
	}

	var roleName = botFunctions.compileArgs(args);
	var role = botFunctions.getRoleByName(msg.server, roleName);

	if (!role)
	{
		botFunctions.sendMessage(bot, msg.channel, "The role " + roleName + " is unknown on this server.");
		return;
	}

	if (!roleIsManageable(bot, msg.channel, role.id))
	{
		botFunctions.sendMessage(bot, msg.channel, "I am not allowed to manage this role.");
		return;
	}

	if (isLocked(msg.server, role.id))
	{
		botFunctions.sendMessage(bot, msg.channel, "The role " + role.name + " is locked.");
		return;
	}

	if (bot.memberHasRole(msg.author, role))
	{
		botFunctions.sendMessage(bot, msg.channel, "You already have the role " + roleName + ".");
		return;
	}

	try
	{
		bot.addMemberToRole(msg.author, role, roleHandler);
	}
	catch(e)
	{
		console.log(e);
	}
}

function leave(args, bot, msg)
{
	function roleHandler(error)
	{
		if (error)
		{
			console.log("Error: " + error);
			botFunctions.sendMessage(bot, msg.channel, "I may not have permission to assign this role.");
		}
		else
		{
			botFunctions.sendMessage(bot, msg.channel, "Done.");
		}
	}

	var roleName = botFunctions.compileArgs(args);
	var role = botFunctions.getRoleByName(msg.server, roleName);

	if (!role)
	{
		botFunctions.sendMessage(bot, msg.channel, "The role " + roleName + " is unknown on this server.");
		return;
	}

	if (!roleIsManageable(bot, msg.channel, role.id))
	{
		botFunctions.sendMessage(bot, msg.channel, "I am not allowed to manage this role.");
		return;
	}

	if (!bot.memberHasRole(msg.author, role))
	{
		botFunctions.sendMessage(bot, msg.channel, "You do not have the role " + roleName + ".");
		return;
	}

	try
	{
		bot.removeMemberFromRole(msg.author, role, roleHandler);
	}
	catch(e)
	{
		console.log(e);
	}
}

function members(args, bot, msg)
{
	var roleName = botFunctions.compileArgs(args);
	var publicRoles = getManageableRoles(bot, msg.channel);
	var role = botFunctions.getRoleByName(msg.server, roleName);

	if (!role)
	{
		botFunctions.sendMessage(bot, msg.channel, "The role " + roleName + " is unknown on this server.");
		return;
	}

	if (!roleIsManageable(bot, msg.channel, role.id))
	{
		botFunctions.sendMessage(bot, msg.channel, "I am not allowed to manage this role.");
		return;
	}

	if (isLocked(msg.server, role.id))
	{
		botFunctions.sendMessage(bot, msg.channel, "The role " + role.name + " is locked.");
		return;
	}

	var members = msg.server.usersWithRole(role);

	if (members.length == 0)
	{
		botFunctions.sendMessage(bot, msg.channel, "The role " + role.name + " has no members.");
		return;
	}

	var output = "The role " + role.name + " has " + members.length + " members:\n";

	for (var index=0; index<members.length; index++)
	{
		output += "\t" + members[index].name + "\n";
	}

	botFunctions.sendMessage(bot, msg.channel, "List sent as private message.");
	botFunctions.sendMessage(bot, msg.author, output);
}

function getAutoRole(args, bot, msg)
{
	var autoRole = botFunctions.getConfigValue(msg.server, "AUTO_ROLE");

	if (!autoRole)
	{
		botFunctions.sendMessage(bot, msg.channel, "No role has been set for automatic assignment.");
		return;
	}

	var role = botFunctions.getRole(msg.server, autoRole);

	if (!role)
	{
		botFunctions.sendMessage(bot, msg.channel, "A role is set, but it does not exist on this server.");
		return;
	}

	botFunctions.sendMessage(bot, msg.channel, "New users will be assigned the role: " + role.name);
}

function setAutoRole(args, bot, msg)
{
	var role = botFunctions.compileArgs(args);

	if (!role)
	{
		if (!botFunctions.setConfigValue(msg.server, "AUTO_ROLE", ""))
		{
			botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
			return;
		}

		botFunctions.sendMessage(bot, msg.channel, "The role for automatic assignment has been cleared.");
		return;
	}

	var serverRole = botFunctions.getRoleByName(msg.server, role);

	if (!serverRole)
	{
		botFunctions.sendMessage(bot, msg.channel, "Cannot find the role " + role);
		return;
	}

	if (!roleIsManageable(bot, msg.channel, serverRole.id))
	{
		botFunctions.sendMessage(bot, msg.channel, "I am not allowed to manage this role.");
		return;
	}

	if (!botFunctions.setConfigValue(msg.server, "AUTO_ROLE", serverRole.id))
	{
		botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
		return;
	}

	botFunctions.sendMessage(bot, msg.channel, "New users will be assigned the role: " + serverRole.name);
}

function getLockedRoles(args, bot, msg)
{
	var lockedRoles = botFunctions.getConfigValue(msg.server, "LOCKED_ROLES");

	if (lockedRoles.length == 0)
	{
		botFunctions.sendMessage(bot, msg.channel, "There are no locked roles.");
		return;
	}

	var roleNames = [];

	for (var x=0; x<lockedRoles.length; x++)
	{
		var serverRole = botFunctions.getRole(msg.server, lockedRoles[x]);

		if (!serverRole)
		{
			roleNames.push("Unknown role id: " + lockedRoles[x]);
			continue;
		}

		roleNames.push(serverRole.name);
	}

	var output = "The following roles are locked:\n\t";
	output += roleNames.join("\n\t");

	botFunctions.sendMessage(bot, msg.channel, output);
}

function lockRole(args, bot, msg)
{
	var role = botFunctions.compileArgs(args);

	if (!role)
	{
		botFunctions.sendMessage(bot, msg.channel, "You need to specify the role you want to lock.");
		return;
	}

	var serverRole = botFunctions.getRoleByName(msg.server, role);

	if (!serverRole)
	{
		botFunctions.sendMessage(bot, msg.channel, "Cannot find the role " + role);
		return;
	}

	if (!roleIsManageable(bot, msg.channel, serverRole.id))
	{
		botFunctions.sendMessage(bot, msg.channel, "I am not allowed to manage this role.");
		return;
	}

	var lockedRoles = botFunctions.getConfigValue(msg.server, "LOCKED_ROLES");

	if (lockedRoles.indexOf(serverRole.id) > -1)
	{
		botFunctions.sendMessage(bot, msg.channel, "The role " + serverRole.name + " is already locked.");
		return;
	}

	lockedRoles.push(serverRole.id);

	if (!botFunctions.setConfigValue(msg.server, "LOCKED_ROLES", lockedRoles))
	{
		botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
		return;
	}

	botFunctions.sendMessage(bot, msg.channel, "The role " + serverRole.name + " is now locked.");
}

function unlockRole(args, bot, msg)
{
	var role = botFunctions.compileArgs(args);

	if (!role)
	{
		botFunctions.sendMessage(bot, msg.channel, "You need to specify the role you want to unlock.");
		return;
	}

	var serverRole = botFunctions.getRoleByName(msg.server, role);

	if (!serverRole)
	{
		botFunctions.sendMessage(bot, msg.channel, "Cannot find the role " + role);
		return;
	}

	var lockedRoles = botFunctions.getConfigValue(msg.server, "LOCKED_ROLES");
	var roleIndex = lockedRoles.indexOf(serverRole.id);

	if (roleIndex == -1)
	{
		botFunctions.sendMessage(bot, msg.channel, "The role " + serverRole.name + " is not locked.");
		return;
	}

	lockedRoles.splice(roleIndex, 1);

	if (!botFunctions.setConfigValue(msg.server, "LOCKED_ROLES", lockedRoles))
	{
		botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
		return;
	}

	botFunctions.sendMessage(bot, msg.channel, "The role " + serverRole.name + " is now no longer locked.");
}

function assignRole(args, bot, msg)
{
	function roleHandler(error)
	{
		if (error)
		{
			console.log("Error: " + error);
			botFunctions.sendMessage(bot, msg.channel, "I may not have permission to assign this role.");
		}
		else
		{
			botFunctions.sendMessage(bot, msg.channel, "Done.");
		}
	}

	var params = botFunctions.compileArgs(args);
	var regEx = new RegExp('(.+) (\\+|-) (.+)');
	var matches = regEx.exec(params);
	
	if (!matches)
	{
		botFunctions.sendMessage(bot, msg.channel, "Invalid arguments.");
		return;
	}

	var user = matches[1];
	var action = matches[2];
	var role = matches[3];
	var serverUser = botFunctions.getUserByName(msg.server, user);

	if (!serverUser)
	{
		botFunctions.sendMessage(bot, msg.channel, "Cannot find the user " + user);
		return;
	}

	var serverRole = botFunctions.getRoleByName(msg.server, role);
	
	if (!serverRole)
	{
		botFunctions.sendMessage(bot, msg.channel, "Cannot find the role " + role);
		return;
	}

	if (!roleIsManageable(bot, msg.channel, serverRole.id))
	{
		botFunctions.sendMessage(bot, msg.channel, "I am not allowed to manage this role.");
		return;
	}
	
	if (action == "+")
	{
		if (bot.memberHasRole(serverUser, serverRole))
		{
			botFunctions.sendMessage(bot, msg.channel, serverUser.name + " already has the role " + serverRole.name);
			return;
		}

		try
		{
			bot.addMemberToRole(serverUser, serverRole, roleHandler);
		}
		catch(e)
		{
			console.log(e);
		}
	}
	else
	{
		if (!bot.memberHasRole(serverUser, serverRole))
		{
			botFunctions.sendMessage(bot, msg.channel, serverUser.name + " does not have the role " + serverRole.name);
			return;
		}

		try
		{
			bot.removeMemberFromRole(serverUser, serverRole, roleHandler);
		}
		catch(e)
		{
			console.log(e);
		}
	}
}

var commands = {
	"roles": {
		help: "Show the public roles managed by the bot.",
		process: roles
	},
	"join": {
		usage: "<role>",
		help: "Join a user role",
		process: join
	},
	"leave": {
		usage: "<role>",
		help: "Leave a user role",
		process: leave
	},
	"members": {
		usage: "<role>",
		help: "Get the list of users that have the given role.",
		process: members
	},
	"getAutoRole": {
		help: "Get the role that will be automatically assigned to new users on this Discord.",
		process: getAutoRole,
		permissions: [
			"administrator"
		]
	},
	"setAutoRole": {
		usage: "[role]",
		help: "Set a role, or none, that will be automatically assigned to new users on this Discord.",
		process: setAutoRole,
		permissions: [
			"administrator"
		]
	},
	"getLockedRoles": {
		help: "Get the list of locked roles.",
		process: getLockedRoles,
		permissions: [
			"administrator"
		]
	},
	"lockRole": {
		usage: "<role>",
		help: "Disable public use for a role the bot is allowed to manage.",
		process: lockRole,
		permissions: [
			"administrator"
		]
	},
	"unlockRole": {
		usage: "<role>",
		help: "Enable public use of a role the bot is allowed to manage.",
		process: unlockRole,
		permissions: [
			"administrator"
		]
	},
	"assignRole": {
		usage: "<user> <+|-> <role>",
		help: "Assign a role to a user or remove it.",
		process: assignRole,
		permissions: [
			"manageRoles"
		]
	},
};

exports.VERSION = VERSION;
exports.defaultModuleConfig = defaultModuleConfig;
exports.onNewMember = newMemberHandler;
exports.commands = commands;
