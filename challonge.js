const rp = require('request-promise')
const baseUrl = "https://api.challonge.com/v1/"
const debug = true

class Challonge {
    constructor(api_key) {
        if (!api_key) throw "api_key is required"
        Object.defineProperty(this, "api_key", { value: api_key })
        this.tournaments = {
            index: (options) => {
                let url = `${baseUrl}tournaments.json?api_key=${this.api_key}`
                if (options.state) url += `&state=${options.state}`
                if (options.type) url += `&type=${options.type}`
                if (options.created_after) url += `&created_after=${options.created_after}`
                if (options.created_before) url += `&created_before=${options.created_before}`
                if (options.subdomain) url += `&subdomain=${options.subdomain}`
                if (debug) console.log("[GET]" + url)
                return rp.get(url, { json: true })
            },
            create: (tournament) => {
                let url = `${baseUrl}tournaments.json`
                if (debug) console.log("[POST]" + url)
                if (debug) console.log(tournament)
                if (!tournament.name || !tournament.url) {
                    throw "No tournament name or url provided"
                }
                let options = {
                    method: 'POST',
                    uri: url,
                    body: {
                        api_key: this.api_key,
                        tournament: tournament
                    },
                    json: true
                }
                return rp(options)
            },
            show: (options) => {
                let id_or_url = options.id || options.url
                let url = `${baseUrl}tournaments/${id_or_url}.json?api_key=${this.api_key}`
                if (options.include_participants) url += `&include_participants=1`
                if (options.include_matches) url += `&include_matches=1`
                if (debug) console.log("[GET]" + url)
                return rp.get(url, { json: true })
            },
            update: (tournament) => {
                let id_or_url = tournament.id || tournament.url
                let url = `${baseUrl}tournaments/${id_or_url}.json`
                if (debug) console.log("[PUT]" + url)
                if (debug) console.log(tournament)
                let options = {
                    method: 'PUT',
                    uri: url,
                    body: {
                        api_key: this.api_key,
                        tournament: tournament
                    },
                    json: true
                }
                return rp(options)
            },
            destroy: (tournament) => {
                let id_or_url = tournament.id || tournament.url
                let url = `${baseUrl}tournaments/${id_or_url}.json`
                if (debug) console.log("[DELETE]" + url)
                if (debug) console.log(tournament)
                let options = {
                    method: 'DELETE',
                    uri: url,
                    body: {
                        api_key: this.api_key
                    },
                    json: true
                }
                return rp(options)
            },
            start: (tournament) => {
                let id_or_url = tournament.id || tournament.url
                let url = `${baseUrl}tournaments/${id_or_url}/start.json`
                if (debug) console.log("[POST]" + url)
                if (debug) console.log(tournament)
                let options = {
                    method: 'POST',
                    uri: url,
                    body: {
                        api_key: this.api_key
                    },
                    json: true
                }
                return rp(options)
            },
            reset: (tournament) => {
                let id_or_url = tournament.id || tournament.url
                let url = `${baseUrl}tournaments/${id_or_url}/reset.json`
                if (debug) console.log("[POST]" + url)
                if (debug) console.log(tournament)
                let options = {
                    method: 'POST',
                    uri: url,
                    body: {
                        api_key: this.api_key
                    },
                    json: true
                }
                return rp(options)
            },
            finalize: (tournament) => {
                let id_or_url = tournament.id || tournament.url
                let url = `${baseUrl}tournaments/${id_or_url}/finalize.json`
                if (debug) console.log("[POST]" + url)
                if (debug) console.log(tournament)
                let options = {
                    method: 'POST',
                    uri: url,
                    body: {
                        api_key: this.api_key
                    },
                    json: true
                }
                return rp(options)
            }
            //TODO: process_check_ins, abort_check_in, open_for_predictions
        }
        this.participants = {
            index: (tournament) => {
                let id_or_url = tournament.id || tournament.url
                let url = `${baseUrl}tournaments/${id_or_url}/participants.json?api_key=${this.api_key}`
                if (debug) console.log("[GET]" + url)
                return rp.get(url, { json: true })
            },
            create: (tournament, participant) => {
                let id_or_url = tournament.id || tournament.url
                let url = `${baseUrl}tournaments/${id_or_url}/participants.json`
                if (debug) console.log("[POST]" + url)
                if (debug) console.log(participant)
                let options = {
                    method: 'POST',
                    uri: url,
                    body: {
                        api_key: this.api_key,
                        participant: participant
                    },
                    json: true
                }
                return rp(options)
            },
            update: (tournament, participant) => {
                let id_or_url = tournament.id || tournament.url
                let url = `${baseUrl}tournaments/${id_or_url}/participants/${participant.id}.json`
                if (debug) console.log("[PUT]" + url)
                if (debug) console.log(participant)
                let options = {
                    method: 'PUT',
                    uri: url,
                    body: {
                        api_key: this.api_key,
                        participant: participant
                    },
                    json: true
                }
                return rp(options)
            },
            destroy: (tournament, participant) => {
                let id_or_url = tournament.id || tournament.url
                let url = `${baseUrl}tournaments/${id_or_url}/participants/${participant.id}.json`
                if (debug) console.log("[DELETE]" + url)
                if (debug) console.log(participant)
                let options = {
                    method: 'DELETE',
                    uri: url,
                    body: {
                        api_key: this.api_key
                    },
                    json: true
                }
                return rp(options)
            },
            show: (tournament, participant) => {
                let id_or_url = tournament.id || tournament.url
                let url = `${baseUrl}tournaments/${id_or_url}/participants/${participant.id}.json?api_key=${this.api_key}`
                if (debug) console.log("[GET]" + url)
                return rp.get(url)
            },
            bulkAdd: (tournament, participants) => {
                let id_or_url = tournament.id || tournament.url
                let url = `${baseUrl}tournaments/${id_or_url}/participants/bulk_add.json`
                if (debug) console.log("[POST]" + url)
                if (debug) console.log(participants)
                let options = {
                    method: 'POST',
                    uri: url,
                    body: {
                        api_key: this.api_key,
                        participants: participants
                    },
                    json: true
                }
                return rp(options)
            },
            randomize: (tournament) => {
                let id_or_url = tournament.id || tournament.url
                let url = `${baseUrl}tournaments/${id_or_url}/participants/randomize.json`
                if (debug) console.log("[POST]" + url)
                let options = {
                    method: 'POST',
                    uri: url,
                    body: {
                        api_key: this.api_key
                    },
                    json: true
                }
                return rp(options)
            }
        }
        this.matches = {
            index: (tournament) => {
                let id_or_url = tournament.id || tournament.url
                let url = `${baseUrl}tournaments/${id_or_url}/matches.json?api_key=${this.api_key}`
                if (debug) console.log("[GET]" + url)
                return rp.get(url, { json: true })
            },
            show: (tournament, match) => {
                let id_or_url = tournament.id || tournament.url
                let url = `${baseUrl}tournaments/${id_or_url}/matches/${match.id}.json?api_key=${this.api_key}`
                if (debug) console.log("[GET]" + url)
                return rp.get(url, { json: true })
            },
            update: (tournament, match) => {
                let id_or_url = tournament.id || tournament.url
                let url = `${baseUrl}tournaments/${id_or_url}/matches/${match.id}.json`
                if (debug) console.log("[PUT]" + url)
                if (debug) console.log(match)
                let options = {
                    method: 'PUT',
                    uri: url,
                    body: {
                        api_key: this.api_key,
                        match: match
                    },
                    json: true
                }
                return rp(options)
            },
            reopen: (tournament, match) => {
                let id_or_url = tournament.id || tournament.url
                let url = `${baseUrl}tournaments/${id_or_url}/matches/${match.id}/reopen.json`
                if (debug) console.log("[POST]" + url)
                let options = {
                    method: 'POST',
                    uri: url,
                    body: {
                        api_key: this.api_key
                    },
                    json: true
                }
                return rp(options)
            }
        }
    }

    async participantsOrdered(tournament) {
        let matches = await this.matches.index(tournament)
        return matches
    }
}

module.exports = Challonge