const MODULES_DIR = "./modules/";
var loadedModules = {};

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
	"DISABLED_MODULES": [
	],
	"IGNORE_USERS": [
	],
	"IGNORE_CHANNELS": [
	],
};

function loadModules() {
	function listHandler(error, list) {
		if (error) {
			console.log("Error searching for modules: " + error);
			return;
		}

		var filename;

		for (var x=0; x<list.length; x++) {
			var filename = list[x];

			if (!filename.endsWith(".js")) {
				continue;
			}

			try {
				var module = require(MODULES_DIR + filename);
				moduleName = filename.replace(".js", "");
				loadedModules[moduleName] = module;
			} catch(e) {
				console.log(e);
			}
		}
	}

	var fs = require("fs");
	fs.readdir(MODULES_DIR, listHandler);
}

function hasModule(module) {
	return loadedModules.hasOwnProperty(module);
}

function moduleIsEnabled(server, module) {
	if (!hasModule(module)) {
		return false;
	}

	var disabledModules = getConfigValue(server, "DISABLED_MODULES");

	if (disabledModules.indexOf(module) > -1) {
		return false;
	}

	return true;
}

function getModule(server, module) {
	if (!moduleIsEnabled(server, module)) {
		return null;
	}

	return loadedModules[module];
}

function updateDynamicConfig() {
	require("fs").writeFile("./dynamicConfig.json", JSON.stringify(dynamicConfig, null, 2));
}

function checkConfigOptions(serverConfig, defaultConfig, server) {
	for (var key in defaultConfig) {
		if (!serverConfig.hasOwnProperty(key)) {
			console.log(key + " is missing from the config for server " + server.name);
			serverConfig[key] = defaultConfig[key];
		}
	}

	return serverConfig;
}

function checkDynamicConfig(server) {
	if (!dynamicConfig["servers"][server.id]) {
		console.log("Creating default config for server " + server.name);
		dynamicConfig["servers"][server.id] = dynamicDefaultConfig;
	}

	var serverConfig = dynamicConfig["servers"][server.id];
	serverConfig = checkConfigOptions(serverConfig, dynamicDefaultConfig, server);

	for (var key in loadedModules) {
		if (loadedModules[key].defaultModuleConfig) {
			serverConfig = checkConfigOptions(serverConfig, loadedModules[key].defaultModuleConfig, server);
		}
	}

	dynamicConfig["servers"][server.id] = serverConfig;
	updateDynamicConfig();
}

function getConfigValue(server, option) {
	var activeConfig;

	if (server) {
		checkDynamicConfig(server);
		activeConfig = dynamicConfig["servers"][server.id];
	} else {
		activeConfig = dynamicDefaultConfig;
	}

	return activeConfig[option];
}

function setConfigValue(server, option, value) {
	if (!server) {
		return false;
	}

	dynamicConfig["servers"][server.id][option] = value;
	updateDynamicConfig();
	return true;
}

function compileArgs(args) {
	args.splice(0,1);
	return args.join(" ");
}

function sendMessage(bot, channel, message) {
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

function getUserMentionRenamed(user) {
	var output = "<@!" + user.id + ">";
	return output;
}

exports.loadedModules = loadedModules;
exports.loadModules = loadModules;
exports.hasModule = hasModule;
exports.moduleIsEnabled = moduleIsEnabled;
exports.getModule = getModule;
exports.getConfigValue = getConfigValue;
exports.setConfigValue = setConfigValue;
exports.compileArgs = compileArgs;
exports.sendMessage = sendMessage;
exports.checkPermission = checkPermission;
exports.getServer = getServer;
exports.getServerByName = getServerByName;
exports.getChannel = getChannel;
exports.getChannelByName = getChannelByName;
exports.getRole = getRole;
exports.getRoleByName = getRoleByName;
exports.getUser = getUser;
exports.getUserByName = getUserByName;
exports.getUserMentionRenamed = getUserMentionRenamed;
