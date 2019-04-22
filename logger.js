const fs = require('fs')

const debugOn = true

const logToFile = (path, data, stringify = true) => {
    if (debugOn === false) return
    if (stringify)
        fs.writeFileSync(path, JSON.stringify(data, null, '\t'))
    else
        fs.writeFileSync(path, data)
}

const debug = {

    log: (msg) => {
        if(debugOn === false) return
        console.log(msg)
    }
}

module.exports.logToFile = logToFile