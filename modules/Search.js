"use strict";

const logger = require('discordbot-core').logger;
const YouTube = require('youtube-node');
const Cache = require('../models/Cache');
const yt = new YouTube();

class Search {

  /**
   * Search constructor
   * @param  {String} options.ytApiKey Youtube API key
   */
  constructor({ytApiKey}) {
    if (!ytApiKey) throw new Error('Youtube API Key Required. Set `ytApiKey` in config');

    yt.setKey(ytApiKey);
  }

  /**
   * Module name
   * @return {String} Name of the module
   */
  static get name() {
    return 'Search';
  }

  /**
   * Start the search module
   * @param  {Object} client Reference to discord client
   */
  start(client) {
    this.client = client;
    this.searches = {};
    this.queries = {};
    this.playlists = {};
  }

  /**
   * Cache an item
   * @param  {String} key  Key to cache
   * @param  {Mixed} data  Data to cache
   */
  cacheItem(key, data) {
    const item = new Cache({ key, data });
    item.save(err => {
      if (err) logger.error(err);
    });
  }

  /**
   * Get data from cache
   * @param  {String} key Cached key
   * @return {Promise}    Resolves cached data
   */
  getCached(key) {
    return new Promise((resolve, reject) => {
      Cache.findOne({ key: key }, (err, item) => {
        if (err) return reject(err);
        if (!item) return resolve();
        return resolve(item);
      });
    });
  }

  /**
   * Cache search results
   * @param  {String} key    Key to cache by
   * @param  {String} query  The search query
   * @param  {Object} result Youtube API response object
   */
  cacheSearch(key, query, result) {
    // cache the query results
    this.getCached(query).then(data => {
      if (!data) this.cacheItem(query, result);
    }).catch(err => logger.error(err));

    const search = {
      cursor: 0,
      query: query,
      items: this.parseItems(result)
    };

    // cache the search results
    this.searches[key] = search;
    
    this.getCached(key).then(result => {
      if (result) {
        result.accessedAt = new Date();
        return result.save();
      }

      this.cacheItem(key, search);
    }).catch(err => logger.error(err));
  }

  /**
   * Parse items from youtube response
   * @param  {Object} result Youtube API response Object
   * @return {Array}         Collection of search items
   */
  parseItems(result) {
    return result.items.map(item => {
      // normalize item type
      let type = item.id ? item.id.kind || item.kind : item.kind,
        id = item.id ? item.id.videoId || item.id.playlistId : item.contentDetails ? item.contentDetails.videoId : null;

      type = type.replace('youtube#', '');

      // return mapped object
      return {
        id: id,
        type: type,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnails: item.snippet.thumbnails,
        channel: item.snippet.channelTitle
      };
    });
  }

  /**
   * Search the youtube api, returned cached results for repeated searches
   * @param  {Object} msg   discord.js message resolvable
   * @param  {String} [type='type,playlist']  Youtube search api type
   * @param  {String} query String to search the youtube api
   * @return {Promise}      Resolves the first result from the search
   */
  search(msg, type='video,playlist', query) {
    if (arguments.length < 3) return Promise.reject('Not enough arguments given.');

    // key searches by channel and author.
    const id = `${msg.channel.id}${msg.author.id}`;
    // normalize search queries
    query = query.replace(/[^\w\s]/gi, '').toLowerCase();

    return new Promise((resolve, reject) => {

      // check if search is cached.
      this.getCached(query).then(result => {
        if (result) {
          logger.debug(`Youtube search '${query}' returned from cache`);
          this.cacheSearch(id, query, result.data);
          return resolve(this.get(msg));
        }

        // add type param
        yt.addParam('type', type);

        // query the youtube api
        yt.search(query, 10, (err, result) => {
          if (err) return reject(err);
          if (!result || !result.items) return resolve();

          logger.debug(`Youtube search '${query}' returned from api`);
          this.cacheSearch(id, query, result);
          return resolve(this.get(msg));
        });

      }).catch(err => logger.error(err));
    });
  }

  /**
   * Get items from a youtube playlist by id
   * @param  {Object} msg discord.js message resolvable
   * @param  {String} id  Youtube playlist id
   * @return {Promise}    Resolves the list of items in a playlist
   */
  playlist(msg, id) {
    if (arguments.length < 2) return Promise.reject('Not enough arguments given.');
    
    return new Promise((resolve, reject) => {
      yt.getPlayListsItemsById(id, (err, result) => {
        if (err) return reject(err);
        return resolve(this.parseItems(result));
      });
    });
  }

  /**
   * Get a search result
   * @param  {Object} msg         discord.js message resolvable
   * @param  {String} [prevNext]  prev or next
   * @return {Object}             Returns an item from search results
   */
  get(msg, prevNext) {
    const id = `${msg.channel.id}${msg.author.id}`;
    const search = this.searches[id];

    if (!search) return;

    if (prevNext === 'next') {
      if (!search.items[search.cursor + 1]) return;
      search.cursor++;
    }

    if (prevNext === 'prev') {
      if (!search.items[search.cursor - 1]) return;
      search.cursor--;
    }

    return search.items[search.cursor];
  }

  /**
   * Get next search result
   * @param  {Object}   msg discord.js message resolvable
   * @return {Object}       Returns an item from search results
   */
  next(msg) {
    return this.get(msg, 'next');
  }

  /**
   * Get previous search result
   * @param  {Object} msg discord.js message resolvable
   * @return {Object}     Returns an item from search results
   */
  prev(msg) {
    return this.get(msg, 'prev');
  }
}

module.exports = Search;
