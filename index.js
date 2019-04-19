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
        fs.writeFileSync(path, JSON.stringify(data, null, "\t"))
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
    saveJson(popup, 'popup.json');
}

const config = getData('config/config.json');
let popup = getData('popup.json');

const tgToken = config.tg_token;
const challongeToken = config.challonge_token;
const challongeBasePath = 'https://api.challonge.com/v1/';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(tgToken, { polling: true });

const botBlock = () => {
    return config.ignore_updates;
}

const checkCreatorOperation = (msg, command) => {
    if (popup.creator.id != msg.from.id) {
        bot.sendMessage(msg.chat.id, `only popup creator @${popup.creator.username} can execute ${command} command`);
        return true;
    }
    return false;
}

const debugMessage = (msg, text) => {
    if (config.debug) {
        bot.sendMessage(msg.chat.id, "[DEBUG MESSAGE] " + text);
    }
}

const joinPopup = (msg, ign) => {
    if (botBlock()) return;

    const chatId = msg.chat.id;
    const user = msg.from.usernameM

    let found = popup.participants.find(p => p.tgUser.id == msg.from.id);
    if (found) {
        bot.sendMessage(chatId, `@${user}, you have already joined ${popup.name}`);
        return;
    }

    popup.participants.push({
        tgUser: msg.from,
        ign: ign
    });

    savePopup(popup);

    bot.sendMessage(chatId, `Player ${ign} - @${user} has joined ${popup.name}`);
}

const showList = (msg, withusernames = false) => {
    if (config.ignore_updates) return;

    const chatId = msg.chat.id;

    let ppl = popup.participants;
    let response = `${popup.name}: (${popup.participants.length}) \n`;
    for (let p of ppl) {
        response += `${p.ign}`;
        if (withusernames) response += `\t\t\t@${p.tgUser.username}`;
        response += ` \n`;
    }

    bot.sendMessage(chatId, response);
}

const quitPopup = (msg) => {
    if (botBlock()) return;

    let ppl = popup.participants;
    const chatId = msg.chat.id;
    let response = `@${msg.from.username} is not in participants list`;

    for (let i = 0; i < ppl.length; i++) {
        if (ppl[i].tgUser.id == msg.from.id) {
            response = `@${msg.from.username} left popup`;
            ppl.splice(i, 1);
        }
    }

    bot.sendMessage(chatId, response);
    savePopup(popup);
}

const addBulk = (popup) => {
    var options = {
        method: 'POST',
        uri: `${challongeBasePath}tournaments/${popup.tournament.id}/participants/bulk_add.json`,
        body: {
            api_key: challongeToken,
            participants: popup.participants.map(p => { return { name: p.ign } })
        },
        json: true // Automatically stringifies the body to JSON
    };

    return new Promise((resolve, reject) => {
        rp(options).then(resolve).catch(reject);
    });
}

const createOnChallonge = (popup) => {

    return new Promise((resolve, reject) => {
        var options = {
            method: 'POST',
            uri: challongeBasePath + 'tournaments.json',
            body: {
                api_key: challongeToken,
                tournament: {
                    name: popup.name,
                    url: "se_popup_" + popup.id
                }
            },
            json: true // Automatically stringifies the body to JSON
        };

        rp(options).then(resolve).catch(reject);
    });
}

const beginPopup = (msg) => {
    if (botBlock()) return;

    if (checkCreatorOperation(msg, "/begin")) return;


}

const getPending = () => {
    return new Promise((resolve, reject) => {
        let d = new Date();
        d.setDate(d.getDate() - 1); // - 1 day
        let dateString = d.toISOString().split('T')[0]; // YYYY-MM-DD string
        var options = {
            method: 'GET',
            uri: `${challongeBasePath}tournaments.json?api_key=${challongeToken}&state=pending&created_after=${dateString}`,
        };

        rp(options).then(resolve).catch(reject);
    });
}

