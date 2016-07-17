var Client = require('node-rest-client').Client;
 
var client = new Client();

var aliases = {};
aliases["kippax ring"] = "HIP 72043";
aliases["rr lyrae"] = "HIP 95497";
aliases["jaques station"] = "Eol Prou RS-T d3-94";
aliases["sag a"] = "Sagittarius A*";

var useBetaServer = 1;

//internal helper functions
var _sq2 = function(a, b) {
	var val = a - b;
	return val * val;
}

var _calcDistance = function(a, b) {
	return Math.sqrt(_sq2(a.x, b.x) + _sq2(a.y, b.y) + _sq2(a.z, b.z));
}

var _getCoordString = function(coords) {
	return "[ " + coords.coords.x + " : " + coords.coords.y + " : " + coords.coords.z + " ]";
}

var _getPositionString = function(commander, data) {
	var output = "Some error occurred";
	if (data) {
		if (data.system) {
			output = commander + " was last seen in " + data.system;
			if (data.date) {
				output += " at " + data.date;
			}
		} else {
			switch (data.msgnum) {
				case 100:
					output = "I have no idea where " + commander + " is. Perhaps they aren't sharing their position?";
					break;
				case 203:
					output = "There is no known commander by the name " + commander;
					break;
				default:
					// Use the default error message
					break;
			}
		}
	}
	return output;
}
 
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
		serverString = "https://www.edsm.net";
	} else {
		serverString = "http://beta.edsm.net:8080";
	}

	return serverString;
}

function _getCommanderCoordinates(commander, callback) {
	function systemResponseHandler(data) {
		var output = _getPositionString(commander, data);

		if (data) {
			if (data.system) {
				_getSystemCoordinates(_sanitizeString(data.system), coordinatesResponseHandler);
			} else {
				callback(null);
			}
		} else {
			callback(null);
		}
	}

	function coordinatesResponseHandler(coords) {
		if (coords) {
			callback(coords);
		} else {
			callback(null);
		}
	}

	_getCommanderSystem(commander, systemResponseHandler);
}

function _getSystemOrCommanderCoordinates(query, callback) {
	function systemResponseHandler(coords) {
		if (coords) {
			callback(coords);
		} else {
			_getCommanderCoordinates(query, commanderResponseHandler);
		}
	}

	function commanderResponseHandler(coords) {
		if (coords) {
			callback(coords);
		} else {
			callback(null);
		}
	}

	_getSystemCoordinates(_checkAliases(query), systemResponseHandler);
}

//internal EDSM client functions
function _getCommanderSystem(commander, callback) {
	function responseHandler(data, response) {
		try {
			callback(data);
		} catch(e) {
			console.log("JSON parse exception", e);
			callback(null);
		}
	}

	function errorHandler(err) {
		console.log("Something went wrong on the request", err.request.options);
		callback(null);
	}

	var serverString = _getServerString();
	client.get(serverString + "/api-logs-v1/get-position?commanderName=" + commander, responseHandler).on("error", errorHandler);
}

function _getNearbySystems(system, range, callback) {
	function responseHandler(data, response) {
		if (data) {
			if (data.length == 0) {
				data = null;
			}

			callback(data);
		} else {
			callback(null);
		}
	}

	function errorHandler(err) {
		callback(null);
	}

	var rangeParameter = "";

	if (range != null) {
		rangeParameter = "&radius=" + range;
	}

	var serverString = _getServerString();
	client.get(serverString + "/api-v1/sphere-systems?systemName=" + system + "&coords=1" + rangeParameter, responseHandler).on("error", errorHandler);
}

function _getSystemCoordinates(system, callback) {
	function responseHandler(data, response) {
		if (data) {
			if (!data.name) {
				data = null;
			}

			callback(data);
		} else {
			callback(null);
		}
	}

	function errorHandler(err) {
		callback(null);
	}

	var serverString = _getServerString();
	client.get(serverString + "/api-v1/system?systemName=" + system + "&coords=1", responseHandler).on("error", errorHandler);
}

function _submitDistance(targetSystem, referenceSystem, distance, commander, callback) {
	function responseHandler(data, response) {
		console.log(data);

		if (data) {
			if (data.length == 0) {
				data = null;
			}

			callback(data);
		} else {
			callback(null);
		}
	}

	function errorHandler(err) {
		callback(null);
	}

	var submissionData = {
		"data": {
			"test": 0,
			"commander": commander,
			"p0": {
				"name": targetSystem
			},
			"refs": [
				{
					"name": referenceSystem,
					"dist": distance
				}
			]
		}
	};

	var jsonData = [];
	jsonData["data"] = JSON.stringify(submissionData);
	console.log(jsonData["data"]);

	var serverString = _getServerString();
	client.post(serverString + "/api-v1/submit-distances", jsonData, responseHandler).on("error", errorHandler);
}

