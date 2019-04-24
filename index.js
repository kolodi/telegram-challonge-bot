process.env.NTBA_FIX_319 = "promise fix"

const config = require('./config/config')
const Challonge = require('./challonge')
const TelegramBot = require('node-telegram-bot-api')
const logger = require('./logger')

const challonge = new Challonge(config.challonge_token)
const bot = new TelegramBot(config.tg_token, { polling: true })

const popup = {
    participants: [],
    users: []
}

bot.on('message', (msg) => {
    console.log(msg.text)
});

bot.onText(/\/in$/, (msg, match) => {
    if(registerOperationForUser(msg.from, 'in') === false) return
});

const registerOperationForUser = (user, operation) => {
    let user = popup.users.find(p => p.tg_user.id === user.id)
    if(user) {
        if(user.undergoingOperation) {
            return false
        } else {
            user.undergoingOperation = operation
        }
    }else {
        popup.users.push({
            tg_user: user,
            undergoingOperation = operation
        })
    }

    return true
}