const createNew = (msg, match) => {
    if (botBlock()) return;

    const chatId = msg.chat.id;

    if (popup && popup.state) {
        bot.sendMessage(chatId, `There is already initialized: ${popup.name}`);
        return;
    }

    popup = {
        id: msg.message_id,
        name: match[1],
        creator: msg.from,
        state: {
            creating_on_challonge: false,
            initialized: true
        },
        participants: []
    }
    savePopup(popup);

    createOnChallonge(popup)
        .then(response => {
            popup.tournament = response.tournament;
            savePopup(popup);
            debugMessage(msg, `Popup ${popup.name} has been created on challonge`);
        })
        .catch(err => {
            debugMessage(msg, err.message);
        })
}

const closePopup = (msg) => {
    if (botBlock()) return;

    if (checkCreatorOperation(msg, "/close")) {
        return;
    }

    saveJson(popup, `popups_archive/${popup.id}.json`)
    popup = {};
    savePopup(popup);
    bot.sendMessage(msg.chat.id, `${popup.name} has been closed successfully`);
}

const showCurrentPopupInfo = (msg) => {
    if (botBlock()) return;

    const chatId = msg.chat.id;

    let response = "";
    if (!popup || !popup.state) {
        response += `There is no active popup`;
        bot.sendMessage(chatId, response);
        return;
    }

    response += `Active popup: ${popup.name} \n`;
    response += `Number of participants: ${popup.participants.length} \n`;
    response += `Use /list to see complete list \n`;
    bot.sendMessage(chatId, response);
}

const helpText = (msg) => {
    let helpString = fs.readFileSync('help.txt');
    bot.sendMessage(msg.chat.id, helpString);
}

bot.onText(/\/help$/, (msg, match) => {
    helpText(msg);
});
bot.onText(/\/info$/, (msg, match) => {
    showCurrentPopupInfo(msg);
});


bot.onText(/\/create$/, (msg, match) => {
    if (botBlock()) return;

});

bot.onText(/\/ppl$/, (msg, match) => {
    showList(msg);
});
bot.onText(/\/list$/, (msg, match) => {
    showList(msg);
});
bot.onText(/\/rollcall$/, (msg, match) => {
    if (botBlock()) return;
    showList(msg, true);
});


// join/quit
bot.onText(/\/join (.+)/, (msg, match) => {
    joinPopup(msg, match[1]);
});
bot.onText(/\/in (.+)/, (msg, match) => {
    joinPopup(msg, match[1]);
});
bot.onText(/\/out$/, (msg, match) => {
    quitPopup(msg);
});
bot.onText(/\/quit$/, (msg, match) => {
    quitPopup(msg);
});


bot.onText(/\/addpplbulk$/, (msg, match) => {
    if (botBlock()) return;
    let popup = getData('popup.json');

    const chatId = msg.chat.id;

    addBulk(popup)
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

bot.onText(/\/challongestart$/, (msg, match) => {
    if (botBlock()) return;

    if (checkCreatorOperation(msg, "/challongestart")) return;

    createOnChallonge(popup)
        .then((parsedBody) => {
            popup.tournament = parsedBody.tournament;
            bot.sendMessage(msg.chat.id, `brackets has been created: ${parsedBody.tournament.full_challonge_url}`);
            savePopup(popup);
        })
        .catch(function (err) {
            console.log(err);
            bot.sendMessage(chatId, "error creating brackets");
        });
});


bot.onText(/\/close$/, (msg, match) => {
    closePopup(msg);
});

bot.onText(/\/create (.+)/, (msg, match) => {
    if (botBlock()) return;
    
    createNew(msg, match);
});

bot.onText(/\/getpending$/, (msg, match) => {
    if (botBlock()) return;
    
    getPending().then(res => storeData(res, 'logs/pending.json'));
});



// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    console.log(msg.text);

    saveJson(msg, `messages_log/${msg.message_id}.json`);
});
