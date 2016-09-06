var edmaterializer = require("../api/edmaterializer.js");
var botFunctions = require("../bot_functions.js");

//
const VERSION = "2.0";

var defaultModuleConfig = {
	"EDMATERIALIZER_USE_BETASERVER": 0,
};

//
function getApiObject(server) {
	var edmaterializerUseBetaServer = botFunctions.getConfigValue(server, "EDMATERIALIZER_USE_BETASERVER");
	edmaterializer.setUseBetaServer(edmaterializerUseBetaServer);
	return edmaterializer;
}

function setUseBetaServer(args, bot, msg) {
	var edmaterializerUseBetaServer = botFunctions.getConfigValue(msg.server, "EDMATERIALIZER_USE_BETASERVER");
	edmaterializer.setUseBetaServer(edmaterializerUseBetaServer);
}

//
function getStars(args, bot, msg) {
	function callback(data) {
		if (!data) {
			botFunctions.sendMessage(bot, msg.channel, "No data for " + system);
			return;
		}

		var output = "";

		for (var index=0; index<data.length; index++) {
			var starInfo = data[index].attributes;
			output += starInfo["system-name"];

			if (starInfo["star"]) {
				output += " " + starInfo["star"];
			}

			if (starInfo["spectral-class"]) {
				output += " (" + starInfo["spectral-class"];

				if (starInfo["spectral-subclass"]) {
					output += starInfo["spectral-subclass"];

					if (starInfo["luminosity"]) {
						output += starInfo["luminosity"];
					}
				}

				output += ")";
			}

			output += " (Star Id: " + data[index]["id"] + ")\n";
		}

		botFunctions.sendMessage(bot, msg.channel, output);
	}

	var system = botFunctions.compileArgs(args).trim();

	if (!system) {
		botFunctions.sendMessage(bot, msg.channel, "You need to supply the system you want to query.");
		return;
	}

	edmaterializer.getStars(system, callback);
}

function getWorlds(args, bot, msg) {
	function callback(data) {
		if (!data) {
			botFunctions.sendMessage(bot, msg.channel, "No data for " + system);
			return;
		}

		var output = "";

		for (var index=0; index<data.length; index++) {
			var worldInfo = data[index].attributes;
			output += worldInfo["system-name"] + " " + worldInfo["world"];

			if (worldInfo["world-type"]) {
				output += " (" + worldInfo["world-type"] + ")";
			}

			output += " (World Id: " + data[index]['id'] + ")\n";
		}

		botFunctions.sendMessage(bot, msg.channel, output);
	}

	var system = botFunctions.compileArgs(args).trim();

	if (!system) {
		botFunctions.sendMessage(bot, msg.channel, "You need to supply the system you want to query.");
		return;
	}

	edmaterializer.getWorlds(system, callback);
}

function showStar(args, bot, msg) {
	function callback(data) {
		if (!data) {
			botFunctions.sendMessage(bot, msg.channel, "Cannot find star-id " + starId);
			return;
		}

		var starInfo = data.attributes;

		var output = "Star:\t" + starInfo["system-name"];

		if (starInfo["star"]) {
			output += " " + starInfo["star"];
		}

		output += "\n";

		if (starInfo["spectral-class"]) {
			output += "Spectral Class:\t" + starInfo["spectral-class"];

			if (starInfo["spectral-subclass"]) {
				output += starInfo["spectral-subclass"];

				if (starInfo["luminosity"]) {
					output += starInfo["luminosity"];
				}
			}

			output += "\n";
		}

		if (starInfo["solar-mass"]) {
			output += "Mass:\t" + starInfo["solar-mass"] + " mSol\n";
		}

		if (starInfo["solar-radius"]) {
			output += "Radius:\t" + starInfo["solar-radius"] + " rSol\n";
		}

		if (starInfo["surface-temp"]) {
			output += "Surface Temperature:\t" + starInfo["surface-temp"] + " K\n";
		}

		if (starInfo["star-age"]) {
			//output += "Age:\t" + starInfo["star-age"];
		}

		if (starInfo["orbit-period"]) {
			//output += "Orbital Period:\t" + starInfo["orbit-period"];
		}

		if (starInfo["arrival-point"]) {
			output += "Distance from arrival point:\t" + starInfo["arrival-point"] + " ls\n";
		}

		if (starInfo["notes"]) {
			output += "Notes:\t" + starInfo["notes"] + "\n";
		}

		botFunctions.sendMessage(bot, msg.channel, output);
	}

	var starId = botFunctions.compileArgs(args).trim();
	edmaterializer.showStarInfo(starId, callback);
}

