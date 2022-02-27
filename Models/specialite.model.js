const mongoose = require('mongoose')
const niveau = require('./niveau.model')

const schema = mongoose.Schema({
    nom: { type: String, default: ""},
    niveaux: { type: Object, ref:'niveau' }
})

module.exports = mongoose.model('specialite',schema)