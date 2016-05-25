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
        // this.connections[channel.id].destroy();
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
    index = index - 1;
    if (!this.queue[server]) return;
    this.queue[server].splice(index, 1);
  }

  list(msg) {
    let server = msg.channel.server.id;
    if (!this.queue[server]) return;
    return this.queue[server];
  }

  skip(msg) {
    let server = msg.channel.server.id;
    if (!this.queue[server]) return;
    this.queue[server].push(this.queue[server].shift());
    this.stop(msg.author.voiceChannel);
    return this.play(msg.author.voiceChannel);
  }

  play(channel, options) {
    let server = channel.server.id;
    if (!this.queue[server]) return Promise.reject('No songs in queue.');

    return new Promise((resolve, reject) => {
      this.createConnection(channel).then(connection => {
        let songObj = this.queue[server][0],
            url = `https://www.youtube.com/watch?v=${songObj.id.videoId}`,
            stream = ytdl(url);

        stream.on('error', err => {
          logger.error('Stream Error: ' + err);
        });

        connection.playRawStream(stream, { stereo: true })
        .then(intent => {
          intent.on('error', err => {
            logger.error('Intent Error: ' + err);
          });

          intent.on('end', () => {
            // this.queue[server].push(songObj);
            this.play.bind(this, channel, options);
          }.bind(this));
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