var Client = require('node-rest-client').Client;
 
var client = new Client();

var useBetaServer = 1;

//internal helper functions
function _getServerString() {
	var serverString = "";

	if (useBetaServer == 0) {
		serverString = "http://api.edmaterializer.com";
	} else {
		serverString = "http://api.edmaterializer.com";
	}

	return serverString;
}

//exported functions
function setUseBetaServer(useBeta) {
	/*if (useBeta == 0) {
		console.log("ED Materializer: Using the Live Server");
	} else {
		console.log("ED Materializer: Using the Beta Server");
	}*/

	useBetaServer = useBeta;
}

function getStars(system, callback) {
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

function getWorlds(system, callback) {
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

function showStarInfo(starId, callback) {
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

function showSurveyInfo(surveyId, callback) {
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

function showWorldInfo(worldId, callback) {
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

//exports
exports.setUseBetaServer = setUseBetaServer;
exports.getStars = getStars;
exports.getWorlds = getWorlds;
exports.showStarInfo = showStarInfo;
exports.showSurveyInfo = showSurveyInfo;
exports.showWorldInfo = showWorldInfo;
