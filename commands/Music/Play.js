"use strict";

const path = require('path');
const Command = require('discordbot-core').Command;

class Play extends Command {

  constructor(config) {
    super(config);

    this.aliases = ['play', 'p'];
    this.group = 'Music';
    this.description = 'Play a song in your voice channel.';
    this.usage = 'play <file|url>';
  }

  formatList(results) {
    let msgArray = [],
        result;

    msgArray.push("```");
    for (let i in results) {
      result = results[i];
      msgArray.push(`${++i}: ${result.snippet.title}`);
    }
    msgArray.push("```");

    return msgArray;
  }

  execute(msg, args) {
    super.execute.apply(this, arguments);
    if (!this.validate(args, 1)) return;

    const player = msg.client.getModule('Player');

    switch(args[0]) {
      case 'list':
        let list = player.list(msg);
        if (!list) return this.sendMessage("The queue is empty.");
        return this.sendMessage(this.formatList(list));
        break;
      case 'start':
        return player.play(msg.author.voiceChannel);
        break;
      case 'stop':
        return player.stop(msg.author.voiceChannel);
        break;
      case 'skip':
        return player.skip(msg);
      case 'destroy':
        return player.destroyConnection(msg.author.voiceChannel);
        break;
    }

    // player.play(msg.author.voiceChannel, args[0]);
    // player.play(msg.author.voiceChannel, path.resolve(args[0]));
  }
}

module.exports = Play;