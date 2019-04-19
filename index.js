const TelegramBot = require('node-telegram-bot-api');
const rp = require('request-promise');
const fs = require('fs');

const storeData = (data, path) => {
    try {
        fs.writeFileSync(path, data)
    } catch (err) {
        console.error(err)
    }
}

const saveJson = (data, path) => {
    try {
        fs.writeFileSync(path, JSON.stringify(data))
    } catch (err) {
        console.error(err)
    }
}

const getData = (path) => {
    try {
        return JSON.parse(fs.readFileSync(path))
    } catch (err) {
        console.log(err)
    }
}

const savePopup = (popup) => {
    storeData(JSON.stringify(popup, null, "\t"), 'popup.json');
}

const getCurrentPopup = () => {
    return getData('popup.json');
}

const config = getData('config/config.json');

const tgToken = config.tg_token;
const challongeToken = config.challonge_token;
const challongeBasePath = 'https://api.challonge.com/v1/';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(tgToken, { polling: true });


const joinPopup = (msg, ign) => {
    if(config.ignore_updates) return;
    let popup = getCurrentPopup();

    const chatId = msg.chat.id;

    let found = popup.participants.find(p => p.tgUser.id == msg.from.id);
    if(found) {
        bot.sendMessage(chatId, `${msg.from.first_name}, you have already joined popup`);
        return;
    }

    popup.participants.push({
        tgUser: msg.from,
        ign: ign
    });

    savePopup(popup);

    bot.sendMessage(chatId, `Player ${ign} has joined ${popup.name}`);
}

const showList = (msg, withusernames = false) => {
    if(config.ignore_updates) return;
    let popup = getData('popup.json');
    
    const chatId = msg.chat.id;

    let ppl = popup.participants;
    let response = `${popup.name}: (${popup.participants.length}) \n`;
    for(let p of ppl) {
        response += `${p.ign}`;
        if(withusernames) response += `\t\t\t@${p.tgUser.username}`;
        response += ` \n`;
    }

    bot.sendMessage(chatId, response);
}

bot.onText(/\/create$/, (msg, match) => {
    if(config.ignore_updates) return;

    
});

bot.onText(/\/ppl$/, (msg, match) => {
    if(config.ignore_updates) return;
    showList(msg);
});
bot.onText(/\/list$/, (msg, match) => {
    if(config.ignore_updates) return;
    showList(msg);
});
bot.onText(/\/rollcall$/, (msg, match) => {
    if(config.ignore_updates) return;
    showList(msg, true);
});


bot.onText(/\/join (.+)/, (msg, match) => {
    if(config.ignore_updates) return;
    joinPopup(msg, match[1]);
});
bot.onText(/\/in (.+)/, (msg, match) => {
    if(config.ignore_updates) return;
    joinPopup(msg, match[1]);
});

bot.onText(/\/quit$/, (msg, match) => {
    if(config.ignore_updates) return;
    let popup = getData('popup.json');

    const chatId = msg.chat.id;

    let found = popup.participants.find(p => p.tgUser.id == msg.from.id);
    if(found) {

        bot.sendMessage(chatId, `${msg.from.first_name}, quit is not implemented yet, thx`);
        return;
    }

    savePopup(popup);

    bot.sendMessage(chatId, `Player ${match[1]} is not in list`);
});

bot.onText(/\/addpplbulk$/, (msg, match) => {
    if(config.ignore_updates) return;
    let popup = getData('popup.json');

    const chatId = msg.chat.id;

    var options = {
        method: 'POST',
        uri: `${challongeBasePath}tournaments/${popup.tournament.id}/participants/bulk_add.json`,
        body: {
            api_key: challongeToken,
            participants: popup.participants.map(p => { return {name: p.ign}})
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    rp(options)
        .then(function (parsedBody) {
            popup.participants_added = true;

            savePopup(popup);

            bot.sendMessage(chatId, `${popup.participants.length} participants added`);
        })
        .catch(function (err) {
            console.log(err);
            bot.sendMessage(chatId, "error adding participants");
        });
});

bot.onText(/\/begin$/, (msg, match) => {
    if(config.ignore_updates) return;
    let popup = getData('popup.json');

    const chatId = msg.chat.id;

    if(msg.from.id !== popup.creator.id) {
        bot.sendMessage(chatId, `Sorry ${msg.from.first_name} you are not a creator of this popup`);
        return;
    }

    var options = {
        method: 'POST',
        uri: challongeBasePath + 'tournaments.json',
        body: {
            api_key: challongeToken,
            tournament: {
                name: popup.name,
                url: "se_popup_xxx"
            }
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    rp(options)
        .then(function (parsedBody) {
            popup.tournament = parsedBody.tournament;

            savePopup(popup);

            bot.sendMessage(chatId, `Popup ${popup.name} has started, \n brackets: ${parsedBody.tournament.full_challonge_url}`);
        })
        .catch(function (err) {
            console.log(err);
            bot.sendMessage(chatId, "error starting");
        });
});

bot.onText(/\/create (.+)/, (msg, match) => {
    if(config.ignore_updates) return;
    const chatId = msg.chat.id;

    let popup = getData('popup.json');

    if(popup && popup.state && popup.state !== 'completed') {
        bot.sendMessage(chatId, `There is already a popup running: ${popup.name}`);
        return;
    }

    popup = {
        id: 123,
        name: match[1],
        creator: msg.from,
        state: 'initialized',
        participants: []
    }
    savePopup(popup);
    
    bot.sendMessage(chatId, `Popup ${popup.name} has been created`);
});

// Matches "/tournaments [whatever]"
bot.onText(/\/tournaments (.+)/, (msg, match) => {
    if(config.ignore_updates) return;
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"

    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, resp);
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    console.log(msg.text);
    // send a message to the chat acknowledging receipt of their message
    //bot.sendMessage(chatId, 'your message: ' + msg.text);
    //
    //
    //console.log(msg.text);
    //
    //rp(`${challongeBasePath}tournaments/se_popup_4.json?api_key=${challongeToken}&state=ended`)
    //    .then(function (data) {
    //        storeData(data, "tournaments.json");
    //    })
    //    .catch(function (err) {
    //        console.log(err);
    //    });
    saveJson(msg, 'last_message.json');
});
