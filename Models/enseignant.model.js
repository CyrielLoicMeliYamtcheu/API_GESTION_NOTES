const mongoose = require('mongoose')
const matiere = require('./matiere.model')

const schema = mongoose.Schema({
    nom: {type: String, default: ""},
    prenom: {type: String, default: ""},
    email: {type: String, default: ""},
    password: {type: String, default: ""},
    matieres: [{ type: mongoose.Schema.Types.ObjectId, ref:'matiere' }], 
    
})

module.exports = mongoose.model('enseignant',schema)