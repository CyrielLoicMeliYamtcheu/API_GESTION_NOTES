const mongoose = require('mongoose')
const niveau = require('./niveau.model')

const schema = mongoose.Schema({
    nom:  { type: String, default: "" },
    prenom:  { type: String, default: "" },
    email:  { type: String, default: "" },
    password:  { type: String, default: "" },
    matricule: {type: String, default: ""},
    niveau:  { type: Object, ref:'niveau' },
    specialite:  { type: String, default: "" },
    image:  { type: String, default: "" },
    notes: {type: [Object], default: [] },
    user: {type: Object, ref: 'user'}

})

module.exports = mongoose.model('etudiant',schema)
