"use strict";

const Command = require('discordbot-core').Command;

class Search extends Command {

  constructor(config) {
    super(config);

    this.aliases = ['search'];
    this.description = "Searches YouTube";
    this.usage = "search <title>";
  }

  execute(msg, args) {
    super.execute.apply(this, arguments);
    if (!this.validate(args, 1)) return;
  }
}