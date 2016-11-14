var Client = require('node-rest-client').Client;
 
var client = new Client();

var useBetaServer = 1;

//internal helper functions
function _getServerString() {
	var serverString = "";

	if (useBetaServer == 0) {
		serverString = "https://www.edsm.net";
	} else {
		serverString = "http://beta.edsm.net:8080";
	}

	return serverString;
}

//exported functions
function setUseBetaServer(useBeta) {
	useBetaServer = useBeta;
}

function getColoniaCommanders(userId, apiKey, radius, callback) {
	function responseHandler(data, response) {
		if (data) {
			callback(data);
		} else {
			callback(null);
		}
	}

	function errorHandler(err) {
		console.log("Something went wrong on the request", err.request.options);
		callback(null);
	}

	var serverString = _getServerString();
	client.get(serverString + "/tools/ccn/colonist?id=" + userId + "&apiKey=" + apiKey + "&radius=" + radius, responseHandler).on("error", errorHandler);
}

//exports
exports.setUseBetaServer = setUseBetaServer;
exports.getColoniaCommanders = getColoniaCommanders;
