const mongoose = require('mongoose')
const niveau = require('./niveau.model')

const schema = mongoose.Schema({
    nom: { type: String, default: ""},
    niveaux: { type: mongoose.Schema.Types.ObjectId, ref:'niveau' }
})

module.exports = mongoose.model('specialite',schema)