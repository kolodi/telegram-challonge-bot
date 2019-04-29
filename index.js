process.env.NTBA_FIX_319 = "promise fix"

const config = require('./config/config')
const fsUtils = require('./fs.utils')
const Challonge = require('./challonge')
const TelegramBot = require('node-telegram-bot-api')

const challonge = new Challonge(config.challonge_token)
const tg = new TelegramBot(config.tg_token, { polling: true })

tg.on('message', (msg) => {
    console.log(`@${msg.from.username}: ${msg.text}`)

});

tg.onText(/\/in$/, (msg, match) => {
    popupBot.command('command_in', msg, null)
})
tg.onText(/\/in (.+)/, (msg, match) => {
    popupBot.command('command_in', msg, match[1])
});
tg.onText(/\/join$/, (msg, match) => {
    popupBot.command('command_in', msg, null)
});
tg.onText(/\/join (.+)/, (msg, match) => {
    popupBot.command('command_in', msg, match[1])
});

tg.onText(/\/add (.+)/, (msg, match) => {
    popupBot.command('command_add', msg, match[1])
});

tg.onText(/\/ign$/, (msg, match) => {
    popupBot.command('command_ign', msg, match[1])
});
tg.onText(/\/ign (.+)/, (msg, match) => {
    popupBot.command('command_ign', msg, match[1])
});

tg.onText(/\/out$/, (msg, match) => {
    popupBot.command('command_quit', msg, null)
});
tg.onText(/\/quit$/, (msg, match) => {
    popupBot.command('command_quit', msg, null)
});

tg.onText(/\/score (.+)/, (msg, match) => {
    popupBot.command('command_score', msg, match[1])
});
tg.onText(/\/score$/, (msg, match) => {
    popupBot.command('command_score', msg, null)
});

tg.onText(/\/confirm (.+)/, (msg, match) => {
    popupBot.command('command_confirm', msg, match[1])
});
tg.onText(/\/confirm$/, (msg, match) => {
    popupBot.command('command_confirm', msg, null)
});

tg.onText(/\/opponent (.+)/, (msg, match) => {
    popupBot.command('command_opponent', msg, match[1])
});
tg.onText(/\/opponent$/, (msg, match) => {
    popupBot.command('command_opponent', msg, null)
});

tg.onText(/\/begin (.+)/, (msg, match) => {
    popupBot.command('command_begin', msg, match[1])
});
tg.onText(/\/begin$/, (msg, match) => {
    popupBot.command('command_begin', msg, null)
});

tg.onText(/\/kick (.+)/, (msg, match) => {
    popupBot.command('command_kick', msg, match[1])
});
tg.onText(/\/kick$/, (msg, match) => {
    popupBot.command('command_kick', msg, null)
});


tg.onText(/\/cancel$/, (msg, match) => {
    popupBot.command('command_cancel', msg, null)
});

tg.onText(/\/close$/, (msg, match) => {
    popupBot.command('command_close', msg, null)
});

tg.onText(/\/winner$/, (msg, match) => {
    popupBot.command('command_winner', msg, null)
});

tg.onText(/\/winners$/, (msg, match) => {
    popupBot.command('command_winners', msg, null)
});

tg.onText(/\/destroy$/, (msg, match) => {
    popupBot.command('command_destroy', msg, null)
});

tg.onText(/\/help$/, (msg, match) => {
    popupBot.command('command_help', msg, null)
});

tg.onText(/\/list$/, (msg, match) => {
    popupBot.command('command_ppl', msg, null)
});
tg.onText(/\/ppl$/, (msg, match) => {
    popupBot.command('command_ppl', msg, null)
});


tg.onText(/\/create$/, (msg, match) => {
    popupBot.command('command_create', msg, null)
});

