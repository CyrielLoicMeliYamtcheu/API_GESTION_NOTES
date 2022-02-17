const express = require('express')
const server = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true})
mongoose.connection.on('open', () => {
    console.log('Je suis connecté à ma base de données Mongo DB')
})


const Etudiants = require('./Models/etudiant.model')
const Niveaux = require('./Models/niveau.model')
const Specialite = require('./Models/specialite.model')
const Modules = require('./Models/module.model')
const Matieres = require('./Models/matiere.model')
const Enseignants = require('./Models/enseignant.model')


server.use(cors())
server.use(bodyParser.json())


/* ******************************** LOGIN & INSCRIPTION ETUDIANT ********************************************** */
// endpoint pour le login de connexion

server.post('/signin', async function (req, res) {
    const elem = req.body
    const infos = await Etudiants.findOne({email: elem.email})
    console.log(infos)
    if(infos && bcrypt.compareSync(elem.password, infos.password)){
      console.log("le mot de passe correspond")
      const status = infos.acknowledged ? 201 : 400
      res.writeHead(status)
      res.end()

    }
   
})

// endpoint pour l'inscription de l"etudiant

server.post('/signup', async function (req, res){
  const elem = req.body

  const niveau = await Niveaux.find({nom:elem.niveau})
  console.log(niveau)
  const password = bcrypt.hashSync(elem.password, 10);
  console.log(password)

  const infos = await Etudiants.create({
    nom:elem.nom,
    prenom: elem.prenom,
    email: elem.email,
    password: password,
    niveau: niveau[0]._id,
    specialite: elem.specialite,
    image: elem.image,
    notes: elem.notes
  })

  const status = infos._id ? 201 : 400
  res.writeHead(status)
  res.end()

})


/*************************** */

server.get('/etudiant', async function (req, res) {
  const infos = await Etudiants.find().populate("niveau")
  res.json(infos)
})


server.get('/etudiant/:id', async function (req, res) {
  const { id } = req.params
  const infos = await Etudiants.findOne({ _id: id }).populate("niveau")
  console.log(infos)
  res.json(infos)

})


server.post('/etudiant', async (req, res) => {
  const elem = req.body

  const niveau = await Niveaux.find({nom:elem.nom})
  console.log(niveau)
  const specialite = await Specialite.find({nom:niveau[0].nom})
  
  console.log(specialite)

  const Etudiant = new Etudiants({
    nom: elem.nom,
    prenom: elem.prenom,
    email: elem.email,
    password: elem.password,
    niveau: niveau[0]._id,
    specialite: elem.specialite,
  
  })

 /* const savedBlog = await blog.save()
  user.blogs = user.blogs.concat(savedBlog)
  await user.save()
*/

  const infos = await Etudiants.create(Etudiant)
  const status = infos._id ? 201 : 400
  res.writeHead(status)
  res.end()

})


// endpoint update etudiant

server.put('/etudiant/:id', async (req, res) => {
  const { id } = req.params
  const elem = req.body
  const infos = await Etudiants.updateOne({ _id: id }, elem)
  console.log(infos)
  const status = infos.acknowledged ? 200 : 400
  res.writeHead(status)
  res.end()
})

// endpoint delete etudiant

server.delete('/etudiant/:id', async (req, res) => {
  const { id } = req.params
  const infos = await Etudiants.deleteOne({ _id: id })
  console.log(infos)
  res.writeHead(200)
  res.end()
})


/* *******************************************************  NIVEAU *************************************** */

// endpoint create niveau (classe)

server.post('/niveau', async (req, res) => {
  const elem = req.body
  const infos = await Niveaux.create(elem)
  const status = infos._id ? 201 : 400
  res.writeHead(status)
  res.end()
})

// endpoint affichage des niveaux

server.get('/niveau', async function (req, res) {
  const infos = await Niveaux.find()
  res.json(infos)
  console.log(infos)
})


/* *************************************************  SPECIALITE *************************************  */
// endpoint create specialite

server.post('/specialite', async (req, res) => {
  const elem = req.body
  console.log(elem.niveau)
  
  const niveau = await Niveaux.find({nom:elem.niveau})
  console.log(niveau) 
  const infos = await Specialite.create({
      nom:elem.nom,
      niveaux: niveau[0].nom
  })
  const status = infos._id ? 201 : 400
  res.writeHead(status)
  res.end()

  
})

// endpoint affichage des specialités
server.get('/specialite', async function (req, res) {
  const infos = await Specialite.find().populate("niveaux")
  res.json(infos)
  console.log(infos)
})

/* ********************** MODULES ***********************************/

server.get('/module', async function(req, res){
  const infos = await Modules.find().populate("niveau")
  res.json(infos)
  console.log(infos)
})

server.post('/module', async function(req, res){
  const elem = req.body
  const niveau = await Niveaux.find({nom:elem.niveau})
  console.log(niveau)
  const infos = await Modules.create({
      nom:elem.nom,
      coef_module: elem.coef_module,
      niveau: niveau[0]._id
  })
  const status = infos._id ? 201 : 400
  res.writeHead(status)
  res.end()

})


/******************************* MATIERES ***************************** */

server.get('/matiere', async function(req, res){
  const infos = await Matieres.find().populate("modules")
  res.json(infos)
  console.log(infos)
})

server.post('/matiere', async function(req, res){
  const elem = req.body
  const module = await Modules.find({nom:elem.modules})
  console.log(module)
  const infos = await Matieres.create({
      nom:elem.nom,
      intitule:elem.intitule,
      coef: elem.coef,
      modules: module[0]._id
  })
  const status = infos._id ? 201 : 400
  res.writeHead(status)
  res.end()

})


/* **********************  ENSEIGNANT ******************************/

server.get('/enseignant', async function(req, res){
  const infos = await Enseignants.find().populate("matieres")
  res.json(infos)
  console.log(infos)
})


server.post('/signupEnseignant', async function(req, res){
  const elem = req.body
  const password = bcrypt.hashSync(elem.password, 10);
  const matieres = await Matieres.find({nom:elem.matieres})
  console.log(matieres)

  const infos = await Enseignants.create({
      nom:elem.nom,
      prenom:elem.prenom,
      email: elem.email,
      password: password,
      matieres: matieres[0]._id
  })
  const status = infos._id ? 201 : 400
  res.writeHead(status)
  res.end()

})

server.post('/signinEnseignant', async function(req, res){
  const elem = req.body
  const infos = await Enseignants.findOne({email: elem.email})
    console.log(infos)
    if(infos && bcrypt.compareSync(elem.password, infos.password)){
      console.log("le mot de passe correspond")
      const status = infos.acknowledged ? 201 : 400
      res.writeHead(status)
      res.end()

    }
    
})





server.listen(3100)