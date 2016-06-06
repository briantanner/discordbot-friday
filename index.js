"use strict";

const discordbot = require("discordbot-core");
const path = require('path');
const getenv = require('getenv');
const cluster = require('cluster');
const sleep = require('sleep').sleep;
const os = require('os');

if (cluster.isMaster) {
  console.log("MASTER");
  for (let i = 0; i < os.cpus().length; i++) {
    cluster.fork({ shardId: i, shardCount: os.cpus().length });
    sleep(5);
  }
} else {
  console.log("WORKER", process.env.shardId, process.env.shardCount);
  discordbot.start({
    ytApiKey: getenv('YT_APIKEY', ''),
    musicPath: path.join(__dirname, 'music'),
    collections: ['playlists', 'songs'],
    shardId: parseInt(process.env.shardId,10),
    shardCount: parseInt(process.env.shardCount,10)
  });
}