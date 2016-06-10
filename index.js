"use strict";

const discordbot = require("discordbot-core");
const path = require('path');
const getenv = require('getenv');

discordbot.start({
  ytApiKey: getenv('YT_APIKEY', ''),
  musicPath: path.join(__dirname, 'music'),
  collections: ['playlists', 'songs']
});