function showWorld(args, bot, msg) {
	function callback(data) {
		if (!data) {
			botFunctions.sendMessage(bot, msg.channel, "Cannot find world-id " + worldId);
			return;
		}

		var worldInfo = data.attributes;

		var output = "World:\t" + worldInfo["system-name"] + " " + worldInfo["world"] + "\n";

		if (worldInfo["world-type"]) {
			output += "World Type:\t" + worldInfo["world-type"] + "\n";
		}

		if (worldInfo["arrival-point"]) {
			output += "Distance from arrival point:\t" + worldInfo["arrival-point"] + " ls\n";
		}

		if (worldInfo["mass"]) {
			output += "Mass:\t" + worldInfo["mass"] + " mEarth\n";
		}

		if (worldInfo["radius"]) {
			output += "Radius:\t" + worldInfo["radius"] + " km\n";
		}

		if (worldInfo["gravity"]) {
			output += "Gravity:\t" + worldInfo["gravity"] + " G\n";
		}

		if (worldInfo["surface-temp"]) {
			output += "Surface Temperature:\t" + worldInfo["surface-temp"] + " K\n";
		}

		if (worldInfo["surface-pressure"]) {
			//output += "Surface Pressure:\t" + worldInfo["surface-pressure"];
		}

		if (worldInfo["orbit-period"]) {
			//output += "Orbital Period:\t" + worldInfo["orbit-period"];
		}

		if (worldInfo["rotation-period"]) {
			//output += "Rotation Period:\t" + worldInfo["rotation-period"];
		}

		if (worldInfo["semi-major-axis"]) {
			//output += "Semi-major axis:\t" + worldInfo["semi-major-axis"];
		}

		if (worldInfo["terrain-difficulty"]) {
			//output += "Terrain Difficulty:\t" + worldInfo["terrain-difficulty"];
		}

		if (worldInfo["vulcanism-type"]) {
			output += "Vulcanism:\t" + worldInfo["vulcanism-type"] + "\n";
		}

		if (worldInfo["rock-pct"]) {
			output += "Rock:\t" + worldInfo["rock-pct"] + " %\n";
		}

		if (worldInfo["metal-pct"]) {
			output += "Metal:\t" + worldInfo["metal-pct"] + " %\n";
		}

		if (worldInfo["ice-pct"]) {
			output += "Ice:\t" + worldInfo["ice-pct"] + " %\n";
		}

		if (worldInfo["reserve"]) {
			//output += "Reserve:\t" + worldInfo["reserve"];
		}

		if (worldInfo["terraformable"]) {
			//output += "Terraformable:\t" + worldInfo["terraformable"];
		}

		if (worldInfo["atmosphere-type"]) {
			//output += "Atmosphere Type:\t" + worldInfo["atmosphere-type"];
		}

		if (worldInfo["notes"]) {
			output += "Notes:\t" + worldInfo["notes"] + "\n";
		}

		if (data.relationships.surveys && data.relationships.surveys.data && data.relationships.surveys.data.length > 0) {
			output += "\n";
			output += "Surveys for " + worldInfo["system-name"] + " " + worldInfo["world"] + ":\n";

			for (var index=0; index<data.relationships.surveys.data.length; index++) {
				var surveyInfo = data.relationships.surveys.data[index];
				output += "Survey Id:\t" + surveyInfo.id + "\n";
			}
		}

		botFunctions.sendMessage(bot, msg.channel, output);
	}

	var worldId = botFunctions.compileArgs(args).trim();
	edmaterializer.showWorldInfo(worldId, callback);
}