//exported functions
function getCommanderCoordinates(commander, bot, message) {
	function systemResponseHandler(data) {
		if (data) {
			output = _getPositionString(commander, data);

			if (data.system) {
				_getSystemCoordinates(_sanitizeString(data.system), coordinatesResponseHandler);
			} else {
				bot.sendMessage(message.channel, output);
			}
		} else {
			bot.sendMessage(message.channel, output);
		}
	}

	function coordinatesResponseHandler(coords) {
		if (coords) {
			output += " " + _getCoordString(coords);
		}

		bot.sendMessage(message.channel, output);
	}

	var output = commander + " cannot be found.";
	_getCommanderSystem(_sanitizeString(commander), systemResponseHandler);
}

function getDistance(first, second, bot, message) {
	function firstCoordsResponseHandler(coords) {
		if (coords) {
			if (coords.coords == undefined) {
				var name = first;

				if (coords.name) {
					name = coords.name;
				}

				bot.sendMessage(message.channel, "Coordinates for " + name + " are unknown.");
				return;
			}

			firstSystem = coords;
			_getSystemOrCommanderCoordinates(_sanitizeString(second), secondCoordsResponseHandler);
		} else {
			bot.sendMessage(message.channel, "Sorry, " + first + " could not be located.");
		}
	}

	function secondCoordsResponseHandler(coords) {
		if (coords) {
			if (coords.coords == undefined) {
				var name = second;

				if (coords.name) {
					name = coords.name;
				}

				bot.sendMessage(message.channel, "Coordinates for " + name + " are unknown.");
				return;
			}

			secondSystem = coords;
			var distance = _calcDistance(firstSystem.coords, secondSystem.coords);
			var firstName = first;

			if (firstSystem.name) {
				firstName = firstSystem.name;
			}

			var secondName = second;

			if (secondSystem.name) {
				secondName = secondSystem.name;
			}

			bot.sendMessage(message.channel, "The distance between " + firstName + " and " + secondName + " is " + Number(distance).toFixed(2) + " ly.");
		} else {
			bot.sendMessage(message.channel, "Sorry, " + second + " could not be located.");
		}
	}

	var firstSystem = null;
	var secondSystem = null;
	_getSystemOrCommanderCoordinates(_sanitizeString(first), firstCoordsResponseHandler);
}

function getNearbySystems(name, range, bot, message) {
	function coordinatesResponseHandler(coords) {
		if (coords) {
			systemName = coords.name;
			systemCoords = coords.coords;
			_getNearbySystems(_sanitizeString(systemName), range, nearbySystemsResponseHandler);
		} else {
			bot.sendMessage(message.author, name + " not found.");
		}
	}

	function nearbySystemsResponseHandler(data) {
		if (data) {
			var output = "";
			var systems = 0;

			for (var index=0; index<data.length; index++) {
				if (data[index].name == systemName) {
					continue;
				}

				var distance = _calcDistance(systemCoords, data[index].coords);
				output += data[index].name + "\t(" + Number(distance).toFixed(2) + " ly)\n";
				systems++;
			}

			if (systems == 0) {
				bot.sendMessage(message.author, "No systems can be found near " + systemName);
			} else {
				output = systems + " systems found near " + systemName + "\n\n" + output;
				bot.sendMessage(message.author, output);
			}
		} else {
			bot.sendMessage(message.author, "Something went wrong.");
		}
	}

	bot.sendMessage(message.channel, "This may take a while... Gonna send you a message...");

	var systemName = null;
	var systemCoords = null;
	_getSystemOrCommanderCoordinates(_sanitizeString(name), coordinatesResponseHandler);
}

