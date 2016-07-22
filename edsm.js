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

function _calculateStep(originCoords, destinationCoords, range) {
	var distance = _calcDistance(originCoords, destinationCoords);

	if (distance <= range) {
		return destinationCoords;
	}

	var rateX = (originCoords.x - destinationCoords.x)/distance;
	var rateY = (originCoords.y - destinationCoords.y)/distance;
	var rateZ = (originCoords.z - destinationCoords.z)/distance;

	var coords = {
		x: originCoords.x - (rateX * range),
		y: originCoords.y - (rateY * range),
		z: originCoords.z - (rateZ * range)
	};

	return coords;
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

function _sendMessage(bot, channel, message) {
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

function _getNearbySystemsByCoordinates(coords, range, callback) {
	function responseHandler(data, response) {
		if (data) {
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
	client.get(serverString + "/api-v1/sphere-systems?x=" + Number(coords.x).toFixed(2) + "&y=" + Number(coords.y).toFixed(2) + "&z=" + Number(coords.z).toFixed(2) + "&coords=1" + rangeParameter, responseHandler).on("error", errorHandler);
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
				_sendMessage(bot, message.channel, output);
			}
		} else {
			_sendMessage(bot, message.channel, output);
		}
	}

	function coordinatesResponseHandler(coords) {
		if (coords) {
			output += " " + _getCoordString(coords);
		}

		_sendMessage(bot, message.channel, output);
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

				_sendMessage(bot, message.channel, "Coordinates for " + name + " are unknown.");
				return;
			}

			firstSystem = coords;
			_getSystemOrCommanderCoordinates(_sanitizeString(second), secondCoordsResponseHandler);
		} else {
			_sendMessage(bot, message.channel, "Sorry, " + first + " could not be located.");
		}
	}

	function secondCoordsResponseHandler(coords) {
		if (coords) {
			if (coords.coords == undefined) {
				var name = second;

				if (coords.name) {
					name = coords.name;
				}

				_sendMessage(bot, message.channel, "Coordinates for " + name + " are unknown.");
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

			_sendMessage(bot, message.channel, "The distance between " + firstName + " and " + secondName + " is " + Number(distance).toFixed(2) + " ly.");
		} else {
			_sendMessage(bot, message.channel, "Sorry, " + second + " could not be located.");
		}
	}

	var firstSystem = null;
	var secondSystem = null;
	_getSystemOrCommanderCoordinates(_sanitizeString(first), firstCoordsResponseHandler);
}

function getNearbySystems(name, range, bot, message) {
	function coordinatesResponseHandler(coords) {
		if (coords) {
			_sendMessage(bot, message.channel, "This may take a while... Gonna send you a message...");
			systemName = coords.name;
			systemCoords = coords.coords;
			_getNearbySystems(_sanitizeString(systemName), range, nearbySystemsResponseHandler);
		} else {
			_sendMessage(bot, message.channel, name + " not found.");
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
				_sendMessage(bot, message.author, "No systems can be found near " + systemName);
			} else {
				output = systems + " systems found near " + systemName + "\n\n" + output;
				_sendMessage(bot, message.author, output);
			}
		} else {
			_sendMessage(bot, message.author, "Something went wrong.");
		}
	}


	var systemName = null;
	var systemCoords = null;
	_getSystemOrCommanderCoordinates(_sanitizeString(name), coordinatesResponseHandler);
}

