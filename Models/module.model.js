const mongoose = require('mongoose') // { Schema, model}
const schema = mongoose.Schema({
    nom: {type: String, default: ""},
    coef_module: {type: Number, default: 0},
    niveaux: { type: mongoose.Schema.Types.ObjectId, ref:'niveau' }
})

module.exports = mongoose.model('module',schema)