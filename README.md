# FGEBot

A chat bot for discord app based off <a href="https://github.com/hydrabolt/discord.js/">discord.js</a>

This bot is used by the First Great Expedition, an exploration fleet in Elite Dangerous.

# Features:
- !help to get a full list of available commands

# Installation

This bot is written to run on top of node.js. Please see https://nodejs.org/en/download/

Once you have node installed running `npm install` from the bot directory should install all the needed packages. If this command prints errors the bot won't work!

# Running
Before first run you will need to create a `config.js` file. The email and password for a discord account are required. The other credentials are not required for the bot to run, but highly recommended as commands that depend on them will malfunction. See `sample_config.js`.

To start the bot just run
`node server.js`.

# Updates
If you update the bot, please run `npm update` before starting it again. If you have
issues with this, you can try deleting your node_modules folder and then running
`npm install` again. Please see [Installation](#Installation).
