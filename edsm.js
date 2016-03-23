var Client = require('node-rest-client').Client;
 
var client = new Client();
 
var getPosition = function(commander, bot, message) {
	client.get("http://www.edsm.net/api-logs-v1/get-position?commanderName=" + commander, function (data, response) {
		try {
			//var parsed = JSON.parse(data);
			var output = "Some error occurred";
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
			bot.sendMessage(message.channel, output);
		} catch(e) {
			bot.sendMessage(message.channel, "Something went wrong on the request");
			console.log('JSON parse exception', e);
		}
	}).on('error', function (err) {
		bot.sendMessage(message.channel, "Something went wrong on the request");
		console.log('Something went wrong on the request', err.request.options);
	});
}

exports.getPosition = getPosition;