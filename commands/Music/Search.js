"use strict";

const Command = require('discordbot-core').Command;

class Search extends Command {

  constructor(config) {
    super(config);

    this.aliases = ['search', 's'];
    this.description = 'Searches YouTube';
    this.usage = 'search <title>\n       search [next|add]';
  }

  formatMessage(result) {
    let msgArray = [];
    msgArray.push(`Title: ${result.snippet.title}`);
    msgArray.push(`Channel: ${result.snippet.channelTitle}`);
    if (result.snippet.thumbnails && result.snippet.thumbnails.default) {
      msgArray.push(`${result.snippet.thumbnails.default.url}`);
    }

    return msgArray;
  }

  execute(msg, args) {
    super.execute.apply(this, arguments);
    if (!this.validate(args, 1)) return;

    let search = msg.client.getModule('Search'),
        player = msg.client.getModule('Player'),
        result;

    switch (args[0]) {
      case 'next':
        result = search.next(msg);
        if (!result) return this.sendMessage("No more results.");
        return this.sendMessage(this.formatMessage(result));
        break;
      case 'add':
        result = search.get(msg);
        if (!result) return this.sendMessage("Failed to get last search.");
        player.add(msg, result);
        return this.sendMessage(`Added ${result.snippet.title} to the queue.`);
        break;
    }

    if (args[0] === 'next') {
      let result = search.next(msg);
      if (!result) return this.sendMessage("No more results.");
      return this.sendMessage(this.formatMessage(result));
    }

    search.find(msg, args.join(' ')).then(result => {
      if (!result) return this.sendMessage("Failed to get search results.");
      this.sendMessage(this.formatMessage(result));
    }).catch(err => {
      this.sendMessage("Failed to get search results.");
    });
  }
}

module.exports = Search;
