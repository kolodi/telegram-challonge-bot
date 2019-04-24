process.env.NTBA_FIX_319 = "promise fix"

const config = require('./config/config')
const Challonge = require('./challonge')
const TelegramBot = require('node-telegram-bot-api')
const logger = require('./logger')

const challonge = new Challonge(config.challonge_token)

const run = async () => {

    // let t = await challonge.tournaments.index({ state: "pending" })
    // let t = await challonge.tournaments.create({ name: "Node2", url: "se_popup_aaa" })
    //let t = await challonge.tournaments.show({ url: "se_popup_aaa" })
    // let t = await challonge.tournaments.update({ url: "se_popup_aaa", name: "Changed name" })
    // let t = await challonge.tournaments.destroy({ url: "se_popup_aaa" })
    // let t = await challonge.participants.index({ url: "se_popup_aaa" })
    // let t = await challonge.participants.create({ url: "se_popup_aaa" }, { name: "Player 1", misc: "tg user 1" })
    // let t = await challonge.participants.bulkAdd({ url: "se_popup_aaa" }, [{ name: "Player 2", misc: "tg user 2" }, { name: "Player 3", misc: "tg user 3" }, { name: "Player 4", misc: "tg user 4" }])
    // let t = await challonge.tournaments.start({ url: "se_popup_aaa" })
    // let t = await challonge.tournaments.reset({ url: "se_popup_aaa" })
    // let t = await challonge.participants.randomize({ url: "se_popup_aaa" })
    // let t = await challonge.participants.show({ url: "se_popup_aaa" }, {id:96294923})
    // let t = await challonge.participants.update({ url: "se_popup_aaa" }, {id:96294923, name: "changed name"})
    // let t = await challonge.participants.destroy({ url: "se_popup_aaa" }, {id:96294923})
    // let t = await challonge.matches.index({ url: "se_popup_aaa" })
    // let t = await challonge.matches.show({ url: "se_popup_aaa" }, { id: 158148721 })
    // let t = await challonge.matches.update({ url: "se_popup_aaa" }, { id: 158148721, scores_csv:"2-1", winner_id:96294924 })
    // let t = await challonge.matches.update({ url: "se_popup_aaa" }, { id: 158148722, scores_csv:"2-1", winner_id:96294925 })
    // let t = await challonge.matches.reopen({ url: "se_popup_aaa" }, { id: 158148721 })
    // let t = await challonge.tournaments.finalize({ url: "se_popup_aaa" })
    // let t = await challonge.tournaments.show({ url: "se20191", include_participants: 0, include_matches: 1 })
    // logger.logToFile(`logs/challonge/tournaments/${t.tournament.id}.json`, t)

    let t = await challonge.matches.index({ url: "sunday_special_" })
    //logger.logToFile(`logs/challonge/matches/index.json`, t)

    console.log(t)
}

run()