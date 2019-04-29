const fs = require('fs')

const debugOn = true

const logToFile = (path, data, stringify = true) => {
    if (debugOn === false) return
    if (stringify)
        fs.writeFileSync(path, JSON.stringify(data, null, '\t'))
    else
        fs.writeFileSync(path, data)
}

const getText = (path) => {
    return fs.readFileSync(path)
}

const getJson = (path) => {
    return JSON.parse(fs.readFileSync(path))
}

const saveJson = (path, data) => {
    fs.writeFileSync(path, JSON.stringify(data, null, '\t'))
}

const debug = {

    log: (msg) => {
        if(debugOn === false) return
        console.log(msg)
    }
}

module.exports.logToFile = logToFile
module.exports.getJson = getJson
module.exports.saveJson = saveJson
module.exports.getText = getText