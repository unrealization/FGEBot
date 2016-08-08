var edmaterializer = require("../api/edmaterializer.js");
var botFunctions = require("../bot_functions.js");

var defaultModuleConfig = {
	"EDMATERIALIZER_USE_BETASERVER": 0,
};

function setUseBetaServer(args, bot, msg) {
	var edmaterializerUseBetaServer = botFunctions.getConfigValue(msg.server, "EDMATERIALIZER_USE_BETASERVER");
	edmaterializer.setUseBetaServer(edmaterializerUseBetaServer);
}

var commands = {
	"getStars": {
		usage: "<system>",
		help: "List the stars of a given system",
		process: function(args, bot, msg) {
			var system = botFunctions.compileArgs(args);
			edmaterializer.getStars(system, bot, msg);
		}
	},
	"getWorlds": {
		usage: "<system>",
		help: "List the worlds of a given system",
		process: function(args, bot, msg) {
			var system = botFunctions.compileArgs(args);
			edmaterializer.getWorlds(system, bot, msg);
		}
	},
	"showStar": {
		usage: "<starId>",
		help: "Show information on the given star",
		process: function(args, bot, msg) {
			var starId = botFunctions.compileArgs(args);
			edmaterializer.showStarInfo(starId, bot, msg);
		}
	},
	"showWorld": {
		usage: "<worldId>",
		help: "Show the information available on the given world",
		process: function(args, bot, msg) {
			var worldId = botFunctions.compileArgs(args);
			edmaterializer.showWorldInfo(worldId, bot, msg);
		}
	},
	"showSurvey": {
		usage: "<surveyId>",
		help: "Show information on the specified survey",
		process: function(args, bot, msg) {
			var surveyId = botFunctions.compileArgs(args);
			edmaterializer.showSurveyInfo(surveyId, bot, msg);
		}
	},
};

exports.defaultModuleConfig = defaultModuleConfig;
exports.commands = commands;
exports.preprocess = setUseBetaServer;
