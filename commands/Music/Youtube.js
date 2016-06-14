"use strict";

const discordbot = require('discordbot-core');
const Command = discordbot.Command;
const logger = discordbot.logger;

class Youtube extends Command {

  constructor(config) {
    super(config);

    this.aliases = ['yt', 'youtube'];
    this.group = 'Music';
    this.defaultCommand = 'search';
    this.commands = ['search', 'next', 'prev', 'add', 'remove', 'playlist', 'list', 'start', 'stop', 'skip', 'remove'];
    this.description = 'Youtube commands';
    this.usage = `yt <title>\n       yt [${this.commands.join('|')}]`;
    this.expectedArgs = 1;
    this.disableDM = true;
  }

  /**
   * Format search result
   * @param  {Object} result Search item object
   * @return {Array}         Message array
   */
  formatMessage(result) {
    let msgArray = [];

    msgArray.push(`Title: ${result.title}`);
    msgArray.push(`Channel: ${result.channel}`);

    if (result.thumbnails && result.thumbnails.default) {
      msgArray.push(`${result.thumbnails.default.url}`);
    }

    return msgArray;
  }

  /**
   * Format queue list
   * @param  {Object} results Queue list
   * @return {Array}          Message array
   */
  formatList(results) {
    let msgArray = [],
        result;

    msgArray.push("```");
    for (let i in results) {
      result = results[i];
      msgArray.push(`${++i}: ${result.title}`);
    }
    msgArray.push("```");

    return msgArray;
  }

  /**
   * Execute Command
   * @param  {Object} msg  discord.js message resolvable
   */
  execute(msg) {
    this.searcher = msg.client.getModule('Search');
    this.player = msg.client.getModule('Player');
    this.type = null;
  }

  /**
   * Search youtube
   * @param  {Object} msg  discord.js message resolvable
   * @param  {Array} args  Command arguments
   */
  search(msg, args) {
    this.searcher.search(msg, this.type, args.join(' ')).then(result => {
      if (!result) return this.sendMessage("1 Failed to get search results.");
      this.sendMessage(this.formatMessage(result));
    }).catch((err) => {
      if (err) logger.error(err);
      this.sendMessage("Failed to get search results.");
    });
  }

  /**
   * Search for playlists
   * @param  {Object} msg  discord.js message resolvable
   * @param  {Array} args  Command arguments
   */
  playlist(msg, args) {
    this.type = 'playlist';
    this.search(msg, args);
  }

  /**
   * Get the next search result
   * @param  {Object}   msg discord.js message resolvable
   */
  next(msg) {
    const result = this.searcher.next(msg);
    if (!result) return this.sendMessage("No more results.");
    this.sendMessage(this.formatMessage(result));
  }

  /**
   * Get the previous search result
   * @param  {Object}   msg discord.js message resolvable
   */
  prev(msg) {
    const result = this.searcher.prev(msg);
    if (!result) return this.sendMessage("No previous results.");
    this.sendMessage(this.formatMessage(result));
  }

  /**
   * Add the last result to the queue/playlist
   * @param {Object} msg discord.js message resolvable
   */
  add(msg) {
    const result = this.searcher.get(msg);
    if (!result) return this.sendMessage("Failed to get last search.");

    if (result.type === 'video') {
      this.player.add(msg, result);
      this.sendMessage(`Added ${result.title} to the queue.`);
      return;
    }
    
    this.searcher.playlist(msg, result.id).then(items => {
      for (let item of items) {
        this.player.add(msg, item);
      }
      this.sendMessage(`Added ${items.length} items to the queue.`);
    }).catch(err => {
      logger.error(err);
      this.sendMessage('An error occurred');
    });
  }

  /**
   * List queue
   * @param  {Object} msg discord.js message resolvable
   */
  list(msg) {
    const list = this.player.list(msg);
    if (!list) return this.sendMessage("The queue is empty.");
    this.sendMessage(this.formatList(list));
  }

  /**
   * Start queue
   * @param  {Object} msg discord.js message resolvable
   */
  start(msg) {
    if (msg.channel.isPrivate) return this.sendMessage("You must join a voice channel first.");
    this.player.play(msg.author.voiceChannel);
  }

  /**
   * Stop queue
   * @param  {Object} msg discord.js message resolvable
   */
  stop(msg) {
    if (msg.channel.isPrivate) return this.sendMessage("You must be in the channel to use this.");
    this.player.stop(msg.author.voiceChannel);
  }

  /**
   * Skip
   * @param  {Object} msg discord.js message resolvable
   */
  skip(msg) {
    if (msg.channel.isPrivate) return this.sendMessage("You must be in the channel to use this.");
    this.player.skip(msg);
  }

  /**
   * Remove item from queue
   * @param  {Object} msg discord.js message resolvable
   * @param  {Array} args Command arguments
   */
  remove(msg, args) {
    if (args[0] && !isNaN(parseInt(args[0], 10))) {
      return this.player.remove(msg, args[0]);
    }

    if (msg.channel.isPrivate) return this.sendMessage("You must be in the channel to use this.");

    const result = this.player.remove(msg);
    this.sendMessage(`Removed ${result.title}`);
  }

}

module.exports = Youtube;