function showSurvey(args, bot, msg) {
	function callback(data) {
		if (!data) {
			botFunctions.sendMessage(bot, msg.channel, "Cannot find survey-id " + surveyId);
			return;
		}

		var surveyInfo = data.attributes;
		var output = "Very common materials:\n";

		if (surveyInfo["carbon"]) {
			output += "Carbon\n";
		}

		if (surveyInfo["iron"]) {
			output += "Iron\n";
		}

		if (surveyInfo["nickel"]) {
			output += "Nickel\n";
		}

		if (surveyInfo["phosphorus"]) {
			output += "Phosphorus\n";
		}

		if (surveyInfo["sulphur"]) {
			output += "Sulphur\n";
		}

		output += "\n";
		output += "Common materials:\n";

		if (surveyInfo["arsenic"]) {
			output += "Arsenic\n";
		}

		if (surveyInfo["chromium"]) {
			output += "Chromium\n";
		}

		if (surveyInfo["germanium"]) {
			output += "Germanium\n";
		}

		if (surveyInfo["manganese"]) {
			output += "Manganese\n";
		}

		if (surveyInfo["selenium"]) {
			output += "Selenium\n";
		}

		if (surveyInfo["vanadium"]) {
			output += "Vanadium\n";
		}

		if (surveyInfo["zinc"]) {
			output += "Zinc\n";
		}

		if (surveyInfo["zirconium"]) {
			output += "Zirconium\n";
		}

		output += "\n";
		output += "Rare materials:\n";

		if (surveyInfo["cadmium"]) {
			output += "Cadmium\n";
		}

		if (surveyInfo["molybdenum"]) {
			output += "Molybdenum\n";
		}

		if (surveyInfo["niobium"]) {
			output += "Niobium\n";
		}

		if (surveyInfo["tin"]) {
			output += "Tin\n";
		}

		if (surveyInfo["tungsten"]) {
			output += "Tungsten\n";
		}

		output += "\n";
		output += "Very rare materials:\n";

		if (surveyInfo["antimony"]) {
			output += "Antimony\n";
		}

		if (surveyInfo["polonium"]) {
			output += "Polonium\n";
		}

		if (surveyInfo["ruthenium"]) {
			output += "Ruthenium\n";
		}

		if (surveyInfo["technetium"]) {
			output += "Technetium\n";
		}

		if (surveyInfo["tellurium"]) {
			output += "Tellurium\n";
		}

		if (surveyInfo["yttrium"]) {
			output += "Yttrium\n";
		}

		botFunctions.sendMessage(bot, msg.channel, output);
	}

	var surveyId = botFunctions.compileArgs(args).trim();
	edmaterializer.showSurveyInfo(surveyId, callback);
}

//
var commands = {
	"getStars": {
		usage: "<system>",
		help: "List the stars of a given system",
		process: getStars
	},
	"getWorlds": {
		usage: "<system>",
		help: "List the worlds of a given system",
		process: getWorlds
	},
	"showStar": {
		usage: "<starId>",
		help: "Show information on the given star",
		process: showStar
	},
	"showWorld": {
		usage: "<worldId>",
		help: "Show the information available on the given world",
		process: showWorld
	},
	"showSurvey": {
		usage: "<surveyId>",
		help: "Show information on the specified survey",
		process: showSurvey
	},
};

//
exports.VERSION = VERSION;
exports.defaultModuleConfig = defaultModuleConfig;
exports.getApiObject = getApiObject;
exports.preprocess = setUseBetaServer;
exports.commands = commands;
