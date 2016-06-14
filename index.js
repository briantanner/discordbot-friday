"use strict";

const discordbot = require("discordbot-core");
const mongoose = require('mongoose');
const path = require('path');
const getenv = require('getenv');
const logger = discordbot.logger;

mongoose.connect('mongodb://localhost/friday');
this.db = mongoose.connection;

this.db.on('error', logger.error);
this.db.once('open', () => logger.info("Connected to mongo."));

discordbot.start({
  ytApiKey: getenv('YT_APIKEY', ''),
  musicPath: path.join(__dirname, 'music'),
  collections: ['playlists', 'songs']
});