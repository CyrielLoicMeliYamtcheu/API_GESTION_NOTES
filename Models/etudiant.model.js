const mongoose = require('mongoose')
const niveau = require('./niveau.model')

const schema = mongoose.Schema({
    nom:  { type: String, default: "" },
    prenom:  { type: String, default: "" },
    email:  { type: String, default: "" },
    password:  { type: String, default: "" },
    niveau:  { type: mongoose.Schema.Types.ObjectId, ref:'niveau' },
    specialite:  { type: String, default: "" },
    image:  { type: String, default: "" },
    notes: {type: [Object], default: [] }
})

module.exports = mongoose.model('etudiant',schema)