function getRoute(origin, destination, range, bot, message) {
	function originCoordsResponseHandler(coords) {
		if (coords) {
			if (coords.coords == undefined) {
				var name = origin;

				if (coords.name) {
					name = coords.name;
				}

				_sendMessage(bot, message.channel, "Coodinates for " + name + " are unknown.");
				return;
			}

			originSystem = coords;
			_getSystemOrCommanderCoordinates(_sanitizeString(destination), destinationCoordsResponseHandler);
		} else {
			_sendMessage(bot, message.channel, "Sorry, " + origin + " could not be located.");
		}
	}

	function destinationCoordsResponseHandler(coords) {
		if (coords) {
			if (coords.coords == undefined) {
				var name = destination;

				if (coords.name) {
					name = coords.name;
				}

				_sendMessage(bot, message.channel, "Coordinates for " + name + " are unknown.");
				return;
			}

			_sendMessage(bot, message.channel, "This may take a while... Gonna send you a message...");
			destinationSystem = coords;
			var distance = _calcDistance(originSystem.coords, destinationSystem.coords);
			jumpNo = 0;
			output += "#0\t" + originSystem.name + "\t(Jump Distance: 0ly)\t(Distance from " + destinationSystem.name + ": " + Number(distance).toFixed(2) + " ly)\n";
			currentSystem = originSystem;
			_getNearbySystems(_sanitizeString(currentSystem.name), range, nearbySystemsResponseHandler);
		} else {
			_sendMessage(bot, message.channel, "Sorry, " + destination + " could not be located.");
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

				var distance = _calcDistance(destinationSystem.coords, data[index].coords);

				if (closestSystemDistance == null || distance < closestSystemDistance) {
					closestSystem = data[index];
					closestSystemDistance = distance;
				}
			}

			if (closestSystem == null || closestSystem.name == currentSystem.name) {
				output += "\nYou have reached a dead end. This may be due to insufficent data or an insufficient jump range.";
				_sendMessage(bot, message.author, output);
			} else {
				jumpNo++;
				var jumpDistance = _calcDistance(currentSystem.coords, closestSystem.coords);
				output += "#" + jumpNo + "\t" + closestSystem.name + "\t(Jump Distance: " + Number(jumpDistance).toFixed(2) + " ly)\t(Distance from " + destinationSystem.name + ": " + Number(closestSystemDistance).toFixed(2) + " ly)\n";

				if (closestSystem.name == destinationSystem.name) {
					output += "\nYou have arrived. Your destination is on your left.";
					_sendMessage(bot, message.author, output);
				} else {
					currentSystem = closestSystem;
					_getNearbySystems(_sanitizeString(currentSystem.name), range, nearbySystemsResponseHandler);
				}
			}
		} else {
			output += "\nSomething's wrong...";
			_sendMessage(bot, message.author, output);
		}
	}

	var originSystem = null;
	var DestinationSystem = null;
	var currentSystem = null;
	var output = "";
	var jumpNo = null;

	_getSystemOrCommanderCoordinates(_sanitizeString(origin), originCoordsResponseHandler);
}

function getSystemCoordinates(system, bot, message) {
	function responseHandler(coords) {
		var output = "Sorry, " + system + " is not in EDSM.";

		if (coords) {
			output = "System: " + coords.name + " " + _getCoordString(coords);
		}

		_sendMessage(bot, message.channel, output);
	}

	_getSystemCoordinates(_checkAliases(_sanitizeString(system)), responseHandler);
}