function getRoute(first, second, range, bot, message) {
	function firstCoordsResponseHandler(coords) {
		if (coords) {
			if (coords.coords == undefined) {
				var name = first;

				if (coords.name) {
					name = coords.name;
				}

				bot.sendMessage(message.author, "Coodinates for " + name + " are unknown.");
				return;
			}

			firstSystem = coords;
			_getSystemOrCommanderCoordinates(_sanitizeString(second), secondCoordsResponseHandler);
		} else {
			bot.sendMessage(message.author, "Sorry, " + first + " could not be located.");
		}
	}

	function secondCoordsResponseHandler(coords) {
		if (coords) {
			if (coords.coords == undefined) {
				var name = second;

				if (coords.name) {
					name = coords.name;
				}

				bot.sendMessage(message.author, "Coordinates for " + name + " are unknown.");
				return;
			}

			secondSystem = coords;
			var distance = _calcDistance(firstSystem.coords, secondSystem.coords);
			jumpNo = 0;
			output += "#0\t" + firstSystem.name + "\t(Jump Distance: 0ly)\t(Distance from " + secondSystem.name + ": " + Number(distance).toFixed(2) + " ly)\n";
			currentSystem = firstSystem;
			_getNearbySystems(_sanitizeString(currentSystem.name), range, nearbySystemsResponseHandler);
		} else {
			bot.sendMessage(message.author, "Sorry, " + second + " could not be located.");
		}
	}

	function nearbySystemsResponseHandler(data) {
		if (data) {
			var closestSystem = null;
			var closestSystemDistance = null;

			for (var index=0; index<data.length; index++) {
				if (data[index].coords == undefined) {
					continue;
				}

				var distance = _calcDistance(secondSystem.coords, data[index].coords);

				if (closestSystemDistance == null || distance < closestSystemDistance) {
					closestSystem = data[index];
					closestSystemDistance = distance;
				}
			}

			if (closestSystem == null || closestSystem.name == currentSystem.name) {
				output += "\nYou have reached a dead end. This may be due to insufficent data or an insufficient jump range.";
				bot.sendMessage(message.author, output);
			} else {
				jumpNo++;
				var jumpDistance = _calcDistance(currentSystem.coords, closestSystem.coords);
				output += "#" + jumpNo + "\t" + closestSystem.name + "\t(Jump Distance: " + Number(jumpDistance).toFixed(2) + " ly)\t(Distance from " + secondSystem.name + ": " + Number(closestSystemDistance).toFixed(2) + " ly)\n";

				if (closestSystem.name == secondSystem.name) {
					output += "\nYou have arrived. Your destination is on your left.";
					bot.sendMessage(message.author, output);
				} else {
					currentSystem = closestSystem;
					_getNearbySystems(_sanitizeString(currentSystem.name), range, nearbySystemsResponseHandler);
				}
			}
		} else {
			output += "\nSomething's wrong...";
			bot.sendMessage(message.author, output);
		}
	}

	bot.sendMessage(message.channel, "This may take a while... Gonna send you a message...");
	var firstSystem = null;
	var secondSystem = null;
	var currentSystem = null;
	var output = "";
	var jumpNo = null;

	_getSystemOrCommanderCoordinates(_sanitizeString(first), firstCoordsResponseHandler);
}

function getSystemCoordinates(system, bot, message) {
	function responseHandler(coords) {
		var output = "Sorry, " + system + " is not in EDSM.";

		if (coords) {
			output = "System: " + coords.name + " " + _getCoordString(coords);
		}

		bot.sendMessage(message.channel, output);
	}

	_getSystemCoordinates(_checkAliases(_sanitizeString(system)), responseHandler);
}

function listAliases(bot, message) {
	var output = "Supported stellar aliases:";

	for (var key in aliases) {
		if (typeof aliases[key] != "function") {
			output += "\n\t*" + key + " -> " + aliases[key];
		}
	}

	bot.sendMessage(message.channel, output);
}

function locateCommander(commander, bot, message) {
	function callback(data) {
		bot.sendMessage(message.channel, _getPositionString(commander, data));
	}

	_getCommanderSystem(_sanitizeString(commander), callback);
}

function setUseBetaServer(useBeta) {
	if (useBeta == 0) {
		console.log("Using the Live Server");
	} else {
		console.log("Using the Beta Server");
	}

	useBetaServer = useBeta;
}

function submitDistance(targetSystem, referenceSystem, distance, commander, bot, message) {
	function responseHandler(data) {
		if (data) {
			var output = message.author + "\n";

			switch(data.basesystem.msgnum) {
				case 102:
					output += "Coordinates for " + data.basesystem.name + " are already known.\n";
					output += _getCoordString(data.basesystem) + "\n";
					break;
				case 104:
					output += "Coordinates for " + data.basesystem.name + " have been found.\n";
					output += _getCoordString(data.basesystem) + "\n";
					break;
				case 108:
					output += data.basesystem.msg + "\n";
					output += "Current number of reference systems: " + data.basesystem.refnum + "\n";
					break;
				default:
					output += data.basesystem.msg + "\n";
					break;
			}

			for (var index=0; index<data.distances.length; index++) {
				output += data.distances[index].msg + "\n";
				switch(data.distances[index].msgnum) {
					case 200:
						output += "\t" + data.distances[index].name + " -> " + data.basesystem.name + " = " + data.distances[index].dist + " ly\n";
						break;
					default:
						break;
				}
			}

			bot.sendMessage(message.channel, output);
		} else {
			bot.sendMessage(message.channel, "It appears as if there has been some sort of problem.");
		}
	}

	_submitDistance(_checkAliases(targetSystem, 1), _checkAliases(referenceSystem, 1), distance, commander + " Test", responseHandler);
}

//exports
exports.getCommanderCoordinates = getCommanderCoordinates;
exports.getDistance = getDistance;
exports.getNearbySystems = getNearbySystems;
exports.getRoute = getRoute;
exports.getSystemCoordinates = getSystemCoordinates;
exports.listAliases = listAliases;
exports.locateCommander = locateCommander;
exports.setUseBetaServer = setUseBetaServer;
exports.submitDistance = submitDistance;
