const LOGIN = "LOGIN_HERE";
const PASSWORD = "PASSWORD_HERE";
const RESPOND_TO_MENTIONS = 1;
const RESPOND_TO_COMMANDS = 0;
const COMMAND_PREFIX = "!";

const USE_TRELLO = false;
const TRELLO_KEY = 'TRELLO_KEY';
const TRELLO_TOKEN = 'TRELLO_TOKEN';
const TRELLO_BOARDS = [
	{
		id:'BOARD_ID',
		channel:'#operations'
	},
	{
		id:'BOARD_ID',
		channel:'#operations'
	}
];

module.exports.LOGIN = LOGIN;
module.exports.PASSWORD = PASSWORD;
module.exports.RESPOND_TO_MENTIONS = RESPOND_TO_MENTIONS;
module.exports.RESPOND_TO_COMMANDS = RESPOND_TO_COMMANDS;
module.exports.COMMAND_PREFIX = COMMAND_PREFIX;

module.exports.USE_TRELLO = USE_TRELLO;
module.exports.TRELLO_KEY = TRELLO_KEY;
module.exports.TRELLO_TOKEN = TRELLO_TOKEN;
module.exports.TRELLO_BOARDS = TRELLO_BOARDS;
