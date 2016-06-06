"use strict";

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

    let player = msg.client.getModule('Player'),
        list, result;

    switch(args[0]) {
      case 'list':
        list = player.list(msg);
        if (!list) return this.sendMessage("The queue is empty.");
        return this.sendMessage(this.formatList(list));
      case 'start':
        if (!msg.author.voiceChannel) {
          return this.sendMessage("You must join a voice channel first.");
        }
        return player.play(msg.author.voiceChannel);
      case 'stop':
        if (!msg.author.voiceChannel) {
          return this.sendMessage("You must be in the channel to use this.");
        }
        return player.stop(msg.author.voiceChannel);
      case 'skip':
        if (!msg.author.voiceChannel) {
          return this.sendMessage("You must be in the channel to use this.");
        }
        return player.skip(msg);
      case 'remove':
        if (args[1] && !isNaN(parseInt(args[1], 10))) {
          return player.remove(msg, args[1]);
        }

        if (!msg.author.voiceChannel) {
          return this.sendMessage("You must be in the channel to use this.");
        }

        result = player.remove(msg);
        return this.sendMessage(`Removed ${result.snippet.title}`);
      case 'destroy':
        return player.destroyConnection(msg.author.voiceChannel);
    }

    // player.play(msg.author.voiceChannel, args[0]);
    // player.play(msg.author.voiceChannel, path.resolve(args[0]));
  }
}

module.exports = Play;