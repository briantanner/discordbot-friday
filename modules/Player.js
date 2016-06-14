"use strict";

const discordbot = require('discordbot-core');
const logger = discordbot.logger;
const ytdl = require('ytdl-core');

class Player {
  
  /**
   * Module name
   * @return {String} Name of the module
   */
  static get name() {
    return 'Player';
  }

  /**
   * Start the player module
   * @param  {Object} client Reference to discord client
   */
  start(client) {
    this.client = client;
    this.connections = {};
    this.queue = {};
  }

  /**
   * Get or create the voice connection
   * @param  {Object} channel discord.js channel resolvable
   * @return {Promise}        Resolves a connection object
   */
  getConnection(channel) {
    if (this.connections[channel.id] && this.connections[channel.id].conn)
      return Promise.resolve(this.connections[channel.id].conn);

    return new Promise((resolve, reject) => {
      this.client.joinVoiceChannel(channel).then(connection => {
        this.connections[channel.id] = {
          stopping: false,
          conn: connection
        };
        return resolve(connection);
      }).catch(err => reject(err));
    });
  }

  /**
   * Destroy the voice connection
   * @param  {Object} channel discord.js channel resolvable
   * @return {Promise}        Resolves when done.
   */
  destroyConnection(channel) {
    return new Promise((resolve, reject) => {
      this.stop(channel);
      this.client.leaveVoiceChannel(channel).then(() => {
        delete this.connections[channel.id];
        return resolve();
      }).catch(err => reject(err));
    });
  }

  /**
   * Start playing the queue
   * @param  {Object} channel discord.js channel resolvable
   * @param  {Object} options Options to pass to playRawStream
   * @return {Promise}        
   */
  play(channel, options) {
    return new Promise((resolve, reject) => {
      let server = channel.server.id;
      
      if (!this.queue[server]) return Promise.reject('No songs in queue.');
      
      if (this.connections[channel.id] && this.connections[channel.id].conn) {
        this.connections[channel.id].conn.stopPlaying();
      }

      this.getConnection(channel).then(connection => {

        let songObj = this.queue[server][0],
            url = `https://www.youtube.com/watch?v=${songObj.id}`,
            stream = ytdl(url, { audioonly: true });

        stream.on('error', logger.error);

        connection.playRawStream(stream)
        .then(intent => {
          intent.on('error', logger.error);

          intent.on('end', () => {
            let connection = this.connections[channel.id];
            if (connection.stopping === true) {
              return connection.stopping = false;
            }

            this.queue[server].push( this.queue[server].shift() );
            this.play.call(this, channel, options);
          });
        })
        .catch(logger.error);
        
        return resolve();
      }).catch(reject);
    });
  }

  /**
   * Play a file from disk
   * @param  {Object} channel discord.js channel resolvable
   * @param  {String} file    File path to play
   * @param  {Object} options Options to pass to playFile
   * @return {Promise}        
   */
  playFile(channel, file, options) {
    return new Promise((resolve, reject) => {
      this.getConnection(channel).then(connection => {
        connection.playFile(file, options).then(resolve).catch(reject);
      }).catch(reject);
    });
  }

  /**
   * Stop playing
   * @param  {Object} channel discord.js channel resolvable
   */
  stop(channel) {
    this.connections[channel.id].stopping = true;
    this.connections[channel.id].conn.stopPlaying();
  }

  /**
   * Skip song
   * @param  {Object} msg discord.js message resolvable
   */
  skip(msg) {
    let server = msg.channel.server.id;
    if (!this.queue[server]) return;
    this.stop(msg.author.voiceChannel);
    this.queue[server].push( this.queue[server].shift() );
    this.play.call(this, msg.author.voiceChannel);
  }

  /**
   * Add song to queue
   * @param {Object} msg     discord.js message resolvable
   * @param {Object} songObj Youtube song object
   */
  add(msg, songObj) {
    let server = msg.channel.server.id;
    this.queue[server] = this.queue[server] || [];
    this.queue[server].push(songObj);
  }

  /**
   * Remove song from queue
   * @param  {Object} msg   discord.js message resolvable
   * @param  {Number} index Index of song to remove
   */
  remove(msg, index) {
    let server = msg.channel.server.id;
    if (!this.queue[server]) return;
    
    if (!index) {
      return this.queue[server].shift();
    }

    index = index - 1;
    this.queue[server].splice(index, 1);
    this.play(msg.author.voiceChannel);
  }

  /**
   * List songs in queue
   * @param  {Object} msg discord.js message resolvable
   * @return {Array}      List of songs in queue
   */
  list(msg) {
    let server = msg.channel.server.id;
    if (!this.queue[server]) return;
    return this.queue[server];
  }

  /**
   * Set volume to play in discord
   * @param  {Object} channel discord.js channel resolvable
   * @param  {Float} volume   Volume level (0-1.5)
   */
  volume(channel, volume) {
    let connection = this.connections[channel.id];
    if (volume) return connection.setVolume(volume);
    return connection.getVolume();
  }
}

module.exports = Player;