const popupBot = {
    opupBaseName: "auto popup ",
    popupBaseUrlBase: "auto_popup_",
    autosaveInterval: 10000,
    popup: null,
    initialize: function () {
        try {
            this.popup = fsUtils.getJson('popup.json')
        }
        catch (err) {
            console.log(err)
            this.popup = {
                participants: [],
                users: []
            }
        }

        // set autosave interval
        // setInterval(function () {
        //     arguments[0]._save()
        // }, config.autosaveInterval, this)
    },
    _save: function () {
        fsUtils.saveJson('popup.json', this.popup)
        console.log("popup saved")
    },
    _notImplemented: function (user, msg, arg) {
        tg.sendMessage(
            msg.chat.id,
            `This command is not yet implemented`,
            { reply_to_message_id: msg.message_id })
    },
    _getRegisteredUser: function (tg_user) {
        let user = null
        try {
            user = fsUtils.getJson(`users/${tg_user.id}.json`)
        } catch (err) {
            user = null
        }
        return user
    },
    _saveRegisteredUser: function (persistentUser) {
        fsUtils.saveJson(`users/${persistentUser.tg_user.id}.json`, persistentUser)
    },
    command: async function (command, msg, arg) {
        fsUtils.saveJson(`logs/tg/commands/${msg.message_id}.json`, msg)
        let user = this.popup.users.find(p => p.tg_user.id === msg.from.id)
        if (!user) {
            let persistentUser = this._getRegisteredUser(msg.from)
            if (!persistentUser) {
                persistentUser = {
                    tg_user: msg.from,
                    ign: ""
                }
                this._saveRegisteredUser(persistentUser)
            }
            this.popup.users.push(persistentUser)
            user = persistentUser
        }

        if (user.undergoingOperation) {
            console.log(`There is undergoing operation ${user.undergoingOperation} for @${user.username}`)
            return
        }

        user.undergoingOperation = command
        try {
            await this[command](user, msg, arg)
        } catch (err) {
            console.log(err)
            let d = new Date().getTime().toString()
            fsUtils.saveJson(`logs/errors/${d}.json`, {message: err.message, stack: err.stack})
            tg.sendMessage(msg.chat.id, "Server error")
        }
        user.undergoingOperation = null
        this._save()
    },
    command_create: async function (user, msg, arg) {
        if (this.popup.url) {
            tg.sendMessage(msg.chat.id, "There is already popup created")
            return
        }

        let t = await challonge.tournaments.create(
            {
                name: this.popupBaseName + msg.message_id,
                url: this.popupBaseUrlBase + msg.message_id
            })
        this.popup.url = t.tournament.url
        this.popup.creator = msg.from
        tg.sendMessage(msg.chat.id, "Popup has been created successfully, use /in command to join")

    },
    command_ign: async function (user, msg, arg) {
        if (!arg || arg.length < 3) {
            tg.sendMessage(
                msg.chat.id,
                `IGN is too short, please specify your IGN after the command`,
                { reply_to_message_id: msg.message_id })
            return false
        }

        if (user.ign != arg) {
            let userInList = this.popup.participants.find(p => p.tg_user.id === user.tg_user.id)
            if (userInList) {
                let challongeUpdate = await challonge.participants.update(
                    {url: this.popup.url},
                    {id: userInList.challonge_id, name: arg}
                )
            }

            user.ign = arg
            this._saveRegisteredUser(user)
            tg.sendMessage(
                msg.chat.id,
                `@${user.tg_user.username}'s new IGN is: ${arg}`,
                { reply_to_message_id: msg.message_id })
        }

        return true
    },
    command_in: async function (user, msg, arg) {
        let userInList = this.popup.participants.find(p => p.tg_user.id === user.tg_user.id)
        if (userInList) {
            tg.sendMessage(
                msg.chat.id,
                `You are already in`,
                { reply_to_message_id: msg.message_id })
            return
        }

        if (arg) {
            let isIgnSetCorrectly = await this.command_ign(user, msg, arg)
            if (isIgnSetCorrectly === false) {
                return
            }
        }

        if (!user.ign) {
            tg.sendMessage(
                msg.chat.id,
                `We don't have your IGN (In Game Name), please specify it with /ign [IGN] command`,
                { reply_to_message_id: msg.message_id })
            return
        }
        
        let addUser = await challonge.participants.create(
            {url: this.popup.url},
            {name: user.ign}
        )

        user.challonge_id = addUser.participant.id

        this.popup.participants.push(user)
        
        tg.sendMessage(msg.chat.id, `@${user.tg_user.username} has joined with IGN: ${user.ign}`)
    },
    command_add: async function (user, msg, arg) {
        if(this.popup.creator.id != user.tg_user.id) {
            tg.sendMessage(
                msg.chat.id,
                `Only creator can use this command`,
                { reply_to_message_id: msg.message_id })
            return
        }
        console.log(msg)
    },
    command_quit: async function(user, msg, arg) {
        let userInList = this.popup.participants.find(p => p.tg_user.id === user.tg_user.id)
        if (!userInList) {
            tg.sendMessage(
                msg.chat.id,
                `You was not in list anyway`,
                { reply_to_message_id: msg.message_id })
            return
        }

        let removed = await challonge.participants.destroy(
            {url: this.popup.url},
            {id: userInList.challonge_id}
        )

        for(let i = 0; i < this.popup.participants.length; i++) {
            if(this.popup.participants[i] === user) {
                this.popup.participants.splice(i, 1)
                break
            }
        }

        tg.sendMessage(msg.chat.id, `@${user.tg_user.username} quit`)
    },
    command_score: async function(user, msg, arg) {
        this._notImplemented(user, msg, arg)
    },
    command_confirm: async function(user, msg, arg) {
        this._notImplemented(user, msg, arg)
    },
    command_opponent: async function(user, msg, arg) {
        this._notImplemented(user, msg, arg)
    },
    command_begin: async function(user, msg, arg) {
        this._notImplemented(user, msg, arg)
    },
    command_close: async function(user, msg, arg) {
        this._notImplemented(user, msg, arg)
    },
    command_cancel: async function(user, msg, arg) {
        this._notImplemented(user, msg, arg)
    },
    command_kick: async function(user, msg, arg) {
        this._notImplemented(user, msg, arg)
    },
    command_winner: async function(user, msg, arg) {
        this._notImplemented(user, msg, arg)
    },
    command_winners: async function(user, msg, arg) {
        this._notImplemented(user, msg, arg)
    },
    command_help: async function(user, msg, arg) {
        let text = fsUtils.getText('help.txt')
        tg.sendMessage(
            msg.chat.id,
            text,
            { reply_to_message_id: msg.message_id })
    },
    command_destroy: async function(user, msg, arg) {
        this._notImplemented(user, msg, arg)
    },
    command_ppl: async function(user, msg, arg) {
        let ppl = this.popup.participants;
        let response = `${this.popup.url}: (${this.popup.participants.length}) \n`;
        for (let p of ppl) {
            response += `${p.ign}`;
            response += `\t\t\t@${p.tg_user.first_name}`;
            response += ` \n`;
        }
        tg.sendMessage(
            msg.chat.id,
            response)
    }

}

popupBot.initialize()
