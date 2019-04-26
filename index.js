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
    popupBot.command_in(msg, null)
});
tg.onText(/\/join$/, (msg, match) => {
    popupBot.command_in(msg, null)
});

tg.onText(/\/create$/, (msg, match) => {
    popupBot.command_create(msg, null)
});

const popupBot = {
    opupBaseName:"auto popup ",
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
    _registerOperationForUser: function (user, operation) {
        let popupUser = this.popup.users.find(p => p.tg_user.id === user.id)
        if (popupUser) {
            if (popupUser.undergoingOperation) {
                return false
            } else {
                popupUser.undergoingOperation = operation
            }
        } else {
            this.popup.users.push({
                tg_user: user,
                undergoingOperation: operation
            })
        }
        return true
    },
    _releaseOperationForUser: function (user) {
        let popupUser = this.popup.users.find(p => p.tg_user.id === user.id)
        if (popupUser) {
            popupUser.undergoingOperation = null
        }
    },
    command_create: async function (msg, arg) {
        if (this.popup.url) {
            tg.sendMessage(msg.chat.id, "There is already popup created")
            return
        }
        try {
            let t = await challonge.tournaments.create(
                {
                    name: this.popupBaseName + msg.message_id,
                    url: this.popupBaseUrlBase + msg.message_id
                })
            this.popup.url = t.tournament.url
            tg.sendMessage(msg.chat.id, "Popup has been created successfully, use /in command to join")
            this._save()
        } catch (err) {
            console.log(err)
            tg.sendMessage(msg.chat.id, "Server error")
        }

    },
    command_in: async function (msg, arg) {
        fsUtils.saveJson(`logs/tg/updates/${msg.message_id}.json`, msg)
        let user = msg.from
        if (this._registerOperationForUser(user, 'in') === false) return
        // adding new participant (async operation on challonge)

        tg.sendMessage(msg.chat.id, "joined")
        this._releaseOperationForUser(user)
        this._save()
    }
}

popupBot.initialize()
