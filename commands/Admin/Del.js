"use strict";

const Command = require('discordbot-core').Command;

class Del extends Command {
  
  constructor(config) {
    super(config);
    
    this.aliases = ["del", "delete"];
    this.group = "Admin";
    this.description = "Delete own messages";
    this.usage = "del";
    this.hideFromHelp = true;
    this.permissions = "admin";
    this.expectedArgs = 1;
  }
  
  execute(msg, args) {
    let deleted = 0;
    
    msg.client.getChannelLogs(msg.channel, (err, messages) => {
      if (err) {
        return msg.client.sendMessage(msg.channel, "```" + err + "```");
      }

      let msgs = [];
      
      for (let m of messages) {
        if (deleted >= args[0]) continue;
        if (m.author === m.client.user) {
          msgs.push(m);
          deleted++;
        }
      }

      msg.client.deleteMessages(msgs).then(() => {
        console.log('Done');
      }).catch(err => {
        console.log(err);
      });
    });
  }
}

module.exports = Del;