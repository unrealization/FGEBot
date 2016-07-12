var Client = require('node-rest-client').Client;
 
var client = new Client();

var aliases = {};
aliases["kippax ring"] = "HIP 72043";
aliases["rr lyrae"] = "HIP 95497";
aliases["jaques station"] = "Eol Prou RS-T d3-94";
aliases["sag a"] = "Sagittarius A*;

var _getSystem = function(commander, callback) {
	client.get("http://www.edsm.net/api-logs-v1/get-position?commanderName=" + commander, function (data, response) {
		try {
			callback(data);
		} catch(e) {
			console.log('JSON parse exception', e);
			callback(null);
		}
	}).on('error', function (err) {
		callback(null);
		console.log('Something went wrong on the request', err.request.options);
	});
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
 
var getPosition = function(commander, bot, message) {
	_getSystem(commander, function(data) {
		bot.sendMessage(message.channel, _getPositionString(commander, data));
	});
}

var _getSystemCoords = function(system, callback) {
	var key = system.toLowerCase();
	if (aliases[key]) {
		system = aliases[key];
	}
	client.get("http://www.edsm.net/api-v1/system?systemName=" + system + "&coords=1", function (data, response) {
		if (data) {
			if (!data.name) {
				data = null;
			}
			callback(data);
		}
	}).on('error', function (err) {
		callback(null);
	});
}

var _getNearbySystems = function(system, range, callback) {
	var key = system.toLowerCase();

	if (aliases[key]) {
		system = aliases[key];
	}

	var rangeParameter = "";

	if (range!=null) {
		rangeParameter = "&radius=" + range;
	}

	client.get("https://www.edsm.net/api-v1/sphere-systems?systemName=" + system + "&coords=1" + rangeParameter, function(data, response) {
		if (data) {
			if (data.length == 0) {
				data = null;
			}

			callback(data);
		}
	}).on('error', function(erro) {
		callback(null);
	});
}

var _getCommanderCoords = function(commander, callback) {
	_getSystem(commander, function(data) {
		var output = _getPositionString(commander, data);
		if (data) {
			if (data.system) {
				_getSystemCoords(data.system, function(coords) {
					if (coords) {
						callback(coords);
					} else {
						callback(null);
					}
				});
			} else {
				callback(null);
			}
		} else {
			callback(null);
		}
	});
}

var _getSystemOrCmdrCoords = function(query, callback) {
	_getSystemCoords(query, function(coords) {
		if (coords) {
			// console.log(query + " is a system");
			callback(coords);
		} else {
			_getCommanderCoords(query, function(coords) {
				// if (coords) {
				// 	console.log(query + " is a commander");
				// } else {
				// 	console.log("Could not find " + query);
				// }
				callback(coords);
			});
		}
	});
}

var _getCoordString = function(coords) {
	return "[ " + coords.coords.x + " : " + coords.coords.y + " : " + coords.coords.z + " ]";
}

var getSystemCoords = function(system, bot, message) {
	_getSystemCoords(system, function(coords) {
		var output = "Sorry, " + system + " is not in EDSM";
		if (coords) {
			output = "System: " + coords.name + " " + _getCoordString(coords);
		}
		bot.sendMessage(message.channel, output);
	});
}

var getNearbySystems = function(name, range, bot, message) {
	bot.sendMessage(message.channel, "This may take a while...");

	_getSystemOrCmdrCoords(name, function(coords) {
		if (coords) {
			var systemName = coords.name;
			_getNearbySystems(systemName, range, function(data) {
				if (data) {
					var output = message.author + "\n";
					var lines = 1;

					for (var index=0; index<data.length; index++) {
						if (data[index].name == systemName) {
							continue;
						}

						distance = _calcDistance(coords.coords, data[index].coords);
						distance = Number(distance).toFixed(2);

						output += data[index].name + "\t(" + distance + " ly)\n";
						lines++;

						if (lines == 20) {
							bot.sendMessage(message.channel, output);
							output = message.author + "\n";
							lines = 1;
						}
					}

					if (output == "") {
						bot.sendMessage(message.channel, "No systems found.");
					} else {
						bot.sendMessage(message.channel, output);
					}
				}
			});
		} else {
			bot.sendMessage(message.channel, name + " not found.");
		}
	});
}

var getRoute = function(first, second, range, bot, message) {
	bot.sendMessage(message.channel, "This may take a while...");

	_getSystemOrCmdrCoords(first, function(firstSystemCoords) {
		if (firstSystemCoords) {
			var firstSystemName = firstSystemCoords.name;

			_getSystemOrCmdrCoords(second, function(secondSystemCoords) {
				if (secondSystemCoords) {
					var secondSystemName = secondSystemCoords.name;
					distance = _calcDistance(firstSystemCoords.coords, secondSystemCoords.coords);
					distance = Number(distance);

					var output = message.author + "\n#0\t" + firstSystemName + "\t(Jump Distance: 0 ly)\t(Distance from " + secondSystemName + ": " + distance.toFixed(2) + " ly)\n";
					var lines = 2;
					var jumpNo = 0;

					var routingCallback = function(data) {
						if (data) {
							var closestSystem = null;
							var closestSystemDistance = null;
							var closestSystemJump = null;

							for (var index=0; index<data.length; index++) {
								distance = _calcDistance(secondSystemCoords.coords, data[index].coords);
								distance = Number(distance);

								if (closestSystemDistance == null || distance < closestSystemDistance) {
									jump = _calcDistance(currentSystem.coords, data[index].coords);
									jump = Number(jump);

									closestSystem = data[index];
									closestSystemDistance = distance;
									closestSystemJump = jump;
								}
							}

							if (closestSystem == null || closestSystem.name == currentSystem.name) {
								output += "\nYou have reached a dead end. This may be due to insufficient data or an insufficient jump range.";
								bot.sendMessage(message.channel, output);
							} else {
								jumpNo++;
								output += "#" + jumpNo + "\t" + closestSystem.name + "\t(Jump Distance: " + closestSystemJump.toFixed(2) + " ly)\t(Distance from " + secondSystemName + ": " + closestSystemDistance.toFixed(2) + " ly)\n";
								lines++;

								if (lines == 20) {
									bot.sendMessage(message.channel, output);
									output = message.author + "\n";
									lines = 1;
								}

								if (closestSystem.name == secondSystemName) {
									output += "\nYou have arrived. Your destination is on your left.";
									bot.sendMessage(message.channel, output);
								} else {
									currentSystem = closestSystem;
									_getNearbySystems(currentSystem.name, range, routingCallback);
								}
							}
						} else {
							output += "\nSomething's wrong...";
							bot.sendMessage(message.channel, output);
						}
					};

					currentSystem = firstSystemCoords;
					_getNearbySystems(firstSystemName, range, routingCallback);
				} else {
					bot.sendMessage(message.channel, second + " not found.");
				}
			});
		} else {
			bot.sendMessage(message.channel, first + " not found.");
		}
	});
}

var _sq2 = function(a, b) {
	var val = a - b;
	return val * val;
}

var _calcDistance = function(a, b) {
	return Math.sqrt(_sq2(a.x, b.x) + _sq2(a.y, b.y) + _sq2(a.z, b.z));
}

var getCmdrCoords = function(commander, bot, message) {
	_getSystem(commander, function(data) {
		var output = _getPositionString(commander, data);
		if (data) {
			if (data.system) {
				_getSystemCoords(data.system, function(coords) {
					if (coords) {
						output += " " + _getCoordString(coords);
					}
					bot.sendMessage(message.channel, output);
				});
			}
		} else {
			bot.sendMessage(message.channel, output);
		}
	});
}

var getDistance = function(first, second, bot, message) {
	// Each query item could be a system or a commander...
	_getSystemOrCmdrCoords(first, function(firstCoords) {
		if (firstCoords) {
			_getSystemOrCmdrCoords(second, function(secondCoords) {
				if (secondCoords) {
					if (firstCoords.coords && secondCoords.coords) {
						var dist = _calcDistance(firstCoords.coords, secondCoords.coords);
						bot.sendMessage(message.channel, "Distance between " + first + " and " + second + " is " + dist.toFixed(2) + " ly");
					} else {
						var output = "Sorry, could not calculate the distance from " + first + " to " + second;
						if (firstCoords.coords == undefined) {
							output += "\n" + first + " has shared their location, but we have no coordinates for it";
						}
						if (secondCoords.coords == undefined) {
							output += "\n" + second + " has shared their location, but we have no coordinates for it";
						}
						bot.sendMessage(message.channel, output);
					}
				} else {
					bot.sendMessage(message.channel, "Sorry, " + second + " could not be located");
				}
			});
		} else {
			bot.sendMessage(message.channel, "Sorry, " + first + " could not be located");
		}
	});
}

exports.getPosition = getPosition;
exports.getSystemCoords = getSystemCoords;
exports.getCmdrCoords = getCmdrCoords;
exports.getDistance = getDistance;
exports.getNearbySystems = getNearbySystems;
exports.getRoute = getRoute;
exports.aliases = aliases
