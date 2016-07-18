var Client = require('node-rest-client').Client;
 
var client = new Client();

var useBetaServer = 1;

//internal helper functions
function _sanitizeString(input) {
	var output = input.replace(" ", "%20").replace("+", "%2B");
	return output;
}

function _desanitizeString(input) {
	var output = input.replace("%20", " ").replace("%2B", "+");
	return output;
}

function _checkAliases(system, unsanitized) {
	var key = null;

	if (unsanitized == 1) {
		key = system.toLowerCase();
	} else {
		key = _desanitizeString(system).toLowerCase();
	}

	if (aliases[key]) {
		if (unsanitized == 1) {
			system = aliases[key];
		} else {
			system = _sanitizeString(aliases[key]);
		}
	}

	return system;
}

function _getServerString() {
	var serverString = "";

	if (useBetaServer == 0) {
		serverString = "http://api.edmaterializer.com";
	} else {
		serverString = "http://api.edmaterializer.com";
	}

	return serverString;
}

//internal EDMaterializer client functions
function _getStars(system, callback) {
	function responseHandler(data, response) {
		if (data && data.data && data.data.length > 0) {
			callback(data.data);
		} else {
			callback(null);
		}
	}

	function errorHandler(err) {	
		console.log("Something went wrong on the request", err.request.options);
		callback(null);
	}

	var serverString = _getServerString();
	client.get(serverString + "/api/v4/stars?system=" + system, responseHandler).on("error", errorHandler);
}

function _getWorlds(system, callback) {
	function responseHandler(data, response) {
		if (data && data.data && data.data.length > 0) {
			callback(data.data);
		} else {
			callback(null);
		}
	}

	function errorHandler(err) {	
		console.log("Something went wrong on the request", err.request.options);
		callback(null);
	}

	var serverString = _getServerString();
	client.get(serverString + "/api/v4/worlds?system=" + system, responseHandler).on("error", errorHandler);
}

function _showStarInfo(starId, callback) {
	function responseHandler(data, response) {
		if (data && data.data) {
			callback(data.data);
		} else {
			callback(null);
		}
	}

	function errorHandler(err) {
		console.log("Something went wrong on the request", err.request.options);
		callback(null);
	}

	var serverString = _getServerString();
	client.get(serverString + "/api/v4/stars/" + starId, responseHandler).on("error", errorHandler);
}

function _showSurveyInfo(surveyId, callback) {
	function responseHandler(data, response) {
		if (data && data.data) {
			callback(data.data);
		} else {
			callback(null);
		}
	}

	function errorHandler(err) {
		console.log("Something went wrong on the request", err.request.options);
		callback(null);
	}

	var serverString = _getServerString();
	client.get(serverString + "/api/v4/surveys/" + surveyId, responseHandler).on("error", errorHandler);
}

function _showWorldInfo(worldId, callback) {
	function responseHandler(data, response) {
		if (data && data.data) {
			callback(data.data);
		} else {
			callback(null);
		}
	}

	function errorHandler(err) {
		console.log("Something went wrong on the request", err.request.options);
		callback(null);
	}

	var serverString = _getServerString();
	client.get(serverString + "/api/v4/worlds/" + worldId, responseHandler).on("error", errorHandler);
}

//exported functions
function getStars(system, bot, message) {
	function callback(data) {
		if (!data) {
			bot.sendMessage(message.channel, "No data for " + system);
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

		bot.sendMessage(message.channel, output);
	}

	_getStars(system, callback);
}

function getWorlds(system, bot, message) {
	function callback(data) {
		if (!data) {
			bot.sendMessage(message.channel, "No data for " + system);
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

		bot.sendMessage(message.channel, output);
	}

	_getWorlds(system, callback);
}

function setUseBetaServer(useBeta) {
	if (useBeta == 0) {
		console.log("ED Materializer: Using the Live Server");
	} else {
		console.log("ED Materializer: Using the Beta Server");
	}

	useBetaServer = useBeta;
}

function showStarInfo(starId, bot, message) {
	function callback(data) {
		if (!data) {
			bot.sendMessage(message.channel, "Cannot find star-id " + starId);
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

		bot.sendMessage(message.channel, output);
	}

	_showStarInfo(starId, callback);
}

function showSurveyInfo(surveyId, bot, message) {
	function callback(data) {
		if (!data) {
			bot.sendMessage(message.channel, "Cannot find survey-id " + surveyId);
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

		bot.sendMessage(message.channel, output);
	}

	_showSurveyInfo(surveyId, callback);
}

function showWorldInfo(worldId, bot, message) {
	function callback(data) {
		if (!data) {
			bot.sendMessage(message.channel, "Cannot find world-id " + worldId);
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

		bot.sendMessage(message.channel, output);
	}

	_showWorldInfo(worldId, callback);
}

//exports
exports.getStars = getStars;
exports.getWorlds = getWorlds;
exports.setUseBetaServer = setUseBetaServer;
exports.showStarInfo = showStarInfo;
exports.showSurveyInfo = showSurveyInfo;
exports.showWorldInfo = showWorldInfo;
