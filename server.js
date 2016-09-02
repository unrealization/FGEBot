var Discord = require("discord.js");
var config = require('./config.js');

var botFunctions = require("./bot_functions.js");

const VERSION = "Jeeves 1.5.0";

botFunctions.loadModules();

var options = {
	autoReconnect: 1
};

var FGEBot = new Discord.Client(options);

var startTime = Date.now();

var commands = {
	"ping": {
		help: "Returns pong. Useful for determining if the bot is alive.",
		process: function(args, bot, message) { botFunctions.sendMessage(bot, message.channel, "Pong!"); }
	},
	"version": {
		help: "Display version information for this bot.",
		process: function(args, bot, message) { botFunctions.sendMessage(bot, message.channel, VERSION); }
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

			botFunctions.sendMessage(bot, msg.channel,"Uptime: " + timestr);
		}
	},
	"getUtcTime": {
		help: "Get the current UTC time.",
		process: function(args, bot, msg) {
			var now = new Date();
			botFunctions.sendMessage(bot, msg.channel, "The current UTC time is: " + now.toUTCString().replace(" GMT", ""));
		}
	},
	"getServers": {
		help: "Show the servers the bot is connected to.",
		process: function(args, bot, msg) {
			var serverList = bot.servers;

			if (serverList.length == 0) {
				botFunctions.sendMessage(bot, msg.channel, "The bot is not connected to any server.");
				return;
			}

			var output = "The bot is connected to the following servers:";

			for (var x=0; x<serverList.length; x++) {
				output += "\n\t" + serverList[x].name + " (Id: " + serverList[x].id + ")";
			}

			botFunctions.sendMessage(bot, msg.channel, output);
		},
		owner: 1
	},
	"joinServer": {
		usage: "<invite>",
		help: "Join the server through the given invite.",
		process: function(args, bot, msg) {
			function callback(error, server) {
				if (error) {
					console.log("Error: " + error);
					botFunctions.sendMessage(bot, msg.channel, "I cannot join the server.");
					return;
				}

				botFunctions.sendMessage(bot, msg.channel, "Successfully joined the server " + server.name);
			}

			var invite = botFunctions.compileArgs(args);

			if (!invite) {
				botFunctions.sendMessage(bot, msg.channel, "You have to provide an invite.");
				return;
			}

			bot.joinServer(invite, callback);
		},
		owner: 1
	},
	"leaveServer": {
		usage: "[server]",
		help: "Leave the given, or current, server.",
		process: function(args, bot, msg) {
			function callback(error) {
				if (error) {
					console.log("Error: " + error);
					botFunctions.sendMessage(bot, msg.channel, "I was unable to leave the server " + server);
					return;
				}

				botFunctions.sendMessage(bot, msg.channel, "Successfully left the server " + serverObject.name);
			}

			var server = botFunctions.compileArgs(args);
			var serverObject;

			if (!server) {
				serverObject = msg.server;
			} else {
				serverObject = botFunctions.getServer(bot, server);

				if (!serverObject) {
					serverObject = botFunctions.getServerByName(bot, server);
				}
			}

			if (!serverObject) {
				botFunctions.sendMessage(bot, msg.channel, "Cannot find the server " + server);
				return;
			}

			bot.leaveServer(serverObject, callback);
		},
		owner: 1
	},
	"shutdown": {
		help: "Shut down the bot.",
		process: function(args, bot, msg) {
			botFunctions.sendMessage(bot, msg.channel, "Shutting down...");
			botFunctions.updateDynamicConfig();
			process.exit();
		},
		owner: 1
	},
	"findMediaLinks": {
		usage: "[channe]",
		help: "Find images and videos in the given, or current, channel.",
		process: function(args, bot, msg) {
			function logHandler(error, messages) {
				if (error) {
					console.log("Error: " + error);
					botFunctions.sendMessage(bot, msg.channel, "There was an error retrieving messages from " + serverChannel.name);
					return;
				}

				if (messages.length == 0) {
					botFunctions.sendMessage(bot, msg.channel, serverChannel.name + " is empty.");
					return;
				}

				var links = [];

				for (var x=0; x<messages.length; x++) {
					if (messages[x].embeds && messages[x].embeds.length > 0) {
						for (var i=0; i<messages[x].embeds.length; i++) {
							if (messages[x].embeds[i].type == "image" || messages[x].embeds[i].type == "video") {
								links.push(messages[x].embeds[i].url);
							}
						}
					}

					if (messages[x].attachments && messages[x].attachments.length > 0) {
						for (var i=0; i<messages[x].attachments.length; i++) {
							if (messages[x].attachments[i].width && messages[x].attachments[i].height) {
								links.push(messages[x].attachments[i].url);
							}
						}
					}
				}

				var outputList = [];

				for (var x=0; x<links.length; x++) {
					if (outputList.indexOf(links[x]) == -1) {
						outputList.push("<" + links[x] + ">");
					}
				}

				if (outputList.length == 0) {
					botFunctions.sendMessage(bot, msg.channel, "Nothing found.");
					return;
				}

				var output = outputList.join("\n");
				botFunctions.sendMessage(bot, msg.author, output);
				botFunctions.sendMessage(bot, msg.channel, "List sent as private message.");
			}

			var channel = botFunctions.compileArgs(args);
			var serverChannel = msg.channel;

			if (channel) {
				serverChannel = botFunctions.getChannelByName(msg.server, channel);

				if (!serverChannel) {
					botFunctions.sendMessage(bot, msg.channel, "Cannot find the channel " + channel);
					return;
				}
			}

			bot.getChannelLogs(serverChannel, 100, {}, logHandler);
		},
		permissions: [
			"administrator"
		]
	},
	"clearChannel": {
		usage: "[channel]",
		help: "Clear the given, or current, channel.",
		process: function(args, bot, msg) {
			function deleteHandler(error) {
				if (error) {
					console.log("Error: " + error);
					botFunctions.sendMessage(bot, msg.channel, "There was an error clearing " + serverChannel.name);
					return;
				}

				//bot.getChannelLogs(serverChannel, 100, {}, logHandler);

				if (serverChannel.id != msg.channel.id) {
					botFunctions.sendMessage(bot, msg.channel, "Deleted some messages from " + serverChannel.name);
				}
			}

			function logHandler(error, messages) {
				if (error) {
					console.log("Error: " + error);
					botFunctions.sendMessage(bot, msg.channel, "There was an error retrieving messages from " + serverChannel.name);
					return;
				}

				if (messages.length == 0) {
					botFunctions.sendMessage(bot, msg.channel, serverChannel.name + " is empty.");
					return;
				}

				bot.deleteMessages(messages, deleteHandler);
			}

			var channel = botFunctions.compileArgs(args);
			var serverChannel = msg.channel;

			if (channel) {
				serverChannel = botFunctions.getChannelByName(msg.server, channel);

				if (!serverChannel) {
					botFunctions.sendMessage(bot, msg.channel, "Cannot find the channel " + channel);
					return;
				}
			}

			if (!botFunctions.checkChannelPermission(serverChannel, bot.user, "manageMessages")) {
				botFunctions.sendMessage(bot, msg.channel, "I am not allowed to manage messages in " + serverChannel.name);
				return;
			}

			bot.getChannelLogs(serverChannel, 100, {}, logHandler);
		},
		permissions: [
			"administrator"
		]
	},
	"getUserId": {
		usage: "[user]",
		help: "Get the ID of the given user or yourself.",
		process: function(args, bot, msg) {
			var user = botFunctions.compileArgs(args);
			var serverUser = msg.author;

			if (user) {
				serverUser = botFunctions.getUserByName(msg.server, user);

				if (!serverUser) {
					botFunctions.sendMessage(bot, msg.channel, "Cannot find the user " + user);
					return;
				}
			}

			botFunctions.sendMessage(bot, msg.channel, "The ID of " + serverUser.name + " is: " + serverUser.id);
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
				botFunctions.sendMessage(bot, msg.channel, "There are no untagged users.");
				return;
			}

			var output = "The following " + untaggedUsers.length + " users have no role assigned:\n";

			for (var x=0; x<untaggedUsers.length; x++) {
				output += "\t" + untaggedUsers[x].name + "\n";
			}

			botFunctions.sendMessage(bot, msg.channel, "List sent as private message.");
			botFunctions.sendMessage(bot, msg.author, output);
		},
		permissions: [
			"administrator"
		]
	},
	"getModules": {
		help: "Get a list of the loaded modules.",
		process: function(args, bot, msg) {
			var output = "";
			var activeModules = [];

			for (var key in botFunctions.loadedModules) {
				if (!botFunctions.moduleIsEnabled(msg.server, key)) {
					continue;
				}

				activeModules.push(key);
			}

			if (activeModules.length == 0) {
				botFunctions.sendMessage(bot, msg.channel, "There are no loaded modules.");
				return;
			}

			var output = "There are " + activeModules.length + " loaded modules:";
			output += "\n\t" + activeModules.join("\n\t");

			botFunctions.sendMessage(bot, msg.channel, output);
		},
		permissions: [
			"administrator"
		]
	},
	"getDisabledModules": {
		help: "Get the list of disabled modules.",
		process: function(args, bot, msg) {
			var disabledModules = botFunctions.getConfigValue(msg.server, "DISABLED_MODULES");

			if (disabledModules.length == 0) {
				botFunctions.sendMessage(bot, msg.channel, "There are no disabled modules.");
				return;
			}

			var moduleNames = [];

			for (var x=0; x<disabledModules.length; x++) {
				if (botFunctions.hasModule(disabledModules[x])) {
					moduleNames.push(disabledModules[x]);
				}
			}

			if (moduleNames.length == 0) {
				botFunctions.sendMessage(bot, msg.channel, "There are no disabled modules.");
				return;
			}

			var output = "There are " + moduleNames.length + " disabled modules:";
			output += "\n\t" + moduleNames.join("\n\t");

			botFunctions.sendMessage(bot, msg.channel, output);
		},
		permissions: [
			"administrator"
		]
	},
	"disableModule": {
		usage: "<module>",
		help: "Disable a module.",
		process: function(args, bot, msg) {
			var module = botFunctions.compileArgs(args);

			if (!module) {
				botFunctions.sendMessage(bot, msg.channel, "You must specify the module you want to disable.");
				return;
			}

			if (!botFunctions.hasModule(module)) {
				botFunctions.sendMessage(bot, msg.channel, "The module " + module + " does not exist.");
				return;
			}

			var disabledModules = botFunctions.getConfigValue(msg.server, "DISABLED_MODULES");

			if (disabledModules.indexOf(module) > -1) {
				botFunctions.sendMessage(bot, msg.channel, "The module " + module + " is already disabled.");
				return;
			}

			disabledModules.push(module);

			if (!botFunctions.setConfigValue(msg.server, "DISABLED_MODULES", disabledModules)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The module " + module + " has been disabled.");
		},
		permissions: [
			"administrator"
		]
	},
	"enableModule": {
		usage: "<module>",
		help: "Reenable a disabled module.",
		process: function(args, bot, msg) {
			var module = botFunctions.compileArgs(args);
			if (!module) {
				botFunctions.sendMessage(bot, msg.channel, "You need to specify which module you want to enable.");
				return;
			}
			if (!botFunctions.hasModule(module)) {
				botFunctions.sendMessage(bot, msg.channel, "The module " + module + " does not exist.");
				return;
			}
			var disabledModules = botFunctions.getConfigValue(msg.server, "DISABLED_MODULES");
			var moduleIndex = disabledModules.indexOf(module);

			if (moduleIndex == -1) {
				botFunctions.sendMessage(bot, msg.channel, "The module " + module + " is already enabled.");
				return;
			}

			disabledModules.splice(moduleIndex,1);

			if (!botFunctions.setConfigValue(msg.server, "DISABLED_MODULES", disabledModules)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The module " + module + " has been enabled.");
		},
		permissions: [
			"administrator"
		]
	},
	"getRespondToCommands": {
		help: "See if the bot is set to respond to commands.",
		process: function(args, bot, msg) {
			var respondToCommands = botFunctions.getConfigValue(msg.server, "RESPOND_TO_COMMANDS");

			if (respondToCommands == 0) {
				botFunctions.sendMessage(bot, msg.channel, "The bot does not respond to commands.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The bot responds to commands.");
		},
		permissions: [
			"administrator"
		]
	},
	"setRespondToCommands": {
		usage: "<1|0>",
		help: "Set whether or not the bot should respond to commands.",
		process: function(args, bot, msg) {
			var respondToCommands = botFunctions.compileArgs(args);

			if (respondToCommands != 0 && respondToCommands != 1) {
				botFunctions.sendMessage(bot, msg.channel, "Invalid value.");
				return;
			}

			if (!botFunctions.setConfigValue(msg.server, "RESPOND_TO_COMMANDS", respondToCommands)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			if (respondToCommands == 0) {
				botFunctions.sendMessage(bot, msg.channel, "The bot will now no longer respond to commands.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The bot will from now on respond to commands.");
		},
		permissions: [
			"administrator"
		]
	},
	"getRespondToMentions": {
		help: "See if the bot is set to respond to mentions.",
		process: function(args, bot, msg) {
			var respondToMentions = botFunctions.getConfigValue(msg.server, "RESPOND_TO_MENTIONS");

			if (respondToMentions == 0) {
				botFunctions.sendMessage(bot, msg.channel, "The bot does not respond to mentions.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The bot responds to mentions.");
		},
		permissions: [
			"administrator"
		]
	},
	"setRespondToMentions": {
		usage: "<1|0>",
		help: "Set whether or not the bot should respond to mentions.",
		process: function(args, bot, msg) {
			var respondToMentions = Number(botFunctions.compileArgs(args));

			if (respondToMentions != 0 && respondToMentions != 1) {
				botFunctions.sendMessage(bot, msg.channel, "Invalid value.");
				return;
			}

			if (!botFunctions.setConfigValue(msg.server, "RESPOND_TO_MENTIONS", respondToMentions)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			if (respondToMentions == 0) {
				botFunctions.sendMessage(bot, msg.channel, "The bot will now no longer respond to mentions.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "The bot will from now on respond to mentions.");
		},
		permissions: [
			"administrator"
		]
	},
	"getCommandPrefix": {
		help: "Get the current command prefix.",
		process: function(args, bot, msg) {
			var commandPrefix = botFunctions.getConfigValue(msg.server, "COMMAND_PREFIX");
			botFunctions.sendMessage(bot, msg.channel, "The current command prefix is: " + commandPrefix);
		},
		permissions: [
			"administrator"
		]
	},
	"setCommandPrefix": {
		usage: "<value>",
		help: "Set the command prefix.",
		process: function(args, bot, msg) {
			var commandPrefix = botFunctions.compileArgs(args);

			if (!commandPrefix) {
				botFunctions.sendMessage(bot, msg.channel, "The command prefix cannot be empty.");
				return;
			}

			if (!botFunctions.setConfigValue(msg.server, "COMMAND_PREFIX", commandPrefix)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "Command prefix set to: " + commandPrefix);
		},
		permissions: [
			"administrator"
		]
	},
	"getNameSeparator": {
		help: "Get the current name separator.",
		process: function(args, bot, msg) {
			var nameSeparator = botFunctions.getConfigValue(msg.server, "NAME_SEPARATOR");
			botFunctions.sendMessage(bot, msg.channel, "The current name separator is: " + nameSeparator);
		},
		permissions: [
			"administrator"
		]
	},
	"setNameSeparator": {
		usage: "<value>",
		help: "Set the name separator.",
		process: function(args, bot, msg) {
			var nameSeparator = botFunctions.compileArgs(args);

			if (!nameSeparator) {
				botFunctions.sendMessage(bot, msg.channel, "The name separator cannot be empty.");
				return;
			}

			if (!botFunctions.setConfigValue(msg.server, "NAME_SEPARATOR", nameSeparator)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "Name separator set to: " + nameSeparator);
		},
		permissions: [
			"administrator"
		]
	},
	"getIgnoredUsers": {
		help: "Get the list of ignored users on this server.",
		process: function(args, bot, msg) {
			var ignoredUsers = botFunctions.getConfigValue(msg.server, "IGNORE_USERS");

			if (ignoredUsers.length == 0) {
				botFunctions.sendMessage(bot, msg.channel, "No users are being ignored.");
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

			botFunctions.sendMessage(bot, msg.channel, output);
		},
		permissions: [
			"administrator",
		]
	},
	"addIgnoredUser": {
		usage: "<user>",
		help: "Add a user the bot should ignore.",
		process: function(args, bot, msg) {
			var user = botFunctions.compileArgs(args);

			if (!user) {
				botFunctions.sendMessage(bot, msg.channel, "You must specify the user the bot should ignore.");
				return;
			}

			var serverUser = botFunctions.getUserByName(msg.server, user);

			if (!serverUser) {
				botFunctions.sendMessage(bot, msg.channel, "Cannot find the user " + user);
				return;
			}

			var ignoredUsers = botFunctions.getConfigValue(msg.server, "IGNORE_USERS");

			if (ignoredUsers.indexOf(serverUser.id) > -1) {
				botFunctions.sendMessage(bot, msg.channel, "I already ignore the user " + serverUser.name);
				return;
			}

			ignoredUsers.push(serverUser.id);

			if (!botFunctions.setConfigValue(msg.server, "IGNORE_USERS", ignoredUsers)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "User " + serverUser.name + " will now be ignored.");
		},
		permissions: [
			"administrator",
		]
	},
	"removeIgnoredUser": {
		usage: "<user>",
		help: "Remove a user from the ignore list.",
		process: function(args, bot, msg) {
			var user = botFunctions.compileArgs(args);

			if (!user) {
				botFunctions.sendMessage(bot, msg.channel, "You need to specify the user you want me to stop ignoring.");
				return;
			}

			var serverUser = botFunctions.getUserByName(msg.server, user);

			if (!serverUser) {
				botFunctions.sendMessage(bot, msg.channel, "Cannot find the user " + user);
				return;
			}

			var ignoredUsers = botFunctions.getConfigValue(msg.server, "IGNORE_USERS");
			var userIndex = ignoredUsers.indexOf(serverUser.id);

			if (userIndex == -1) {
				botFunctions.sendMessage(bot, msg.channel, "I do not ignore the user " + serverUser.name);
				return;
			}

			ignoredUsers.splice(userIndex,1);

			if (!botFunctions.setConfigValue(msg.server, "IGNORE_USERS", ignoredUsers)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "User " + serverUser.name + " will no longer be ignored.");
		},
		permissions: [
			"administrator",
		]
	},
	"getIgnoredChannels": {
		help: "Get the list of ignored channels on this server.",
		process: function(args, bot, msg) {
			var ignoredChannels = botFunctions.getConfigValue(msg.server, "IGNORE_CHANNELS");

			if (ignoredChannels.length == 0) {
				botFunctions.sendMessage(bot, msg.channel, "No channels are being ignored.");
				return;
			}

			var channelNames = [];

			for (var x=0; x<ignoredChannels.length; x++) {
				var serverChannel = botFunctions.getChannel(msg.server, ignoredChannels[x]);

				if (!serverChannel) {
					channelNames.push("Unknown channel id: " + ignoredChannels[x]);
					continue;
				}

				channelNames.push(serverChannel.name);
			}

			var output = "The following channels are being ignored by this bot:\n\t";
			output += channelNames.join("\n\t");

			botFunctions.sendMessage(bot, msg.channel, output);
		},
		permissions: [
			"administrator"
		]
	},
	"addIgnoredChannel": {
		usage: "[channel]",
		help: "Add a channel the bot should ignore.",
		process: function(args, bot, msg) {
			var channel = botFunctions.compileArgs(args);

			if (!channel) {
				channel = msg.channel;
			}

			var serverChannel = botFunctions.getChannelByName(msg.server, channel);

			if (!serverChannel) {
				botFunctions.sendMessage(bot, msg.channel, "Cannot find the channel " + channel);
				return;
			}

			var ignoredChannels = botFunctions.getConfigValue(msg.server, "IGNORE_CHANNELS");

			if (ignoredChannels.indexOf(serverChannel.id) > -1) {
				botFunctions.sendMessage(bot, msg.channel, "I already ignore the channel " + serverChannel.name);
				return;
			}

			ignoredChannels.push(serverChannel.id);

			if (!botFunctions.setConfigValue(msg.server, "IGNORE_CHANNELS", ignoredChannels)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "Channel " + serverChannel.name + " will now be ignored.");
		},
		permissions: [
			"administrator"
		]
	},
	"removeIgnoredChannel": {
		usage: "<channel>",
		help: "Remove a channel from the ignore list.",
		process: function(args, bot, msg) {
			var channel = botFunctions.compileArgs(args);

			if (!channel) {
				botFunctions.sendMessage(bot, msg.channel, "You need to specify the channel you want me to stop ignoring.");
				return;
			}

			var serverChannel = botFunctions.getChannelByName(msg.server, channel);

			if (!serverChannel) {
				botFunctions.sendMessage(bot, msg.channel, "Cannot find the channel " + channel);
				return;
			}

			var ignoredChannels = botFunctions.getConfigValue(msg.server, "IGNORE_CHANNELS");
			var channelIndex = ignoredChannels.indexOf(serverChannel.id);

			if (channelIndex == -1) {
				botFunctions.sendMessage(bot, msg.channel, "I do not ignore the channel " + serverChannel.name);
				return;
			}

			ignoredChannels.splice(channelIndex,1);

			if (!botFunctions.setConfigValue(msg.server, "IGNORE_CHANNELS", ignoredChannels)) {
				botFunctions.sendMessage(bot, msg.channel, "There was a problem storing the setting.");
				return;
			}

			botFunctions.sendMessage(bot, msg.channel, "Channel " + serverChannel.name + " will no longer be ignored.");
		},
		permissions: [
			"administrator"
		]
	},
	"help": {
		usage: "[module]",
		help: "Display help for this bot or a specific module.",
		process: function(args, bot, msg) {
			var moduleName = botFunctions.compileArgs(args);

			var commandPrefix = botFunctions.getConfigValue(msg.server, "COMMAND_PREFIX");
			var nameSeparator = botFunctions.getConfigValue(msg.server, "NAME_SEPARATOR");

			var output = "";

			if (!moduleName) {
				output += "\nGeneral bot commands:\n";

				for (var key in commands) {
					output += "\t" + commandPrefix + key;
					var usage = commands[key].usage;

					if (usage) {
						output += " " + usage;
					}

					output += "\n\t\t\t";
					output += commands[key].help + "\n";
				}
			}

			for (var moduleKey in botFunctions.loadedModules) {
				if (!botFunctions.moduleIsEnabled(msg.server, moduleKey)) {
					continue;
				}

				if (moduleName && moduleKey != moduleName) {
					continue;
				}

				var moduleCommands = botFunctions.loadedModules[moduleKey].commands;

				if (moduleCommands) {
					output += "\n" + moduleKey + " commands:\n"

					for (var key in moduleCommands) {
						output += "\t" + commandPrefix + key;
						var usage = moduleCommands[key].usage;

						if (usage) {
							output += " " + usage;
						}

						output += "\n\t\t\t";
						output += moduleCommands[key].help + "\n";
					}
				}
			}

			output = output.replace(/#NAME_SEPARATOR#/g, nameSeparator);

			if (!output) {
				botFunctions.sendMessage(bot, msg.channel, "There is no help.");
				return;
			}

			output = VERSION + " commands:\n" + output;

			botFunctions.sendMessage(bot, msg.channel, "Help sent as private message.");
			botFunctions.sendMessage(bot, msg.author, output);
		}
	},
};

function handleLogin(error, token) {
	if (error) {
		console.log("Error logging in: " + error);
	}

	if (token) {
		//console.log(VERSION + " logged in with token " + token);
		console.log(VERSION + " successfully logged in.");
	}
}

function handleDisconnect() {
	console.log("Disconnected.");
}

function handlePresence(oldUser, newUser) {
	for (var x=0; x<FGEBot.servers.length; x++) {
		var serverUser = botFunctions.getUser(FGEBot.servers[x], newUser.id);

		if (serverUser) {
			for (var key in botFunctions.loadedModules) {
				if (!botFunctions.moduleIsEnabled(FGEBot.servers[x], key)) {
					continue;
				}

				if (botFunctions.loadedModules[key].onPresence) {
					if (botFunctions.loadedModules[key].onPresence(FGEBot, FGEBot.servers[x], oldUser, newUser)) {
						return;
					}
				}
			}
		}
	}
}

function handleNewMember(server, user) {
	for (var key in botFunctions.loadedModules) {
		if (!botFunctions.moduleIsEnabled(server, key)) {
			continue;
		}

		if (botFunctions.loadedModules[key].onNewMember) {
			if (botFunctions.loadedModules[key].onNewMember(FGEBot, server, user)) {
				return;
			}
		}
	}
}

function handleMemberRemoved(server, user) {
	for (var key in botFunctions.loadedModules) {
		if (!botFunctions.moduleIsEnabled(server, key)) {
			continue;
		}

		if (botFunctions.loadedModules[key].onMemberRemoved) {
			if (botFunctions.loadedModules[key].onMemberRemoved(FGEBot, server, user)) {
				return;
			}
		}
	}
}

function handleMessage(message) {
	if (message.author == FGEBot.user) {
		return;
	}

	if (!config.RESPOND_TO_PRIVATEMESSAGES && message.channel.isPrivate) {
		return;
	}

	var ignoredUsers = botFunctions.getConfigValue(message.server, "IGNORE_USERS");

	if (ignoredUsers.length > 0) {
		var index = ignoredUsers.indexOf(message.author.id);

		if (index > -1) {
			return;
		}
	}

	var ignoredChannels = botFunctions.getConfigValue(message.server, "IGNORE_CHANNELS");

	if (ignoredChannels.length > 0) {
		var index = ignoredChannels.indexOf(message.channel.id);

		if (index > -1) {
			return;
		}
	}

	for (var key in botFunctions.loadedModules) {
		if (!botFunctions.moduleIsEnabled(message.server, key)) {
			continue;
		}

		if (botFunctions.loadedModules[key].onMessage) {
			if (botFunctions.loadedModules[key].onMessage(FGEBot, message.server, message)) {
				return;
			}
		}
	}

	var processed = 0;
	var messageContent = "";
	var respondToCommands = botFunctions.getConfigValue(message.server, "RESPOND_TO_COMMANDS");
	var respondToMentions = botFunctions.getConfigValue(message.server, "RESPOND_TO_MENTIONS");

	if (respondToMentions == 1) {
		var mentionString = FGEBot.user.mention();
		var mentionStringRenamed = botFunctions.getUserMentionRenamed(FGEBot.user);

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

	var commandPrefix = botFunctions.getConfigValue(message.server, "COMMAND_PREFIX");

	if (processed == 0 && respondToCommands == 1 && message.content.startsWith(commandPrefix)) {
		processed = 1;
		messageContent = message.content.substr(commandPrefix.length);
	}

	if (processed == 1) {
		var args = messageContent.split(" ");
		var cmd = botFunctions.findCommand(commands, args[0]);

		if (!cmd) {
			for (var key in botFunctions.loadedModules) {
				if (!botFunctions.moduleIsEnabled(message.server, key)) {
					continue;
				}

				if (!botFunctions.loadedModules[key].commands) {
					continue;
				}

				cmd = botFunctions.findCommand(botFunctions.loadedModules[key].commands, args[0]);

				if (cmd) {
					if (botFunctions.loadedModules[key].preprocess) {
						botFunctions.loadedModules[key].preprocess(args, FGEBot, message);
					}

					break;
				}
			}
		}

		if (cmd) {
			if (cmd.permissions && cmd.permissions.length>0) {
				if (message.channel.isPrivate) {
					botFunctions.sendMessage(FGEBot, message.channel, "Cannot execute " + args[0] + " through private messages.");
					return;
				}

				var userPermissions = message.channel.permissionsOf(message.author);

				for (var x=0; x<cmd.permissions.length; x++) {
					if (!userPermissions.hasPermission(cmd.permissions[x])) {
						botFunctions.sendMessage(FGEBot, message.channel, "Insufficient permissions to execute " + args[0]);
						return;
					}
				}
			}

			if (cmd.owner && cmd.owner == 1) {
				if (!config.OWNER_ID || message.author.id != config.OWNER_ID) {
					botFunctions.sendMessage(FGEBot, message.channel, "You are not allowed to execute " + args[0]);
					return;
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
					//botFunctions.sendMessage(FGEBot, message.channel, "Command " + message.content + " failed.\n" + e.stack);
				}
			}
		}
	}
}

FGEBot.on("disconnected", handleDisconnect);
FGEBot.on("presence", handlePresence);
FGEBot.on("serverNewMember", handleNewMember);
FGEBot.on("serverMemberRemoved", handleMemberRemoved);
FGEBot.on("message", handleMessage);

if (config.TOKEN) {
	FGEBot.loginWithToken(config.TOKEN, null, null, handleLogin);
} else {
	FGEBot.login(config.LOGIN, config.PASSWORD, handleLogin);
}

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
