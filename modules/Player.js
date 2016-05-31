"use strict";

const discordbot = require('discordbot-core');
const logger = discordbot.logger;
const utils = discordbot.utils;
const ytdl = require('ytdl-core');

class Player {
  constructor(config) {
    this.config = config;
  }
  
  static get name() {
    return 'Player';
  }

  start(client) {
    this.client = client;
    this.connections = {};
    this.queue = {};
  }

  createConnection(channel) {
    if (this.connections[channel.id]) return Promise.resolve(this.connections[channel.id]);

    return new Promise((resolve, reject) => {
      this.client.joinVoiceChannel(channel).then(connection => {
        this.connections[channel.id] = connection;
        return resolve(connection);
      }).catch(err => {
        logger.error(err);
        return reject(err);
      });
    });
  }

  destroyConnection(channel) {
    return new Promise((resolve, reject) => {
      this.stop(channel);
      this.client.leaveVoiceChannel(channel).then(() => {
        delete this.connections[channel.id];
        return resolve();
      }).catch(err => {
        logger.error(err);
        return reject(err);
      });
    });
  }

  getConnection(channel) {
    return this.connections[channel.id];
  }

  add(msg, songObj) {
    let server = msg.channel.server.id;
    this.queue[server] = this.queue[server] || [];
    this.queue[server].push(songObj);
  }

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

  list(msg) {
    let server = msg.channel.server.id;
    if (!this.queue[server]) return;
    return this.queue[server];
  }

  skip(msg) {
    let server = msg.channel.server.id;
    if (!this.queue[server]) return;
    this.stop(msg.author.voiceChannel);
  }

  play(channel, options) {
    let server = channel.server.id;
    if (!this.queue[server]) return Promise.reject('No songs in queue.');
    if (this.connections[channel.id]) {
      this.connections[channel.id].stopPlaying();
    }

    return new Promise((resolve, reject) => {
      this.createConnection(channel).then(connection => {

        let songObj = this.queue[server][0],
            url = `https://www.youtube.com/watch?v=${songObj.id.videoId}`,
            stream = ytdl(url, { audioonly: true, stereo: true });

        stream.on('error', err => {
          logger.error('Stream Error: ' + err);
        });

        connection.playRawStream(stream)
        .then(intent => {
          intent.on('error', err => {
            logger.error(err);
          });

          intent.on('end', () => {
            // this.queue[server].push(songObj);
            this.queue[server].push( this.queue[server].shift() );
            this.play.call(this, channel, options);
          });
        })
        .catch(err => {
          logger.error('Playback Error: ' + err);
        });
        
        return resolve;
      }).catch(reject);
    });
  }

  playFile(channel, file, options) {
    return new Promise((resolve, reject) => {
      this.createConnection(channel).then(connection => {
        connection.playFile(file, options).then(resolve).catch(reject);
      }).catch(reject);
    });
  }

  stop(channel) {
    return this.connections[channel.id].stopPlaying();
  }

  volume(channel, volume) {
    let connection = this.connections[channel.id];
    if (volume) return connection.setVolume(volume);
    return connection.getVolume();
  }
}

module.exports = Player;