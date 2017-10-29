// Load up the discord.js library
const Discord = require("discord.js");

// This is your client. Some people call it `bot`, some people call it `self`, 
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Discord.Client();

// Here we load the config.json file that contains our token and our prefix values. 
const config = require("./config.json");
const package = require("./package.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Xero Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`); 
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  client.user.setGame(`with Fanta`);
});

client.on("guildCreate", guild => {
  // This event triggers when the bot joins a guild.
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setGame(`with Fanta`);
});

client.on("guildDelete", guild => {
  // this event triggers when the bot is removed from a guild.
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setGame(`with Fanta`);
});


client.on("message", async message => {
  // This event will run on every single message received, from any channel or DM.
  
  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if(message.author.bot) return;
  
  // Also good practice to ignore any message that does not start with our prefix, 
  // which is set in the configuration file.
  if(message.content.indexOf(config.prefix) !== 0) return;
  
  // Here we separate our "command" name, and our "arguments" for the command. 
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // command = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  
  // Let's go with a few common example commands! Feel free to delete or change those.
  
  if(command === "ping") {
    // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
    // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
    const m = await message.channel.send("Pinging...");
    m.edit(`Pong!, Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
  }
  
  if(command === "say") {
    // makes the bot say something and delete the message. As an example, it's open to anyone to use. 
    // To get the "message" itself we join the `args` back into a string with spaces:
    if(!message.member.roles.some(r=>["Owner", "Developer"].includes(r.name)) )
    return message.reply("Sorry, you don't have permissions to use this!");
    const sayMessage = args.join(" ");
    // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
    message.delete().catch(O_o=>{}); 
    // And we get the bot to say the thing: 
    message.channel.send(sayMessage);
  }
  
  if(command === "kick") {
    // This command must be limited to mods and admins. In this example we just hardcode the role names.
    // Please read on Array.some() to understand this bit: 
    // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/some?
    if(!message.member.roles.some(r=>["Owner"].includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");
    
    // Let's first check if we have a member and if we can kick them!
    // message.mentions.members is a collection of people that have been mentioned, as GuildMembers.
    let member = message.mentions.members.first();
    if(!member)
      return message.reply("Please mention a valid member of this server");
    if(!member.kickable) 
      return message.reply("I cannot kick this user! Do they have a higher role? Do I have kick permissions?");
    
    // slice(1) removes the first part, which here should be the user mention!
    let reason = args.slice(1).join(' ');
    if(!reason)
      return message.reply("Please indicate a reason for the kick!");
    
    // Now, time for a swift kick in the nuts!
    await member.kick(reason)
      .catch(error => message.reply(`Sorry ${message.author} I couldn't kick because of : ${error}`));
    message.reply(`${member.user.tag} has been kicked by ${message.author.tag} because: ${reason}`);

  }
  
  if(command === "ban") {
    // Most of this command is identical to kick, except that here we'll only let admins do it.
    // In the real world mods could ban too, but this is just an example, right? ;)
    if(!message.member.roles.some(r=>["Owner"].includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");
    
    let member = message.mentions.members.first();
    if(!member)
      return message.reply("Please mention a valid member of this server");
    if(!member.bannable) 
      return message.reply("I cannot ban this user! Do they have a higher role? Do I have ban permissions?");

    let reason = args.slice(1).join(' ');
    if(!reason)
      return message.reply("Please indicate a reason for the ban!");
    
    await member.ban(reason)
      .catch(error => message.reply(`Sorry ${message.author} I couldn't ban because of : ${error}`));
    message.reply(`${member.user.tag} has been banned by ${message.author.tag} because: ${reason}`);
  }
  
  if(command === "purge") {
    // This command removes all messages from all users in the channel, up to 100.
    if(!message.member.roles.some(r=>["Owner, Developer"].includes(r.name)) )
    return message.reply("Sorry, you don't have permissions to use this!");
    // get the delete count, as an actual number.
    const deleteCount = parseInt(args[0], 10);
    
    // Ooooh nice, combined conditions. <3
    if(!deleteCount || deleteCount < 2 || deleteCount > 100)
      return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");
    
    // So we get our messages, and delete them. Simple enough, right?
    const fetched = await message.channel.fetchMessages({count: deleteCount});
    message.channel.bulkDelete(fetched)
      .catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
  }

  if(command === "announce") {
    if(!message.member.roles.some(r=>["Owner", "Developer"].includes(r.name)) )
    return message.reply("Sorry, you don't have permissions to use this!");
    const sayAnnounce = args.join(" ");
    var embed = new Discord.RichEmbed()
    .setTitle(`${message.author.username} has made an Announcement!`)
    .setDescription(`${sayAnnounce}`)
    .setColor(0x008000)
    .setFooter("Xero Bot Rewrite") 
    // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
    message.delete().catch(O_o=>{}); 
    // And we get the bot to say the thing: 
    message.guild.channels.find("name", "announcements").send(embed);
  }

  if(command === "pingannounce") {
    if(!message.member.roles.some(r=>["Owner", "Developer"].includes(r.name)) )
    return message.reply("Sorry, you don't have permissions to use this!");
    message.guild.channels.find("name", "announcements").send("@here");
    const pingAnnounce = args.join(" ");
    var embed = new Discord.RichEmbed()
    .setTitle(`${message.author.username} has made an Announcement!`)
    .setDescription(`${pingAnnounce}`)
    .setColor(0x008000)
    .setFooter("Xero Bot Rewrite") 
    // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
    message.delete().catch(O_o=>{}); 
    // And we get the bot to say the thing: 
    message.guild.channels.find("name", "announcements").send(embed);
  }

  if(command === "ticket") {
    const ticketReason = args.join(" ");
    var embed = new Discord.RichEmbed()
    .setTitle(`${message.author.username} has reported a support ticket!`)
    .setDescription(`${ticketReason}`)
    .setColor(0x0000FF)
    .setFooter("Xero Bot Rewrite") 
    message.guild.channels.find("name", "support-tickets").send(embed);
  }

  if(command === "help") {
    message.reply("I have DM'ed you a list of available commands")
    var embed = new Discord.RichEmbed()
    .setTitle("Help Command")
    .setDescription("A list of Available Commands: \n`ban [reason]`(Owner) - Bans someone in the server with a reason. \n`kick [reason]`(Owner) - Kicks someone in the server with a reason. \n`pingannounce`(Owner) - Announce command, but it pings @here. \n`announce`(Owner) - Announce command, but it doesn't ping @here. \n`ticket [reason]` - Sends a support ticket for the support team to handle. \n`purge [Amount. Max: 100]`(Owner) - Deletes messages according to the Amount specified when executing the command. \n`say`(Owner) - Makes the bot say the message you've just said. \n`ping` -  Pings the bot and returns with its API latency and Bot User latency. \n`startnumevent`(Owner) - Starts the Random Number Event. \n`random` - Generates a random 5-Digit Number. \n`virus [User]` - Sends a troll Virus to the person. \n`Kill [User]` - Kills the specified person. \n`8ball [Fortune]` - Asks 8ball. \n`changelog` - Returns with an update log.")
    .setThumbnail("http://i.pi.gy/3anQ.jpg")
    .setColor(0x008000)
    .setFooter("Xero Bot Rewrite")
    message.author.send(embed);
  }

  if(command === "startnumevent") {
    if(!message.member.roles.some(r=>["Owner", "Developer"].includes(r.name)) )
    return message.reply("Sorry, you don't have permissions to use this!");
    var embed = new Discord.RichEmbed()
    .setTitle(`${message.author.username} has Hosted an Event!`)
    .setDescription("The new Random Number Event has Started! \nWhoever gets a result of **23957** by using `;random` Wins a free copy of Xero! \nSo start getting that number before anyone else!, you may need to provide proof after winning.")
    .setColor(0x008000)
    .setFooter("Xero Bot Rewrite")
    .setThumbnail("http://i.pi.gy/j33g4.png")
    .setTimestamp()
    message.guild.channels.find("name", "announcements").send(embed);
  }

  if(command === "random") {
    var numEvent = Math.floor(Math.random() * 90000) + 10000;
    var embed = new Discord.RichEmbed()
    .setTitle("Random Number")
    .setDescription(`${message.author.username}, your Unique 5-Digit Random number is ${numEvent}`)
    .setFooter("Xero Bot Rewrite")
    .setTimestamp()
    .setColor(0x008000)
    message.channel.send(embed);
  }

  if(command === "changelog") {
    var embed = new Discord.RichEmbed()
    .setTitle(`Update log for 10/25/2017`)
    .setDescription("-Added `dmannounce` command, EXPERIMENTAL! \n-Fixed an issue where the bot would ping incorrectly using `pingannounce`. \n-Added `random` command for the Random Number Event. \n-Added `startnumevent` for the new Event. \n-Bot will be hosted on Heroku anytime soon. \n-Bot will use a different command handler anytime soon. \n\nWatch out, something big is coming soon...")
    .setFooter("Xero Bot Rewrite, Happy Halloween!")
    .setTimestamp()
    .setColor(0x008000)
    message.author.send(embed);
    var update2 = new Discord.RichEmbed()
    .setTitle(`Update log for 10/26/2017`)
    .setDescription("-Added `kill` command for comedic purposes. \n-Added `virus` command for trolling purposes. \nFixed a bug that slows down `virus`")
    .setFooter("Xero Bot Rewrite, Happy Halloween!")
    .setTimestamp()
    .setColor(0x008000)
    message.author.send(update2);
    var update3 = new Discord.RichEmbed()
    .setTitle(`Update log for 10/27/2017`)
    .setDescription("-Added `8ball` command. \n-Added Emojis to `kill`. -Added More Chances to `kill`. \n-Fixed a bug in `virus` that adds another mention after the virus has injected. \n\nWatch out, something big is coming...")
    .setColor(0x008000)
    .setFooter("Xero Bot Rewrite")
    .setTimestamp()
    message.author.send(update3);
  }

  if(command === "virus") {
    message.delete().catch(O_o=>{});
    const userVirus = args.join(" ");
    const v = await message.channel.send("Loading Up Virus.");
    v.edit("```[|] Loading Up Virus..```");
    v.edit("```[/] Loading Up Virus...```");
    v.edit("```[-] Loading Up Virus....```");
    v.edit("```Virus Located!```");
    v.edit("```[|] Downloading \n[Virus.dll] \nProgress: [===] 30%```");
    v.edit("```[/] Downloading. \n[Virus.bat] \nProgress: [=====] 50%```");
    v.edit("```[-] Downloading.. \n[Virus.exe] \nProgress: [======] 60%```");
    v.edit("```[\] Downloading.. \n[Virus.cab] \nProgress: [=======] 65%```");
    v.edit("```[|] Downloading.. \n[Virus.cab] \nProgress: [========] 70%```");
    v.edit("```[/] Downloading.. \n[VirusContainer.cab] \nProgress: [=========] 75%```");
    v.edit("```[-] Downloading.. \n[Virus.sln] \nProgress: [==========] 85%```");
    v.edit("```[\] Downloading.. \n[Virus.sln] \nProgress: [===========] 95%```");
    v.edit("```[|] Downloading.. \n[Virus.sln] \nProgress: [============] 100%```");
    v.edit(`Virus Successfully Injected to ${userVirus}!`);
  }

  if(command === "kill") {
    const killUser = args.join(" ");
    var killChance = [
      `You missed the target!, you got arrested.. :police_car:`,
      `You called your gang, they came, and Helped you kill ${killUser}, but they betrayed you afterwards.`,
      `You charged to ${killUser} with a knife, you successfully killed him! :knife:`, 
      `While ${killUser} was sleeping, you've injected him poison, the other day, he died... :skull_crossbones:`,
      `You called your gang, they came, and Helped you kill ${killUser}, and you paid them for that, they didn't betray you..`,
      `You gave ${killUser} a drink, but you accidentally mixed up Drugs in it, he goes crazy and he killed you... :skull_crossbones:`,
      `You gave ${killUser} a drink, but you mixed up Poison in it, he slowly suffocates to his death...`,
      `You gave ${killUser} a drink, but you mixed up Acid in it, now his stomach is melting..`
    ];
    var killCalculate = Math.floor(Math.random()*killChance.length);
    message.reply(`${killChance[killCalculate]}`)
  }

  if(command === "8ball") {
    const fortuneAsk = args.join(" ");
    var fortuneChance = [
      `Yes.`,
      `No.`,
      `Probably.`,
      `I don't know...`
    ];
    var fortuneCalculate = Math.floor(Math.random()*fortuneChance.length);
    message.channel.send(`${fortuneChance[fortuneCalculate]}`)
  }
});
client.login(process.env.BOT_TOKEN);
