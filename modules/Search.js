"use strict";

const discordbot = require('discordbot-core');
const logger = discordbot.logger;
const utils = discordbot.utils;
const YouTube = require('youtube-node');
const yt = new YouTube();

class Search {
  constructor(config) {
    this.config = config;
    yt.setKey(config.ytApiKey);
  }

  static get name() {
    return 'Search';
  }

  start(client) {
    this.client = client;
    this.searches = {};
  }

  find(msg, query) {
    return new Promise((resolve, reject) => {
      yt.search(query, 8, (err, result) => {
        if (err) return reject(err);
        if (!result || !result.items) return resolve();

        let id = `${msg.channel.id}${msg.author.id}`;
        this.searches[id] = result.items;
        return resolve(this.searches[id][0]);
      });
    });
  }

  next(msg) {
    let id = `${msg.channel.id}${msg.author.id}`;
    if (!this.searches[id]) return;

    this.searches[id].shift();
    return this.searches[id][0];
  }

  get(msg) {
    let id = `${msg.channel.id}${msg.author.id}`;
    if (!this.searches[id]) return;

    return this.searches[id][0];
  }
}

module.exports = Search;
