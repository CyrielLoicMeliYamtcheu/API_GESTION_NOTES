const mongoose = require('mongoose')
const schema = mongoose.Schema({
    nom: {type: String, default: ""},
    intitule: {type: String, default: ""},
    coef: {type: Number, default: 0},
    modules: { type: Object, ref:'module' },
    niveau:  { type: String, default: "" },
    specialite:  { type: [Object], default: []},
    
})

module.exports = mongoose.model('matiere',schema)
