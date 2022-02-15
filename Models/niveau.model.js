const mongoose = require('mongoose')
const schema = mongoose.Schema({
    nom: {type: String, default: ""},
})

module.exports = mongoose.model('niveau',schema)