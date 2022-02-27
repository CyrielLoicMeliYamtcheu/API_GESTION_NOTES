const mongoose = require('mongoose')

const schema = mongoose.Schema({
    nom: {type: String, default: ""},
    prenom: {type: String, default: ""},
    email: {type: String, default: ""},
    password: {type: String, default: ""},
    role: {type: String, default: "user"} 
   
})

module.exports = mongoose.model('user',schema)