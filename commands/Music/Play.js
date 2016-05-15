"use strict";

const path = require('path');
const Command = require('discordbot-core').Command;

class Play extends Command {

  constructor(config) {
    super(config);

    this.aliases = ["play"];
    this.group = "Music";
    this.description = "Play a song in your voice channel.";
    this.usage = "play <file|url>";
  }

  execute(msg, args) {
    super.execute.apply(this, arguments);
    if (!this.validate(args, 1)) return;

    const player = msg.client.getModule('Player');

    // msg.client.joinVoiceChannel(msg.author.voiceChannel).then(connection => {
    //   connection.playFile(args[0]).then(intent => {
    //     intent.on('end', () => {
    //       connection.destroy();
    //     });
    //     intent.on('err', err => {
    //       console.log(err);
    //     });
    //   })
    // }).catch(err => {
    //   console.log(err);
    // });

    switch(args[0]) {
      case 'stop':
        return player.stop(msg.author.voiceChannel);
        break;
      case 'destroy':
        return player.destroyConnection(msg.author.voiceChannel);
        break;
    }

    console.log(path.resolve(args[0]));

    // player.play(msg.author.voiceChannel, args[0]);
    player.play(msg.author.voiceChannel, path.resolve(args[0]));
  }
}

module.exports = Play;