function getWaypoints(origin, destination, range, bot, message) {
	function originCoordsResponseHandler(coords) {
		if (coords) {
			if (coords.coords == undefined) {
				var name = origin;

				if (coords.name) {
					name = coords.name;
				}

				_sendMessage(bot, message.channel, "Coodinates for " + name + " are unknown.");
				return;
			}

			originSystem = coords;
			_getSystemOrCommanderCoordinates(_sanitizeString(destination), destinationCoordsResponseHandler);
		} else {
			_sendMessage(bot, message.channel, "Sorry, " + origin + " could not be located.");
		}
	}

	function destinationCoordsResponseHandler(coords) {
		if (coords) {
			if (coords.coords == undefined) {
				var name = destination;

				if (coords.name) {
					name = coords.name;
				}

				_sendMessage(bot, message.channel, "Coordinates for " + name + " are unknown.");
				return;
			}

			_sendMessage(bot, message.channel, "This may take a while... Gonna send you a message...");
			destinationSystem = coords;
			var distance = _calcDistance(originSystem.coords, destinationSystem.coords);
			currentOriginCoords = originSystem.coords;
			currentCoords = _calculateStep(currentOriginCoords, destinationSystem.coords, range);
			waypointNo = 0;
			output += "#0\t" + originSystem.name + "\t(Distance: 0ly)\t(Distance from " + destinationSystem.name + ": " + Number(distance).toFixed(2) + " ly)\n";

			if (currentCoords == destinationSystem.coords) {
				_sendMessage(bot, message.author, output);
			} else {
				_getNearbySystemsByCoordinates(currentCoords, searchRadius, nearbySystemsResponseHandler);
			}
		} else {
			_sendMessage(bot, message.channel, "Sorry, " + destination + " could not be located.");
		}
	}

	function nearbySystemsResponseHandler(data) {
		if (data) {
			var bestSystem = null;
			var bestSystemDistance = null;

			for (var index=0; index<data.length; index++) {
				if (data[index].coords == undefined) {
					continue;
				}

				var distance = _calcDistance(currentOriginCoords, data[index].coords);

				if (distance > range) {
					continue;
				}

				if (bestSystemDistance == null || distance > bestSystemDistance) {
					bestSystem = data[index];
					bestSystemDistance = distance;
				}
			}

			waypointNo++;

			if (bestSystem == null) {
				var distance = _calcDistance(currentOriginCoords, currentCoords);
				output += "#" + waypointNo + "\tX: " + Number(currentCoords.x).toFixed(2) + ", Y: " + Number(currentCoords.y).toFixed(2) + ", Z: " + Number(currentCoords.z).toFixed(2) + "\t(Distance: " + Number(distance).toFixed(2) + " ly)";
			} else {
				currentCoords = bestSystem.coords;
				output += "#" + waypointNo + "\t" + bestSystem.name + "\t(Distance: " + Number(bestSystemDistance).toFixed(2) + " ly)";
			}

			var destinationDistance = _calcDistance(currentCoords, destinationSystem.coords);
			output += "\t(Distance to " + destinationSystem.name + ": " + Number(destinationDistance).toFixed(2) + " ly)\n";

			currentOriginCoords = currentCoords;
			currentCoords = _calculateStep(currentOriginCoords, destinationSystem.coords, range);

			if (currentCoords == destinationSystem.coords) {
				waypointNo++;
				output += "#" + waypointNo + "\t" + destinationSystem.name + "\t(Distance: " + Number(destinationDistance).toFixed(2) + " ly)";
				_sendMessage(bot, message.author, output);
			} else {
				_getNearbySystemsByCoordinates(currentCoords, searchRadius, nearbySystemsResponseHandler);
			}
		} else {
			output += "\nSomething's wrong...";
			_sendMessage(bot, message.author, output);
		}
	}

	var originSystem = null;
	var destinationSystem = null;
	var currentOriginCoords = null;
	var currentCoords = null;
	var output = "";
	var waypointNo = null;
	var searchRadius = 50;

	_getSystemOrCommanderCoordinates(_sanitizeString(origin), originCoordsResponseHandler);
}

function listAliases(bot, message) {
	var output = "Supported stellar aliases:";

	for (var key in aliases) {
		if (typeof aliases[key] != "function") {
			output += "\n\t*" + key + " -> " + aliases[key];
		}
	}

	_sendMessage(bot, message.channel, output);
}

function locateCommander(commander, bot, message) {
	function callback(data) {
		_sendMessage(bot, message.channel, _getPositionString(commander, data));
	}

	_getCommanderSystem(_sanitizeString(commander), callback);
}

function setUseBetaServer(useBeta) {
	if (useBeta == 0) {
		console.log("EDSM: Using the Live Server");
	} else {
		console.log("EDSM: Using the Beta Server");
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

			_sendMessage(bot, message.channel, output);
		} else {
			_sendMessage(bot, message.channel, "It appears as if there has been some sort of problem.");
		}
	}

	_submitDistance(_checkAliases(targetSystem, 1), _checkAliases(referenceSystem, 1), distance, commander, responseHandler);
}

//exports
exports.getCommanderCoordinates = getCommanderCoordinates;
exports.getDistance = getDistance;
exports.getNearbySystems = getNearbySystems;
exports.getRoute = getRoute;
exports.getSystemCoordinates = getSystemCoordinates;
exports.getWaypoints = getWaypoints;
exports.listAliases = listAliases;
exports.locateCommander = locateCommander;
exports.setUseBetaServer = setUseBetaServer;
exports.submitDistance = submitDistance;
